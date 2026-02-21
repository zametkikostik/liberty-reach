package main

import (
	"context"
	"encoding/json"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

// FederationServer handles inter-server communication
type FederationServer struct {
	serverName   string
	serverKey    string
	redis        *redis.Client
	logger       *zap.Logger
	connections  map[string]*FederationConnection
	connectionsMu sync.RWMutex
	ctx          context.Context
	cancel       context.CancelFunc
}

// FederationConnection represents a connection to another server
type FederationConnection struct {
	ServerName   string
	WebSocket    *websocket.Conn
	LastSeen     time.Time
	Connected    bool
	Outbox       chan FederationMessage
}

// FederationMessage represents a message to send to another server
type FederationMessage struct {
	Type      string      `json:"type"`
	DestServer string     `json:"dest_server"`
	Payload   interface{} `json:"payload"`
	Timestamp int64       `json:"timestamp"`
}

// NewFederationServer creates a new federation server
func NewFederationServer(serverName, serverKey string, redisClient *redis.Client, logger *zap.Logger) *FederationServer {
	ctx, cancel := context.WithCancel(context.Background())
	
	fs := &FederationServer{
		serverName:  serverName,
		serverKey:   serverKey,
		redis:       redisClient,
		logger:      logger,
		connections: make(map[string]*FederationConnection),
		ctx:         ctx,
		cancel:      cancel,
	}

	// Start background tasks
	go fs.discoveryLoop()
	go fs.queueProcessor()

	return fs
}

// Close shuts down the federation server
func (fs *FederationServer) Close() {
	fs.cancel()
	
	fs.connectionsMu.Lock()
	for _, conn := range fs.connections {
		if conn.WebSocket != nil {
			conn.WebSocket.Close()
		}
		close(conn.Outbox)
	}
	fs.connectionsMu.Unlock()
}

// SendMessage sends a message to another federation server
func (fs *FederationServer) SendMessage(destServer string, payload interface{}) error {
	msg := FederationMessage{
		Type:       "message",
		DestServer: destServer,
		Payload:    payload,
		Timestamp:  time.Now().Unix(),
	}

	// Try to send via existing connection
	fs.connectionsMu.RLock()
	conn, ok := fs.connections[destServer]
	fs.connectionsMu.RUnlock()

	if ok && conn.Connected {
		select {
		case conn.Outbox <- msg:
			return nil
		default:
			// Queue full, will be processed by queue processor
		}
	}

	// Queue for later delivery
	return fs.queueMessage(destServer, msg)
}

// BroadcastMessage sends a message to all connected servers
func (fs *FederationServer) BroadcastMessage(payload interface{}) error {
	fs.connectionsMu.RLock()
	defer fs.connectionsMu.RUnlock()

	for serverName, conn := range fs.connections {
		if conn.Connected {
			msg := FederationMessage{
				Type:       "broadcast",
				DestServer: serverName,
				Payload:    payload,
				Timestamp:  time.Now().Unix(),
			}
			
			select {
			case conn.Outbox <- msg:
			default:
				fs.queueMessage(serverName, msg)
			}
		}
	}

	return nil
}

// ConnectToServer establishes a connection to another federation server
func (fs *FederationServer) ConnectToServer(serverName string) error {
	// Resolve server address via DNS or well-known
	addr, err := fs.resolveServer(serverName)
	if err != nil {
		return err
	}

	// Establish WebSocket connection
	conn, _, err := websocket.DefaultDialer.Dial(fs.ctx, addr, nil)
	if err != nil {
		return err
	}

	fs.connectionsMu.Lock()
	defer fs.connectionsMu.Unlock()

	// Create or update connection
	fedConn := &FederationConnection{
		ServerName: serverName,
		WebSocket:  conn,
		LastSeen:   time.Now(),
		Connected:  true,
		Outbox:     make(chan FederationMessage, 1000),
	}

	fs.connections[serverName] = fedConn

	// Start connection handlers
	go fs.handleConnection(fedConn)

	return nil
}

// handleConnection manages a federation connection
func (fs *FederationServer) handleConnection(conn *FederationConnection) {
	// Read pump
	go func() {
		defer func() {
			conn.Connected = false
			conn.WebSocket.Close()
		}()

		for {
			_, message, err := conn.WebSocket.ReadMessage()
			if err != nil {
				fs.logger.Error("Failed to read from federation connection",
					zap.String("server", conn.ServerName),
					zap.Error(err))
				return
			}

			if err := fs.processIncomingMessage(conn.ServerName, message); err != nil {
				fs.logger.Error("Failed to process federation message", zap.Error(err))
			}

			conn.LastSeen = time.Now()
		}
	}()

	// Write pump
	for msg := range conn.Outbox {
		data, err := json.Marshal(msg)
		if err != nil {
			fs.logger.Error("Failed to marshal message", zap.Error(err))
			continue
		}

		conn.WebSocket.SetWriteDeadline(time.Now().Add(10 * time.Second))
		if err := conn.WebSocket.WriteMessage(websocket.TextMessage, data); err != nil {
			fs.logger.Error("Failed to write to federation connection", zap.Error(err))
			conn.WebSocket.Close()
			conn.Connected = false
			break
		}

		metrics.MessagesSent.Inc()
	}
}

// processIncomingMessage handles incoming federation messages
func (fs *FederationServer) processIncomingMessage(sourceServer string, data []byte) error {
	var msg FederationMessage
	if err := json.Unmarshal(data, &msg); err != nil {
		return err
	}

	fs.logger.Info("Received federation message",
		zap.String("from", sourceServer),
		zap.String("type", msg.Type))

	// Process based on message type
	switch msg.Type {
	case "message":
		// Route to local recipients
		return fs.routeToLocalRecipients(msg.Payload)
	case "broadcast":
		// Handle broadcast
		return fs.handleBroadcast(sourceServer, msg.Payload)
	}

	return nil
}

// discoveryLoop periodically discovers federation peers
func (fs *FederationServer) discoveryLoop() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-fs.ctx.Done():
			return
		case <-ticker.C:
			fs.discoverPeers()
		}
	}
}

