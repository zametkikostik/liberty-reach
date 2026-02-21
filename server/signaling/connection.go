package main

import (
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
	"golang.org/x/time/rate"
)

// Client represents a connected WebSocket client
type Client struct {
	ID           string
	UserID       string
	DeviceID     string
	Conn         *websocket.Conn
	Send         chan []byte
	Logger       *zap.Logger
	LastSeen     time.Time
	Presence     string // "online", "away", "offline"
	Subscriptions []string
}

// NewClient creates a new client
func NewClient(userID, deviceID string, conn *websocket.Conn, logger *zap.Logger) *Client {
	return &Client{
		ID:       uuid.New().String(),
		UserID:   userID,
		DeviceID: deviceID,
		Conn:     conn,
		Send:     make(chan []byte, 256),
		Logger:   logger,
		LastSeen: time.Now(),
		Presence: "online",
	}
}

// ReadPump reads messages from the WebSocket connection
func (c *Client) ReadPump(connManager *ConnectionManager) {
	defer func() {
		connManager.RemoveClient(c)
		c.Conn.Close()
	}()

	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		c.LastSeen = time.Now()
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				c.Logger.Error("WebSocket read error", zap.Error(err))
			}
			break
		}

		// Process message
		if err := c.processMessage(message, connManager); err != nil {
			c.Logger.Error("Failed to process message", zap.Error(err))
		}
	}
}

// WritePump writes messages to the WebSocket connection
func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// processMessage handles incoming messages
func (c *Client) processMessage(data []byte, connManager *ConnectionManager) error {
	var msg SignalingMessage
	if err := json.Unmarshal(data, &msg); err != nil {
		return err
	}

	msg.Timestamp = time.Now().Unix()

	switch msg.Type {
	case MsgOffer:
		return connManager.RelayMessage(msg, c.UserID)
	case MsgAnswer:
		return connManager.RelayMessage(msg, c.UserID)
	case MsgCandidate:
		return connManager.RelayMessage(msg, c.UserID)
	case MsgPing:
		return c.sendPong()
	case MsgSubscribe:
		return connManager.Subscribe(c, msg.Room)
	case MsgUnsubscribe:
		return connManager.Unsubscribe(c, msg.Room)
	}

	return nil
}

// sendPong sends a pong response
func (c *Client) sendPong() error {
	return c.Send <- []byte(`{"type":"pong"}`)
}

// Send sends a message to the client
func (c *Client) Send(msg []byte) error {
	select {
	case c.Send <- msg:
		return nil
	default:
		return errors.New("send buffer full")
	}
}

// ConnectionManager manages all client connections
type ConnectionManager struct {
	clients      map[string]*Client
	clientsMu    sync.RWMutex
	rooms        map[string]map[string]*Client // room -> client_id -> client
	roomsMu      sync.RWMutex
	redis        *redis.Client
	logger       *zap.Logger
	rateLimiters map[string]*rate.Limiter
	rateLimitersMu sync.RWMutex
	ctx          context.Context
	cancel       context.CancelFunc
}

// NewConnectionManager creates a new connection manager
func NewConnectionManager(redisClient *redis.Client, logger *zap.Logger) *ConnectionManager {
	ctx, cancel := context.WithCancel(context.Background())
	
	cm := &ConnectionManager{
		clients:      make(map[string]*Client),
		rooms:        make(map[string]map[string]*Client),
		redis:        redisClient,
		logger:       logger,
		rateLimiters: make(map[string]*rate.Limiter),
		ctx:          ctx,
		cancel:       cancel,
	}

	// Start Redis subscriber
	go cm.redisSubscriber()

	return cm
}

// AddClient adds a client to the manager
func (cm *ConnectionManager) AddClient(client *Client) {
	cm.clientsMu.Lock()
	defer cm.clientsMu.Unlock()

	cm.clients[client.ID] = client
	
	// Store in Redis for horizontal scaling
	cm.storeClientInRedis(client)
}

