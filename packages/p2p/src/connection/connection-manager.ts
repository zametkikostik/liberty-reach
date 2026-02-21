/**
 * Connection Manager - P2P Connection State Machine
 * 
 * Manages the connection lifecycle with fallback strategies:
 * DIRECT → STUN_PUNCH → SYMMETRIC_BYPASS → TURN → WEBSOCKET
 */

import { IceAgent } from '../ice/ice-agent.js';
import { StunClient } from '../stun/stun-client.js';
import { TurnClient } from '../turn/turn-client.js';
import { SignalingClient } from '../signaling/signaling-client.js';
import type {
  ConnectionState,
  ConnectionStrategy,
  NetworkMetrics,
  ConnectionQuality,
  IceConfig,
  TurnServer,
  StunServer,
  P2PError,
} from '../types.js';
import {
  QUALITY_THRESHOLDS,
  DEFAULT_STUN_SERVERS,
  TURN_BANDWIDTH_ESTIMATE,
} from '../types.js';
import { createP2PError, calculateConnectionQuality } from '../utils/p2p-utils.js';

/**
 * Connection event handlers
 */
export interface ConnectionHandlers {
  onStateChange?: (state: ConnectionState) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onFailed?: (error: P2PError) => void;
  onMetrics?: (metrics: NetworkMetrics) => void;
  onData?: (data: Uint8Array) => void;
}

/**
 * Connection configuration
 */
export interface ConnectionConfig {
  peerId: string;
  localPeerId: string;
  iceConfig?: Partial<IceConfig>;
  strategy?: ConnectionStrategy;
  signalingUrl: string;
  turnServers?: TurnServer[];
}

/**
 * ConnectionManager - Manages P2P connections with NAT traversal
 * 
 * Implements a state machine for connection establishment:
 * 
 * 1. INITIALIZING - Setting up connection
 * 2. GATHERING - Collecting ICE candidates
 * 3. CONNECTING - Attempting connection
 * 4. DIRECT - Direct P2P connection (same LAN or public IP)
 * 5. STUN_PUNCH - UDP hole punching via STUN
 * 6. SYMMETRIC_BYPASS - Port prediction for symmetric NAT
 * 7. TURN_RELAY - Relayed connection via TURN
 * 8. WEBSOCKET_FALLBACK - WebSocket via signaling server
 * 9. CONNECTED - Successfully connected
 * 10. DISCONNECTED - Connection lost
 * 11. FAILED - Connection failed
 * 
 * NAT Traversal Priority:
 * 1. Direct connection (lowest latency)
 * 2. UDP hole punching (most NATs)
 * 3. Port prediction (symmetric NAT)
 * 4. TURN relay (guaranteed but higher latency)
 * 5. WebSocket fallback (last resort)
 */
export class ConnectionManager {
  private config: ConnectionConfig;
  private state: ConnectionState = 'INITIALIZING';
  private iceAgent: IceAgent;
  private signalingClient: SignalingClient;
  private turnClient: TurnClient | null = null;
  private stunClients: StunClient[] = [];
  
  private metrics: NetworkMetrics | null = null;
  private metricsInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  private handlers: ConnectionHandlers = {};

  /**
   * Create a new Connection Manager
   * 
   * @param config - Connection configuration
   */
  constructor(config: ConnectionConfig) {
    this.config = config;

    // Initialize ICE agent
    this.iceAgent = new IceAgent({
      ...config.iceConfig,
      turnServers: config.turnServers || [],
    });

    // Initialize signaling client
    this.signalingClient = new SignalingClient(config.signalingUrl, {
      peerId: config.peerId,
      localPeerId: config.localPeerId,
    });

    // Initialize STUN clients
    const stunServers = config.iceConfig?.stunServers || DEFAULT_STUN_SERVERS;
    this.stunClients = stunServers.map((server) => new StunClient(server));

    // Setup ICE agent callbacks
    this.setupIceCallbacks();
    this.setupSignalingCallbacks();
  }

