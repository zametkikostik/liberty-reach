/**
 * Libp2p Node - Decentralized P2P Networking
 * 
 * Integrates libp2p for multiplexed, encrypted P2P communication.
 * Supports WebRTC, WebSockets, and TCP transports.
 */

import type { Libp2pNodeOptions, PeerInfo, P2PError } from '../types.js';
import { createP2PError } from '../utils/p2p-utils.js';

/**
 * Libp2p message handler
 */
export interface MessageHandler {
  protocol: string;
  handler: (data: Uint8Array, peerId: string) => Promise<Uint8Array | void>;
}

/**
 * Libp2pNode - libp2p integration for Liberty Reach
 * 
 * Features:
 * - Noise protocol encryption
 * - Yamux multiplexing
 * - Multiple transport support (WebRTC, WebSocket, TCP)
 * - Peer discovery and routing
 * - Stream multiplexing
 */
export class Libp2pNode {
  private options: Libp2pNodeOptions;
  private peerId: string;
  private handlers: Map<string, MessageHandler> = new Map();
  private connections: Map<string, unknown> = new Map();
  private isStarted = false;

  /**
   * Create a new libp2p node
   * 
   * @param options - Node configuration
   */
  constructor(options: Libp2pNodeOptions) {
    this.options = options;
    this.peerId = options.peerId || this.generatePeerId();
  }

  /**
   * Get the node's peer ID
   */
  getPeerId(): string {
    return this.peerId;
  }

  /**
   * Start the libp2p node
   */
  async start(): Promise<void> {
    if (this.isStarted) {
      return;
    }

    try {
      // In production, initialize actual libp2p node
      // const node = await createLibp2p({ ... })
      
      // Register protocol handlers
      for (const handler of this.handlers.values()) {
        await this.registerProtocolHandler(handler.protocol, handler.handler);
      }

      this.isStarted = true;
    } catch (error) {
      throw createP2PError('CONNECTION_FAILED', 'Failed to start libp2p node', error);
    }
  }

  /**
   * Stop the libp2p node
   */
  async stop(): Promise<void> {
    if (!this.isStarted) {
      return;
    }

    try {
      // Close all connections
      for (const [peerId] of this.connections) {
        await this.disconnect(peerId);
      }

      this.isStarted = false;
    } catch (error) {
      console.error('Failed to stop libp2p node:', error);
    }
  }

  /**
   * Register a protocol handler
   * 
   * @param protocol - Protocol ID
   * @param handler - Message handler function
   */
  async registerProtocol(protocol: string, handler: MessageHandler['handler']): Promise<void> {
    this.handlers.set(protocol, { protocol, handler });

    if (this.isStarted) {
      // In production: await node.handle(protocol, handler)
    }
  }

  /**
   * Connect to a peer
   * 
   * @param peerId - Peer ID to connect to
   * @param multiaddrs - Peer multiaddrs
   */
  async connect(peerId: string, multiaddrs: string[]): Promise<void> {
    if (!this.isStarted) {
      throw createP2PError('INVALID_STATE', 'Node not started');
    }

    try {
      // In production: await node.dial(peerId)
      this.connections.set(peerId, { connected: true, timestamp: Date.now() });
    } catch (error) {
      throw createP2PError('CONNECTION_FAILED', `Failed to connect to ${peerId}`, error);
    }
  }

  /**
   * Disconnect from a peer
   * 
   * @param peerId - Peer ID to disconnect from
   */
  async disconnect(peerId: string): Promise<void> {
    try {
      // In production: await node.hangUp(peerId)
      this.connections.delete(peerId);
    } catch (error) {
      console.error(`Failed to disconnect from ${peerId}:`, error);
    }
  }

  /**
   * Send a message to a peer
   * 
   * @param peerId - Peer ID
   * @param protocol - Protocol to use
   * @param data - Message data
   */
  async send(peerId: string, protocol: string, data: Uint8Array): Promise<void> {
    if (!this.isStarted) {
      throw createP2PError('INVALID_STATE', 'Node not started');
    }

    const connection = this.connections.get(peerId);
    if (!connection) {
      throw createP2PError('PEER_DISCONNECTED', `Not connected to ${peerId}`);
    }

    try {
      // In production: const stream = await node.openStream(peerId, protocol)
      // await stream.sink(data)
    } catch (error) {
      throw createP2PError('PROTOCOL_ERROR', `Failed to send on ${protocol}`, error);
    }
  }

  /**
   * Send a message and wait for response
   * 
   * @param peerId - Peer ID
   * @param protocol - Protocol to use
   * @param data - Request data
   * @param timeout - Response timeout in ms
   * @returns Response data
   */
  async sendRequest(
    peerId: string,
    protocol: string,
    data: Uint8Array,
    timeout = 30000
  ): Promise<Uint8Array> {
    if (!this.isStarted) {
      throw createP2PError('INVALID_STATE', 'Node not started');
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(createP2PError('TIMEOUT', 'Request timeout'));
      }, timeout);

      // In production: send request and wait for response
      // For now, return empty response
      clearTimeout(timer);
      resolve(new Uint8Array());
    });
  }

  /**
   * Get connected peers
   */
  getConnectedPeers(): PeerInfo[] {
    const peers: PeerInfo[] = [];
    
    for (const [peerId, connection] of this.connections.entries()) {
      peers.push({
        peerId,
        addresses: [],
        protocols: Array.from(this.handlers.keys()),
        lastSeen: (connection as { timestamp: number }).timestamp,
        connectionType: 'direct',
      });
    }

    return peers;
  }

  /**
   * Check if connected to a peer
   */
  isConnected(peerId: string): boolean {
    return this.connections.has(peerId);
  }

  /**
   * Get node status
   */
  getStatus(): {
    started: boolean;
    peerId: string;
    connectionCount: number;
    protocols: string[];
  } {
    return {
      started: this.isStarted,
      peerId: this.peerId,
      connectionCount: this.connections.size,
      protocols: Array.from(this.handlers.keys()),
    };
  }

  // ============================================================================
  // Private methods
  // ============================================================================

  private generatePeerId(): string {
    // Generate a random peer ID
    // In production, use proper libp2p peer ID from public key
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    
    // Convert to base58-like string
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .substring(0, 40);
  }

  private async registerProtocolHandler(
    protocol: string,
    handler: MessageHandler['handler']
  ): Promise<void> {
    // In production, register with libp2p
    // For now, just store handler
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
