// Liberty Reach Federation Server
// Matrix-like federation protocol for inter-server communication
package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.uber.org/zap"
)

var (
	addr       = flag.String("addr", ":8082", "HTTP server address")
	serverName = flag.String("server-name", "libertyreach.io", "Federation server name")
	serverKey  = flag.String("server-key", os.Getenv("FEDERATION_KEY"), "Server private key")
	redisAddr  = flag.String("redis", "localhost:6379", "Redis server address")
)

var (
	logger     *zap.Logger
	upgrader   = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin:     func(r *http.Request) bool { return true },
	}
	metrics = NewFederationMetrics()
)

func main() {
	flag.Parse()

	var err error
	logger, err = zap.NewProduction()
	if err != nil {
		log.Fatalf("Failed to create logger: %v", err)
	}
	defer logger.Sync()

	// Initialize components
	redisClient, err := newRedisClient(*redisAddr)
	if err != nil {
		logger.Fatal("Failed to connect to Redis", zap.Error(err))
	}
	defer redisClient.Close()

	server := NewFederationServer(*serverName, *serverKey, redisClient, logger)

	// Setup routes
	router := mux.NewRouter()
	
	// Federation API
	router.HandleFunc("/_matrix/federation/v1/send/{txnID}", server.handleSend).Methods("PUT")
	router.HandleFunc("/_matrix/federation/v1/query/directory", server.handleQueryDirectory).Methods("GET")
	router.HandleFunc("/_matrix/federation/v1/query/profile", server.handleQueryProfile).Methods("GET")
	router.HandleFunc("/_matrix/federation/v1/event/{eventID}", server.handleQueryEvent).Methods("GET")
	router.HandleFunc("/_matrix/federation/v1/backfill/{roomID}", server.handleBackfill).Methods("GET")
	router.HandleFunc("/_matrix/federation/v1/publicRooms", server.handlePublicRooms).Methods("GET")
	
	// WebSocket federation connections
	router.HandleFunc("/_matrix/federation/v1/ws", server.handleWebSocket).Methods("GET")
	
	// Well-known discovery
	router.HandleFunc("/.well-known/matrix/server", server.handleWellKnown).Methods("GET")
	router.HandleFunc("/.well-known/matrix/client", server.handleClientWellKnown).Methods("GET")
	
	// Health and metrics
	router.HandleFunc("/health", handleHealth).Methods("GET")
	router.HandleFunc("/metrics", promhttp.Handler().ServeHTTP).Methods("GET")

	// Create server
	httpServer := &http.Server{
		Addr:         *addr,
		Handler:      router,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// Graceful shutdown
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		logger.Info("Starting Federation Server",
			zap.String("address", *addr),
			zap.String("server-name", *serverName))
		
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("Server failed", zap.Error(err))
		}
	}()

	<-ctx.Done()
	
	logger.Info("Shutting down federation server...")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	
	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		logger.Error("Server shutdown failed", zap.Error(err))
	}

	server.Close()
	logger.Info("Federation server stopped")
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"status":"healthy","timestamp":%d}`, time.Now().Unix())
}