  /**
   * Set event handlers
   */
  setHandlers(handlers: ConnectionHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Start connection to peer
   */
  async connect(): Promise<void> {
    this.setState('GATHERING');

    try {
      // Connect to signaling server
      await this.signalingClient.connect();

      // Start ICE gathering
      await this.iceAgent.startGathering();

      // Send offer to peer
      await this.sendOffer();

      this.setState('CONNECTING');
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * Accept incoming connection
   */
  async accept(offer: unknown): Promise<void> {
    this.setState('GATHERING');

    try {
      // Connect to signaling server
      await this.signalingClient.connect();

      // Start ICE gathering
      await this.iceAgent.startGathering();

      // Send answer
      await this.sendAnswer(offer);

      this.setState('CONNECTING');
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * Send data to peer
   */
  async send(data: Uint8Array): Promise<void> {
    if (this.state !== 'CONNECTED') {
      throw createP2PError('INVALID_STATE', 'Not connected');
    }

    // Send via appropriate channel based on connection type
    // Implementation depends on actual transport
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    this.setState('DISCONNECTED');

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    await this.iceAgent.stop();
    await this.signalingClient.disconnect();
    
    if (this.turnClient) {
      await this.turnClient.release();
      this.turnClient = null;
    }

    this.reconnectAttempts = 0;
  }

  /**
   * Get current network metrics
   */
  getMetrics(): NetworkMetrics | null {
    return this.metrics;
  }

  /**
   * Get connection quality
   */
  getQuality(): ConnectionQuality {
    if (!this.metrics || this.state !== 'CONNECTED') {
      return 'FAILED';
    }

    return calculateConnectionQuality(this.metrics);
  }

  /**
   * Attempt to reconnect
   */
  async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.handleError(createP2PError('CONNECTION_FAILED', 'Max reconnect attempts reached'));
      return;
    }

    this.reconnectAttempts++;
    this.setState('INITIALIZING');
    
    await this.connect();
  }

  // ============================================================================
  // Private methods
  // ============================================================================

  private setState(state: ConnectionState): void {
    this.state = state;
    
    if (this.handlers.onStateChange) {
      this.handlers.onStateChange(state);
    }

    // Handle state transitions
    this.onStateTransition(state);
  }

  private onStateTransition(state: ConnectionState): void {
    switch (state) {
      case 'CONNECTED':
        if (this.handlers.onConnected) {
          this.handlers.onConnected();
        }
        this.startMetricsCollection();
        this.reconnectAttempts = 0;
        break;

      case 'DISCONNECTED':
        if (this.handlers.onDisconnected) {
          this.handlers.onDisconnected();
        }
        if (this.metricsInterval) {
          clearInterval(this.metricsInterval);
          this.metricsInterval = null;
        }
        break;

      case 'FAILED':
        if (this.handlers.onFailed) {
          this.handlers.onFailed(createP2PError('CONNECTION_FAILED', 'Connection failed'));
        }
        break;

      case 'TURN_RELAY':
        // Initialize TURN client when falling back to relay
        this.initializeTurnClient();
        break;
    }
  }

  private setupIceCallbacks(): void {
    this.iceAgent.onCandidate = (candidate) => {
      this.signalingClient.sendCandidate(candidate);
    };

    this.iceAgent.onStateChange = (iceState) => {
      if (iceState === 'COMPLETED' && this.state === 'CONNECTING') {
        const selectedPair = this.iceAgent.getSelectedPair();
        
        if (selectedPair) {
          // Determine connection type based on candidate types
          if (selectedPair.local.type === 'host' && selectedPair.remote.type === 'host') {
            this.setState('DIRECT');
          } else if (selectedPair.local.type === 'relay' || selectedPair.remote.type === 'relay') {
            this.setState('TURN_RELAY');
          } else {
            this.setState('STUN_PUNCH');
          }

          this.setState('CONNECTED');
        }
      } else if (iceState === 'FAILED') {
        this.attemptFallback();
      }
    };

    this.iceAgent.onError = (error) => {
      console.error('ICE error:', error);
    };
  }

  private setupSignalingCallbacks(): void {
    this.signalingClient.onCandidate = (candidate) => {
      this.iceAgent.addRemoteCandidate(candidate);
    };

    this.signalingClient.onOffer = async (offer) => {
      await this.accept(offer);
    };

    this.signalingClient.onClose = () => {
      this.setState('DISCONNECTED');
    };
  }

  private async sendOffer(): Promise<void> {
    const localCandidates = this.iceAgent.getLocalCandidates();
    await this.signalingClient.sendOffer({
      candidates: localCandidates,
      // Include SDP or other connection info
    });
  }

  private async sendAnswer(offer: unknown): Promise<void> {
    const localCandidates = this.iceAgent.getLocalCandidates();
    await this.signalingClient.sendAnswer({
      candidates: localCandidates,
      // Include SDP or other connection info
    });
  }

  private attemptFallback(): void {
    // Try next fallback strategy
    switch (this.state) {
      case 'STUN_PUNCH':
        // Try symmetric NAT bypass
        this.setState('SYMMETRIC_BYPASS');
        this.attemptSymmetricBypass();
        break;

      case 'SYMMETRIC_BYPASS':
        // Fall back to TURN
        this.setState('TURN_RELAY');
        this.initializeTurnClient();
        break;

      case 'TURN_RELAY':
        // Fall back to WebSocket
        this.setState('WEBSOCKET_FALLBACK');
        this.attemptWebSocketFallback();
        break;

      case 'WEBSOCKET_FALLBACK':
        // All strategies failed
        this.setState('FAILED');
        break;
    }
  }

  private async attemptSymmetricBypass(): Promise<void> {
    // Implement port prediction for symmetric NAT
    // This involves sending packets to predicted ports
    
    // For now, just move to next fallback after timeout
    setTimeout(() => {
      if (this.state === 'SYMMETRIC_BYPASS') {
        this.attemptFallback();
      }
    }, 5000);
  }

  private async initializeTurnClient(): Promise<void> {
    const turnServers = this.config.turnServers || [];
    
    if (turnServers.length === 0) {
      // No TURN servers configured, skip to WebSocket
      this.attemptFallback();
      return;
    }

    try {
      this.turnClient = new TurnClient(turnServers[0]!);
      await this.turnClient.allocate({
        username: turnServers[0].username || '',
        password: '',
      });

      // Add relay candidate to ICE
      const relayCandidate = this.turnClient.getRelayCandidate();
      if (relayCandidate) {
        this.iceAgent.addRemoteCandidate(relayCandidate);
      }
    } catch (error) {
      console.error('TURN initialization failed:', error);
      this.attemptFallback();
    }
  }

  private async attemptWebSocketFallback(): Promise<void> {
    // Use signaling server as WebSocket relay
    // All messages go through server (E2E encrypted)
    
    // For now, just mark as failed
    setTimeout(() => {
      if (this.state === 'WEBSOCKET_FALLBACK') {
        this.setState('FAILED');
      }
    }, 5000);
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, 1000);
  }

  private collectMetrics(): void {
    // Collect network metrics
    const selectedPair = this.iceAgent.getSelectedPair();
    
    if (!selectedPair) {
      return;
    }

    // Simulate metrics collection
    // In production, use getStats() API for WebRTC
    this.metrics = {
      rtt: 50 + Math.random() * 50,
      jitter: 5 + Math.random() * 10,
      packetsSent: Math.floor(Math.random() * 10000),
      packetsReceived: Math.floor(Math.random() * 10000),
      packetsLost: Math.floor(Math.random() * 100),
      packetLossRate: Math.random() * 0.05,
      availableBandwidth: selectedPair.local.type === 'relay' 
        ? TURN_BANDWIDTH_ESTIMATE 
        : 1000000,
      estimatedBandwidth: selectedPair.local.type === 'relay'
        ? TURN_BANDWIDTH_ESTIMATE
        : 800000,
      candidateType: selectedPair.local.type,
      natType: 2, // Placeholder
      timestamp: Date.now(),
    };

    if (this.handlers.onMetrics && this.metrics) {
      this.handlers.onMetrics(this.metrics);
    }
  }

  private handleError(error: Error): void {
    console.error('ConnectionManager error:', error);
    this.setState('FAILED');
    
    if (this.handlers.onFailed) {
      this.handlers.onFailed(error as P2PError);
    }
  }
}
