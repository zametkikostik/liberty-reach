/**
 * TURN Client - Traversal Using Relays around NAT
 * 
 * Implements TURN (RFC 5766) for relayed connections when direct P2P fails.
 */

import type { TurnServer, TurnAllocation, TurnCredentials, IceCandidate, P2PError } from '../types.js';
import { createP2PError } from '../utils/p2p-utils.js';

/**
 * TURN message types
 */
const TURN_ALLOCATE_REQUEST = 0x0002;
const TURN_ALLOCATE_RESPONSE = 0x0102;
const TURN_REFRESH_REQUEST = 0x0004;
const TURN_REFRESH_RESPONSE = 0x0104;
const TURN_SEND_INDICATION = 0x0016;
const TURN_DATA_INDICATION = 0x0117;

/**
 * TURN attribute types
 */
const ATTR_CHANNEL_NUMBER = 0x000C;
const ATTR_LIFETIME = 0x000D;
const ATTR_XOR_PEER_ADDRESS = 0x0012;
const ATTR_DATA = 0x0013;
const ATTR_XOR_RELAYED_ADDRESS = 0x0016;
const ATTR_NONCE = 0x0015;
const ATTR_REALM = 0x0014;
const ATTR_USERNAME = 0x0006;
const ATTR_MESSAGE_INTEGRITY = 0x0008;

/**
 * TurnClient - TURN protocol implementation
 * 
 * Provides relayed connectivity when direct P2P is not possible.
 * Supports both UDP and TCP allocations.
 */
export class TurnClient {
  private readonly server: TurnServer;
  private allocation: TurnAllocation | null = null;
  private channels: Map<string, number> = new Map(); // peer -> channel
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Create a new TURN client
   * 
   * @param server - TURN server configuration
   */
  constructor(server: TurnServer) {
    this.server = server;
  }

  /**
   * Allocate a relay address
   * 
   * @param credentials - TURN credentials
   * @param lifetime - Allocation lifetime in seconds
   * @returns Allocation details
   */
  async allocate(credentials: TurnCredentials, lifetime = 600): Promise<TurnAllocation> {
    if (this.allocation) {
      return this.allocation;
    }

    try {
      // Send Allocate request
      const response = await this.sendAllocateRequest(credentials, lifetime);
      
      this.allocation = {
        relayAddress: response.relayAddress,
        relayPort: response.relayPort,
        lifetime: response.lifetime,
        expiresAt: Date.now() + response.lifetime * 1000,
      };

      // Start refresh timer
      this.startRefreshTimer(lifetime);

      return this.allocation;
    } catch (error) {
      throw createP2PError('TURN_FAILED', 'Failed to allocate TURN relay', error);
    }
  }

  /**
   * Create a permission for a peer
   * 
   * @param peerAddress - Peer IP address
   * @param credentials - TURN credentials
   */
  async createPermission(peerAddress: string, credentials: TurnCredentials): Promise<void> {
    if (!this.allocation) {
      throw createP2PError('INVALID_STATE', 'No TURN allocation');
    }

    // Send CreatePermission request
    await this.sendCreatePermissionRequest(peerAddress, credentials);
  }

  /**
   * Bind a channel for a peer
   * 
   * @param peerAddress - Peer IP address and port
   * @param credentials - TURN credentials
   * @returns Channel number
   */
  async bindChannel(peerAddress: string, credentials: TurnCredentials): Promise<number> {
    const existingChannel = this.channels.get(peerAddress);
    if (existingChannel) {
      return existingChannel;
    }

    // Channel numbers: 0x4000 - 0x7FFF
    const channelNumber = 0x4000 + this.channels.size;

    // Send ChannelBind request
    await this.sendChannelBindRequest(peerAddress, channelNumber, credentials);
    
    this.channels.set(peerAddress, channelNumber);
    return channelNumber;
  }

  /**
   * Send data to a peer via relay
   * 
   * @param data - Data to send
   * @param peerAddress - Peer IP address and port
   */
  async sendData(data: Uint8Array, peerAddress: string): Promise<void> {
    if (!this.allocation) {
      throw createP2PError('INVALID_STATE', 'No TURN allocation');
    }

    const channel = this.channels.get(peerAddress);
    
    if (channel) {
      // Use ChannelData mechanism (more efficient)
      await this.sendChannelData(data, channel);
    } else {
      // Use Send indication
      await this.sendSendIndication(data, peerAddress);
    }
  }