// RemoveClient removes a client from the manager
func (cm *ConnectionManager) RemoveClient(client *Client) {
	cm.clientsMu.Lock()
	defer cm.clientsMu.Unlock()

	delete(cm.clients, client.ID)
	
	// Remove from all rooms
	cm.roomsMu.Lock()
	for room, clients := range cm.rooms {
		delete(clients, client.ID)
		if len(clients) == 0 {
			delete(cm.rooms, room)
		}
	}
	cm.roomsMu.Unlock()
	
	// Remove from Redis
	cm.removeClientFromRedis(client)
}

// GetClient gets a client by ID
func (cm *ConnectionManager) GetClient(clientID string) (*Client, bool) {
	cm.clientsMu.RLock()
	defer cm.clientsMu.RUnlock()
	client, ok := cm.clients[clientID]
	return client, ok
}

// GetClientByUserID gets a client by user ID
func (cm *ConnectionManager) GetClientByUserID(userID string) []*Client {
	cm.clientsMu.RLock()
	defer cm.clientsMu.RUnlock()

	var clients []*Client
	for _, client := range cm.clients {
		if client.UserID == userID {
			clients = append(clients, client)
		}
	}
	return clients
}

// RelayMessage relays a message to the target user
func (cm *ConnectionManager) RelayMessage(msg SignalingMessage, fromUserID string) error {
	// Find target clients
	targetClients := cm.GetClientByUserID(msg.To)
	if len(targetClients) == 0 {
		// Try to find in Redis (other server instances)
		return cm.relayViaRedis(msg, fromUserID)
	}

	msg.From = fromUserID
	data, _ := json.Marshal(msg)

	for _, client := range targetClients {
		if err := client.Send(data); err != nil {
			cm.logger.Warn("Failed to send message", zap.Error(err))
		}
	}

	return nil
}

// Subscribe adds a client to a room
func (cm *ConnectionManager) Subscribe(client *Client, room string) error {
	cm.roomsMu.Lock()
	defer cm.roomsMu.Unlock()

	if _, ok := cm.rooms[room]; !ok {
		cm.rooms[room] = make(map[string]*Client)
	}
	cm.rooms[room][client.ID] = client
	client.Subscriptions = append(client.Subscriptions, room)

	// Subscribe in Redis
	return cm.redisSubscribe(room)
}

// Unsubscribe removes a client from a room
func (cm *ConnectionManager) Unsubscribe(client *Client, room string) error {
	cm.roomsMu.Lock()
	defer cm.roomsMu.Unlock()

	if clients, ok := cm.rooms[room]; ok {
		delete(clients, client.ID)
		if len(clients) == 0 {
			delete(cm.rooms, room)
		}
	}

	// Remove from subscriptions
	for i, r := range client.Subscriptions {
		if r == room {
			client.Subscriptions = append(client.Subscriptions[:i], client.Subscriptions[i+1:]...)
			break
		}
	}

	return nil
}

// BroadcastToRoom sends a message to all clients in a room
func (cm *ConnectionManager) BroadcastToRoom(room string, msg SignalingMessage) error {
	cm.roomsMu.RLock()
	defer cm.roomsMu.RUnlock()

	clients, ok := cm.rooms[room]
	if !ok {
		return nil
	}

	data, _ := json.Marshal(msg)
	for _, client := range clients {
		if err := client.Send(data); err != nil {
			cm.logger.Warn("Failed to broadcast", zap.Error(err))
		}
	}

	return nil
}

// GetRateLimiter gets or creates a rate limiter for a user
func (cm *ConnectionManager) GetRateLimiter(userID string) *rate.Limiter {
	cm.rateLimitersMu.RLock()
	limiter, ok := cm.rateLimiters[userID]
	cm.rateLimitersMu.RUnlock()

	if ok {
		return limiter
	}

	// Create new limiter (100 requests per second)
	limiter = rate.NewLimiter(rate.Every(time.Second/100), 100)

	cm.rateLimitersMu.Lock()
	cm.rateLimiters[userID] = limiter
	cm.rateLimitersMu.Unlock()

	return limiter
}

// Close shuts down the connection manager
func (cm *ConnectionManager) Close() {
	cm.cancel()
	
	cm.clientsMu.Lock()
	for _, client := range cm.clients {
		client.Conn.Close()
	}
	cm.clientsMu.Unlock()
}

// WebSocket timing constants
const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512 * 1024
)
