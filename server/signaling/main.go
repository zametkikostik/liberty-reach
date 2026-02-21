// Liberty Reach Signaling Server
// WebSocket signaling for P2P connection establishment
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
	"golang.org/x/time/rate"
)

var (
	addr        = flag.String("addr", ":8080", "HTTP server address")
	redisAddr   = flag.String("redis", "localhost:6379", "Redis server address")
	jwtSecret   = flag.String("jwt-secret", os.Getenv("JWT_SECRET"), "JWT secret key")
	certFile    = flag.String("cert", "", "TLS certificate file")
	keyFile     = flag.String("key", "", "TLS key file")
	verbose     = flag.Bool("verbose", false, "Enable verbose logging")
)

var (
	logger *zap.Logger
	upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			// Allow all origins for now (configure in production)
			return true
		},
	}
	
	// Metrics
	metrics = NewMetrics()
)

func main() {
	flag.Parse()
	
	// Initialize logger
	var err error
	if *verbose {
		logger, err = zap.NewDevelopment()
	} else {
		logger, err = zap.NewProduction()
	}
	if err != nil {
		log.Fatalf("Failed to create logger: %v", err)
	}
	defer logger.Sync()
	
	// Initialize Redis
	redisClient, err := newRedisClient(*redisAddr)
	if err != nil {
		logger.Fatal("Failed to connect to Redis", zap.Error(err))
	}
	defer redisClient.Close()
	
	// Initialize connection manager
	connManager := NewConnectionManager(redisClient, logger)
	
	// Setup HTTP routes
	router := mux.NewRouter()
	router.HandleFunc("/ws", handleWebSocket(connManager)).Methods("GET")
	router.HandleFunc("/health", handleHealth).Methods("GET")
	router.HandleFunc("/metrics", promhttp.Handler().ServeHTTP).Methods("GET")
	
	// Create server
	server := &http.Server{
		Addr:         *addr,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}
	
	// Graceful shutdown
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	
	// Start server
	go func() {
		logger.Info("Starting signaling server", 
			zap.String("address", *addr),
			zap.String("redis", *redisAddr))
		
		if *certFile != "" && *keyFile != "" {
			err = server.ListenAndServeTLS(*certFile, *keyFile)
		} else {
			err = server.ListenAndServe()
		}
		
		if err != nil && err != http.ErrServerClosed {
			logger.Fatal("Server failed", zap.Error(err))
		}
	}()
	
	// Wait for shutdown signal
	<-ctx.Done()
	
	// Graceful shutdown
	logger.Info("Shutting down server...")
	
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	
	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Error("Server shutdown failed", zap.Error(err))
	}
	
	connManager.Close()
	logger.Info("Server stopped")
}

// handleWebSocket handles WebSocket connections
func handleWebSocket(connManager *ConnectionManager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Authenticate
		token := r.URL.Query().Get("token")
		if token == "" {
			http.Error(w, "Missing token", http.StatusUnauthorized)
			return
		}
		
		claims, err := validateJWT(token, *jwtSecret)
		if err != nil {
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}
		
		// Rate limiting
		limiter := connManager.GetRateLimiter(claims.UserID)
		if limiter.Allow() == rate.LimitExceeded {
			http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
			metrics.RateLimitExceeded.Inc()
			return
		}
		
		// Upgrade to WebSocket
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			logger.Error("WebSocket upgrade failed", zap.Error(err))
			return
		}
		
		// Create client session
		client := NewClient(claims.UserID, claims.DeviceID, conn, logger)
		
		// Register client
		connManager.AddClient(client)
		metrics.ActiveConnections.Inc()
		
		// Handle client messages
		go client.ReadPump(connManager)
		go client.WritePump()
		
		logger.Info("Client connected",
			zap.String("user_id", claims.UserID),
			zap.String("device_id", claims.DeviceID),
			zap.String("remote_addr", r.RemoteAddr))
	}
}

// handleHealth handles health check requests
func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"healthy","timestamp":` + fmt.Sprintf("%d", time.Now().Unix()) + `}`))
}