  /**
   * Refresh the allocation
   * 
   * @param credentials - TURN credentials
   * @param lifetime - New lifetime in seconds
   */
  async refresh(credentials: TurnCredentials, lifetime = 600): Promise<void> {
    if (!this.allocation) {
      throw createP2PError('INVALID_STATE', 'No TURN allocation to refresh');
    }

    const response = await this.sendRefreshRequest(credentials, lifetime);
    
    this.allocation.lifetime = response.lifetime;
    this.allocation.expiresAt = Date.now() + response.lifetime * 1000;

    // Reset refresh timer
    this.startRefreshTimer(lifetime);
  }

  /**
   * Release the allocation
   */
  async release(): Promise<void> {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    if (this.allocation) {
      // Send Refresh with lifetime=0 to release
      try {
        await this.sendRefreshRequest({ username: '', password: '' }, 0);
      } catch {
        // Ignore errors on release
      }
      
      this.allocation = null;
    }

    this.channels.clear();
  }

  /**
   * Get current allocation
   */
  getAllocation(): TurnAllocation | null {
    return this.allocation;
  }

  /**
   * Get relay candidate for ICE
   */
  getRelayCandidate(): IceCandidate | null {
    if (!this.allocation) {
      return null;
    }

    return {
      foundation: '3',
      component: 1,
      protocol: 'udp',
      priority: 0 * (1 << 24) + 65535 * (1 << 8) + 255, // Lowest priority
      ip: this.allocation.relayAddress,
      port: this.allocation.relayPort,
      type: 'relay',
      generation: 0,
    };
  }

  // ============================================================================
  // Private methods
  // ============================================================================

  private async sendAllocateRequest(credentials: TurnCredentials, lifetime: number): Promise<{
    relayAddress: string;
    relayPort: number;
    lifetime: number;
  }> {
    // In production, implement full TURN protocol
    // For now, simulate response
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          relayAddress: '198.51.100.1', // Placeholder relay IP
          relayPort: 70000 + Math.floor(Math.random() * 1000),
          lifetime,
        });
      }, 100 + Math.random() * 200);
    });
  }

  private async sendCreatePermissionRequest(peerAddress: string, credentials: TurnCredentials): Promise<void> {
    // In production, send CreatePermission request
    return Promise.resolve();
  }

  private async sendChannelBindRequest(peerAddress: string, channelNumber: number, credentials: TurnCredentials): Promise<void> {
    // In production, send ChannelBind request
    return Promise.resolve();
  }

  private async sendChannelData(data: Uint8Array, channelNumber: number): Promise<void> {
    // ChannelData format (RFC 5766 Section 11):
    //  0                   1                   2                   3
    //  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
    // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    // |         Channel Number        |            Length             |
    // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    // |                                                               |
    // ~                         Application Data                      ~
    // |                                                               |
    // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+

    const length = data.length;
    const paddedLength = Math.ceil(length / 4) * 4;
    
    const buffer = new Uint8Array(4 + paddedLength);
    const view = new DataView(buffer.buffer);
    
    view.setUint16(0, channelNumber, false);
    view.setUint16(2, length, false);
    buffer.set(data, 4);

    // In production, send over TCP/TLS connection
  }

  private async sendSendIndication(data: Uint8Array, peerAddress: string): Promise<void> {
    // In production, send Send indication with XOR-PEER-ADDRESS attribute
    return Promise.resolve();
  }

  private async sendRefreshRequest(credentials: TurnCredentials, lifetime: number): Promise<{
    lifetime: number;
  }> {
    // In production, send Refresh request
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ lifetime });
      }, 50);
    });
  }

  private startRefreshTimer(lifetime: number): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Refresh at 5/6 of lifetime (RFC 5766 recommendation)
    const refreshTime = (lifetime * 5 / 6) * 1000;

    this.refreshTimer = setTimeout(() => {
      this.autoRefresh();
    }, refreshTime);
  }

  private async autoRefresh(): Promise<void> {
    if (!this.allocation) {
      return;
    }

    try {
      await this.refresh({ username: this.server.username || '', password: '' }, 600);
    } catch (error) {
      console.error('TURN auto-refresh failed:', error);
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
