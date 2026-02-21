package main

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

// FederationMetrics holds Prometheus metrics for federation
type FederationMetrics struct {
	MessagesSent       prometheus.Counter
	MessagesReceived   prometheus.Counter
	ConnectedServers   prometheus.Gauge
	SendQueueSize      prometheus.Gauge
	EventSendLatency   prometheus.Histogram
	ConnectionDuration prometheus.Histogram
}

// NewFederationMetrics creates and registers federation metrics
func NewFederationMetrics() *FederationMetrics {
	m := &FederationMetrics{
		MessagesSent: promauto.NewCounter(prometheus.CounterOpts{
			Name: "federation_messages_sent_total",
			Help: "Total number of federation messages sent",
		}),
		MessagesReceived: promauto.NewCounter(prometheus.CounterOpts{
			Name: "federation_messages_received_total",
			Help: "Total number of federation messages received",
		}),
		ConnectedServers: promauto.NewGauge(prometheus.GaugeOpts{
			Name: "federation_connected_servers",
			Help: "Number of connected federation servers",
		}),
		SendQueueSize: promauto.NewGauge(prometheus.GaugeOpts{
			Name: "federation_send_queue_size",
			Help: "Current size of send queue",
		}),
		EventSendLatency: promauto.NewHistogram(prometheus.HistogramOpts{
			Name:    "federation_event_send_latency_seconds",
			Help:    "Latency of sending events to other servers",
			Buckets: prometheus.DefBuckets,
		}),
		ConnectionDuration: promauto.NewHistogram(prometheus.HistogramOpts{
			Name:    "federation_connection_duration_seconds",
			Help:    "Duration of federation connections",
			Buckets: prometheus.ExponentialBuckets(60, 2, 10),
		}),
	}
	return m
}
