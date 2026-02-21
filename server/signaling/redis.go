package main

import (
	"context"
	"encoding/json"
	"time"

	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

// Redis keys
const (
	redisClientKey    = "lr:client:"
	redisRoomKey      = "lr:room:"
	redisPresenceKey  = "lr:presence:"
	redisPubSubChannel = "lr:signaling"
)

// newRedisClient creates a new Redis client
func newRedisClient(addr string) (*redis.Client, error) {
	client := redis.NewClient(&redis.Options{
		Addr:        addr,
		PoolSize:    100,
		MinIdleConns: 10,
		ConnMaxIdleTime: time.Minute,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, err
	}

	return client, nil
}

// storeClientInRedis stores client info in Redis
func (cm *ConnectionManager) storeClientInRedis(client *Client) {
	ctx := context.Background()
	key := redisClientKey + client.UserID + ":" + client.DeviceID

	data := map[string]interface{}{
		"client_id":   client.ID,
		"user_id":     client.UserID,
		"device_id":   client.DeviceID,
		"server_id":   getServerID(),
		"last_seen":   client.LastSeen.Unix(),
		"presence":    client.Presence,
	}

	jsonData, _ := json.Marshal(data)
	cm.redis.Set(ctx, key, jsonData, time.Hour).Err()
}

// removeClientFromRedis removes client from Redis
func (cm *ConnectionManager) removeClientFromRedis(client *Client) {
	ctx := context.Background()
	key := redisClientKey + client.UserID + ":" + client.DeviceID
	cm.redis.Del(ctx, key).Err()
}

// redisSubscribe subscribes to Redis pub/sub for cross-server messaging
func (cm *ConnectionManager) redisSubscribe(room string) error {
	ctx := context.Background()
	pubsub := cm.redis.Subscribe(ctx, redisPubSubChannel)
	
	go func() {
		ch := pubsub.Channel()
		for {
			select {
			case <-cm.ctx.Done():
				pubsub.Close()
				return
			case msg := <-ch:
				var signalingMsg SignalingMessage
				if err := json.Unmarshal([]byte(msg.Payload), &signalingMsg); err != nil {
					continue
				}
				
				// Only process if message is for this room
				if signalingMsg.Room == room {
					cm.BroadcastToRoom(room, signalingMsg)
				}
			}
		}
	}()
	
	return nil
}

// relayViaRedis relays message via Redis pub/sub
func (cm *ConnectionManager) relayViaRedis(msg SignalingMessage, fromUserID string) error {
	ctx := context.Background()
	
	// Try to find target on another server
	key := redisClientKey + msg.To + ":*"
	keys, err := cm.redis.Keys(ctx, key).Result()
	if err != nil || len(keys) == 0 {
		return nil // Target not found anywhere
	}

	// Publish to Redis pub/sub
	msg.From = fromUserID
	data, _ := json.Marshal(msg)
	
	return cm.redis.Publish(ctx, redisPubSubChannel, string(data)).Err()
}

// redisSubscriber listens to Redis pub/sub
func (cm *ConnectionManager) redisSubscriber() {
	pubsub := cm.redis.Subscribe(cm.ctx, redisPubSubChannel)
	defer pubsub.Close()

	ch := pubsub.Channel()
	for {
		select {
		case <-cm.ctx.Done():
			return
		case msg := <-ch:
			var signalingMsg SignalingMessage
			if err := json.Unmarshal([]byte(msg.Payload), &signalingMsg); err != nil {
				continue
			}
			
			// Skip if from this server
			if signalingMsg.From == "" {
				continue
			}
			
			// Relay to local clients
			cm.RelayMessage(signalingMsg, signalingMsg.From)
		}
	}
}

// UpdatePresence updates user presence in Redis
func (cm *ConnectionManager) UpdatePresence(userID, presence string) {
	ctx := context.Background()
	key := redisPresenceKey + userID
	
	data := map[string]interface{}{
		"presence":  presence,
		"timestamp": time.Now().Unix(),
	}
	
	jsonData, _ := json.Marshal(data)
	cm.redis.Set(ctx, key, jsonData, time.Hour).Err()
	
	// Publish presence update
	msg := SignalingMessage{
		Type:      MsgPresence,
		To:        userID,
		Payload:   data,
		Timestamp: time.Now().Unix(),
	}
	data, _ = json.Marshal(msg)
	cm.redis.Publish(ctx, redisPubSubChannel, string(data)).Err()
}

// GetPresence gets user presence from Redis
func (cm *ConnectionManager) GetPresence(userID string) (string, error) {
	ctx := context.Background()
	key := redisPresenceKey + userID
	
	data, err := cm.redis.Get(ctx, key).Result()
	if err != nil {
		return "offline", nil
	}
	
	var presence map[string]interface{}
	if err := json.Unmarshal([]byte(data), &presence); err != nil {
		return "offline", nil
	}
	
	if p, ok := presence["presence"].(string); ok {
		return p, nil
	}
	
	return "offline", nil
}

// Server ID for distributed setup
var serverID string

func getServerID() string {
	if serverID == "" {
		serverID = generateServerID()
	}
	return serverID
}

func generateServerID() string {
	// In production, use hostname or container ID
	return "server-" + time.Now().Format("20060102150405")
}