// discoverPeers finds federation peers via DNS and Redis
func (fs *FederationServer) discoverPeers() {
	// Get known servers from Redis
	servers, err := fs.getKnownServers()
	if err != nil {
		fs.logger.Error("Failed to get known servers", zap.Error(err))
		return
	}

	// Connect to new servers
	for _, server := range servers {
		fs.connectionsMu.RLock()
		_, connected := fs.connections[server]
		fs.connectionsMu.RUnlock()

		if !connected {
			if err := fs.ConnectToServer(server); err != nil {
				fs.logger.Warn("Failed to connect to server",
					zap.String("server", server),
					zap.Error(err))
			}
		}
	}
}

// queueProcessor processes queued messages
func (fs *FederationServer) queueProcessor() {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-fs.ctx.Done():
			return
		case <-ticker.C:
			fs.processQueuedMessages()
		}
	}
}

// Helper methods (stubs for brevity)

func (fs *FederationServer) resolveServer(serverName string) (string, error) {
	// In production: DNS SRV lookup or .well-known
	return "wss://" + serverName + "/_matrix/federation/v1/ws", nil
}

func (fs *FederationServer) queueMessage(server string, msg FederationMessage) error {
	key := "federation:queue:" + server
	data, _ := json.Marshal(msg)
	return fs.redis.LPush(fs.ctx, key, data).Err()
}

func (fs *FederationServer) processQueuedMessages() {
	// Process queued messages for reconnection
}

func (fs *FederationServer) getKnownServers() ([]string, error) {
	// Get list of known federation servers from Redis
	result := fs.redis.Keys(fs.ctx, "federation:server:*").Val()
	servers := make([]string, len(result))
	for i, key := range result {
		servers[i] = key[len("federation:server:"):]
	}
	return servers, nil
}

func (fs *FederationServer) routeToLocalRecipients(payload interface{}) error {
	// Route message to local recipients via Redis pub/sub
	return fs.redis.Publish(fs.ctx, "federation:incoming", payload).Err()
}

func (fs *FederationServer) handleBroadcast(sourceServer string, payload interface{}) error {
	// Handle broadcast message
	fs.logger.Info("Received broadcast", zap.String("from", sourceServer))
	return nil
}

// Add missing import
import "github.com/gorilla/websocket"
