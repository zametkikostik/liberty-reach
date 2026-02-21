package main

import (
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

// SignalingMessage represents a WebSocket signaling message
type SignalingMessage struct {
	Type      string      `json:"type"`
	From      string      `json:"from"`
	To        string      `json:"to"`
	Room      string      `json:"room,omitempty"`
	Payload   interface{} `json:"payload,omitempty"`
	Timestamp int64       `json:"timestamp"`
}

// Message types
const (
	MsgOffer      = "offer"
	MsgAnswer     = "answer"
	MsgCandidate  = "candidate"
	MsgPing       = "ping"
	MsgPong       = "pong"
	MsgSubscribe  = "subscribe"
	MsgUnsubscribe = "unsubscribe"
	MsgPresence   = "presence"
)

// Metrics holds Prometheus metrics
type Metrics struct {
	ActiveConnections  prometheus.Gauge
	MessagesSent       prometheus.Counter
	MessagesReceived   prometheus.Counter
	RateLimitExceeded  prometheus.Counter
	ConnectionDuration prometheus.Histogram
}

// NewMetrics creates and registers metrics
func NewMetrics() *Metrics {
	m := &Metrics{
		ActiveConnections: promauto.NewGauge(prometheus.GaugeOpts{
			Name: "signaling_active_connections",
			Help: "Number of active WebSocket connections",
		}),
		MessagesSent: promauto.NewCounter(prometheus.CounterOpts{
			Name: "signaling_messages_sent_total",
			Help: "Total number of messages sent",
		}),
		MessagesReceived: promauto.NewCounter(prometheus.CounterOpts{
			Name: "signaling_messages_received_total",
			Help: "Total number of messages received",
		}),
		RateLimitExceeded: promauto.NewCounter(prometheus.CounterOpts{
			Name: "signaling_rate_limit_exceeded_total",
			Help: "Total number of rate limit exceeded events",
		}),
		ConnectionDuration: promauto.NewHistogram(prometheus.HistogramOpts{
			Name:    "signaling_connection_duration_seconds",
			Help:    "Duration of WebSocket connections",
			Buckets: prometheus.DefBuckets,
		}),
	}
	return m
}
