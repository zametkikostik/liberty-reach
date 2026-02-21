/**
 * ICE Agent - Interactive Connectivity Establishment
 * 
 * Implements ICE (RFC 8445) for NAT traversal.
 * Gathers host, server-reflexive, and relay candidates.
 */

import type { IceCandidate, IceCandidateType, IceState, IceConfig, P2PError } from '../types.js';
import {
  MAX_CANDIDATE_PAIRS,
  ICE_TIMEOUT,
  DEFAULT_STUN_SERVERS,
} from '../types.js';
import { createP2PError, parseCandidate, serializeCandidate } from '../utils/p2p-utils.js';

/**
 * ICE Agent - Manages ICE candidate gathering and connectivity checks
 * 
 * Implements ICE (RFC 8445) for establishing P2P connections through NATs.
 * 
 * Candidate gathering order:
 * 1. Host candidates (local interfaces)
 * 2. Server-reflexive candidates (STUN)
 * 3. Relay candidates (TURN)
 * 
 * Connectivity check priority:
 * 1. Host-Host pairs
 * 2. Host-Reflexive pairs
 * 3. Reflexive-Host pairs
 * 4. Reflexive-Reflexive pairs
 * 5. Relay pairs (last resort)
 */
export class IceAgent {
  private config: IceConfig;
  private state: IceState = 'NEW';
  private localCandidates: Map<string, IceCandidate> = new Map();
  private remoteCandidates: Map<string, IceCandidate> = new Map();
  private candidatePairs: Array<{ local: IceCandidate; remote: IceCandidate; priority: number }> = [];
  private selectedPair: { local: IceCandidate; remote: IceCandidate } | null = null;
  private gatheringComplete = false;
  private gatheringTimeoutId: ReturnType<typeof setTimeout> | null = null;
  
  // Event callbacks
  onCandidate?: (candidate: IceCandidate) => void;
  onStateChange?: (state: IceState) => void;
  onError?: (error: P2PError) => void;

  /**
   * Create a new ICE Agent
   * 
   * @param config - ICE configuration with STUN/TURN servers
   */
  constructor(config: Partial<IceConfig> = {}) {
    this.config = {
      stunServers: config.stunServers || DEFAULT_STUN_SERVERS,
      turnServers: config.turnServers || [],
      iceLite: config.iceLite || false,
      gatheringTimeout: config.gatheringTimeout || ICE_TIMEOUT,
      connectionTimeout: config.connectionTimeout || 30000,
      maxCandidatePairs: config.maxCandidatePairs || MAX_CANDIDATE_PAIRS,
    };
  }

  /**
   * Get current ICE state
   */
  getState(): IceState {
    return this.state;
  }

  /**
   * Start ICE candidate gathering
   * 
   * Begins gathering candidates from all configured sources.
   * Candidates are emitted via the onCandidate callback.
   */
  async startGathering(): Promise<void> {
    if (this.state !== 'NEW') {
      throw createP2PError('INVALID_STATE', 'ICE Agent not in NEW state');
    }

    this.setState('GATHERING');
    this.localCandidates.clear();
    this.candidatePairs = [];

    // Set gathering timeout
    this.gatheringTimeoutId = setTimeout(() => {
      this.onGatheringTimeout();
    }, this.config.gatheringTimeout);

    try {
      // Gather host candidates
      await this.gatherHostCandidates();

      // Gather STUN candidates
      await this.gatherStunCandidates();

      // Gather TURN candidates
      await this.gatherTurnCandidates();

      // Mark gathering as complete
      this.gatheringComplete = true;
      
      if (this.gatheringTimeoutId) {
        clearTimeout(this.gatheringTimeoutId);
        this.gatheringTimeoutId = null;
      }

      // Start connectivity checks
      await this.startConnectivityChecks();
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * Add a remote candidate
   * 
   * @param candidate - Remote ICE candidate
   */
  addRemoteCandidate(candidate: IceCandidate): void {
    const key = this.getCandidateKey(candidate);
    this.remoteCandidates.set(key, candidate);

    // Restart connectivity checks if we have new candidates
    if (this.state === 'CONNECTED' || this.state === 'COMPLETED') {
      this.startConnectivityChecks();
    }
  }

  /**
   * Set remote candidates complete
   * 
   * Indicates that all remote candidates have been received.
   */
  setRemoteCandidatesComplete(): void {
    this.startConnectivityChecks();
  }

  /**
   * Get local candidates
   */
  getLocalCandidates(): IceCandidate[] {
    return Array.from(this.localCandidates.values());
  }

  /**
   * Get remote candidates
   */
  getRemoteCandidates(): IceCandidate[] {
    return Array.from(this.remoteCandidates.values());
  }

  /**
   * Get the selected candidate pair
   */
  getSelectedPair(): { local: IceCandidate; remote: IceCandidate } | null {
    return this.selectedPair;
  }

  /**
   * Get ICE connection state
   */
  isGatheringComplete(): boolean {
    return this.gatheringComplete;
  }

  /**
   * Restart ICE (for connection recovery)
   */
  async restart(): Promise<void> {
    this.stop();
    this.state = 'NEW';
    this.gatheringComplete = false;
    this.selectedPair = null;
    this.candidatePairs = [];
    
    await this.startGathering();
  }

  /**
   * Stop ICE agent
   */
  stop(): void {
    if (this.gatheringTimeoutId) {
      clearTimeout(this.gatheringTimeoutId);
      this.gatheringTimeoutId = null;
    }
    
    this.state = 'CLOSED';
    this.notifyStateChange();
  }

  // ============================================================================
  // Private methods
  // ============================================================================

  private setState(state: IceState): void {
    this.state = state;
    this.notifyStateChange();
  }

  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.state);
    }
  }

  private async gatherHostCandidates(): Promise<void> {
    // In production, enumerate network interfaces
    // For now, generate placeholder host candidates
    
    const hostCandidate: IceCandidate = {
      foundation: '1',
      component: 1,
      protocol: 'udp',
      priority: this.calculatePriority(0, 'host'),
      ip: '192.168.1.100', // Placeholder - would be actual local IP
      port: 50000 + Math.floor(Math.random() * 1000),
      type: 'host',
      generation: 0,
    };

    this.addLocalCandidate(hostCandidate);
  }

  private async gatherStunCandidates(): Promise<void> {
    // Send binding requests to STUN servers
    for (const server of this.config.stunServers) {
      try {
        const srflxCandidate = await this.sendStunBindingRequest(server);
        if (srflxCandidate) {
          this.addLocalCandidate(srflxCandidate);
        }
      } catch (error) {
        // Continue with other STUN servers
        console.warn(`STUN server ${server.host} failed:`, error);
      }
    }
  }

  private async gatherTurnCandidates(): Promise<void> {
    // Allocate relay candidates from TURN servers
    for (const turnServer of this.config.turnServers) {
      try {
        const relayCandidate = await this.allocateTurnRelay(turnServer);
        if (relayCandidate) {
          this.addLocalCandidate(relayCandidate);
        }
      } catch (error) {
        console.warn(`TURN server ${turnServer.host} failed:`, error);
      }
    }
  }

  private async sendStunBindingRequest(server: { host: string; port: number }): Promise<IceCandidate | null> {
    // In production, implement STUN protocol (RFC 5389)
    // For now, return a placeholder server-reflexive candidate
    
    return {
      foundation: '2',
      component: 1,
      protocol: 'udp',
      priority: this.calculatePriority(1, 'srflx'),
      ip: '203.0.113.1', // Placeholder - would be public IP from STUN
      port: 60000 + Math.floor(Math.random() * 1000),
      type: 'srflx',
      generation: 0,
    };
  }

  private async allocateTurnRelay(server: { host: string; port: number; username?: string; password?: string }): Promise<IceCandidate | null> {
    // In production, implement TURN protocol (RFC 5766)
    // For now, return a placeholder relay candidate
    
    return {
      foundation: '3',
      component: 1,
      protocol: 'udp',
      priority: this.calculatePriority(2, 'relay'),
      ip: '198.51.100.1', // Placeholder - would be TURN relay IP
      port: 70000 + Math.floor(Math.random() * 1000),
      type: 'relay',
      generation: 0,
    };
  }

  private addLocalCandidate(candidate: IceCandidate): void {
    const key = this.getCandidateKey(candidate);
    
    if (!this.localCandidates.has(key)) {
      this.localCandidates.set(key, candidate);
      
      if (this.onCandidate) {
        this.onCandidate(candidate);
      }
    }
  }

  private async startConnectivityChecks(): Promise<void> {
    if (this.remoteCandidates.size === 0) {
      return;
    }

    this.setState('CHECKING');

    // Form candidate pairs
    this.formCandidatePairs();

    // Sort by priority (highest first)
    this.candidatePairs.sort((a, b) => b.priority - a.priority);

    // Perform connectivity checks
    for (const pair of this.candidatePairs) {
      if (this.selectedPair) {
        break; // Already have a selected pair
      }

      const success = await this.performConnectivityCheck(pair);
      if (success) {
        this.selectedPair = pair;
        this.setState('CONNECTED');
        break;
      }
    }

    if (!this.selectedPair) {
      this.setState('FAILED');
      if (this.onError) {
        this.onError(createP2PError('ICE_FAILED', 'No valid candidate pairs found'));
      }
    } else {
      this.setState('COMPLETED');
    }
  }

  private formCandidatePairs(): void {
    this.candidatePairs = [];

    for (const local of this.localCandidates.values()) {
      for (const remote of this.remoteCandidates.values()) {
        // Skip incompatible pairs
        if (local.protocol !== remote.protocol) {
          continue;
        }

        const priority = this.calculatePairPriority(local, remote);
        
        this.candidatePairs.push({
          local,
          remote,
          priority,
        });

        if (this.candidatePairs.length >= this.config.maxCandidatePairs) {
          return;
        }
      }
    }
  }

  private async performConnectivityCheck(pair: { local: IceCandidate; remote: IceCandidate; priority: number }): Promise<boolean> {
    // In production, send STUN binding request to remote candidate
    // For now, simulate with random success based on candidate type
    
    // Prefer direct connections
    if (pair.local.type === 'host' && pair.remote.type === 'host') {
      return true; // Simulate successful direct connection
    }

    if (pair.local.type === 'host' && pair.remote.type === 'srflx') {
      return Math.random() > 0.3; // 70% success rate
    }

    if (pair.local.type === 'srflx' && pair.remote.type === 'srflx') {
      return Math.random() > 0.5; // 50% success rate (hole punching)
    }

    if (pair.local.type === 'relay' || pair.remote.type === 'relay') {
      return Math.random() > 0.1; // 90% success rate (relay always works)
    }

    return Math.random() > 0.5;
  }

  private calculatePriority(order: number, type: IceCandidateType): number {
    // RFC 8445 priority calculation
    // Priority = (2^24)*(type preference) + (2^8)*(local preference) + (2^0)*(256 - component ID)
    
    const typePreference: Record<IceCandidateType, number> = {
      host: 126,
      srflx: 100,
      prflx: 110,
      relay: 0,
    };

    const localPreference = 65535 - order; // Higher order = lower preference
    
    return (
      (typePreference[type] ?? 0) * (1 << 24) +
      localPreference * (1 << 8) +
      (256 - 1)
    );
  }

  private calculatePairPriority(local: IceCandidate, remote: IceCandidate): number {
    // RFC 8445: G = max(local priority, remote priority)
    //           D = min(local priority, remote priority)
    //           Priority = (2^32)*G + 2*D + (G > D ? 1 : 0)
    
    const G = Math.max(local.priority, remote.priority);
    const D = Math.min(local.priority, remote.priority);
    
    return (G * (1 << 32)) + (2 * D) + (G > D ? 1 : 0);
  }

  private getCandidateKey(candidate: IceCandidate): string {
    return `${candidate.ip}:${candidate.port}:${candidate.type}`;
  }

  private onGatheringTimeout(): void {
    this.gatheringComplete = true;
    this.gatheringTimeoutId = null;
    
    // Start connectivity checks with gathered candidates
    this.startConnectivityChecks();
  }

  private handleError(error: Error): void {
    this.setState('FAILED');
    
    if (this.onError) {
      this.onError(createP2PError('ICE_FAILED', error.message, error));
    }
  }
}

/**
 * Create a P2P error
 */
function createP2PError(code: string, message: string, cause?: unknown): P2PError {
  const error = new Error(message) as P2PError;
  error.name = 'P2PError';
  (error as unknown as { code: string }).code = code as never;
  error.cause = cause;
  error.timestamp = new Date();
  return error;
}
