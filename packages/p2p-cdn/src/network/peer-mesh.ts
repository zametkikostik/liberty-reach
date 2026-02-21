/**
 * Peer Mesh - P2P network management
 */

import type { FileChunk } from '../core/chunk-manager.js';

/**
 * Peer information
 */
export interface PeerInfo {
  peerId: string;
  address: string;
  latency: number;
  bandwidth: number;
  availableChunks: string[];
  lastSeen: number;
  connectionType: 'direct' | 'relay';
}

/**
 * Mesh statistics
 */
export interface MeshStats {
  connectedPeers: number;
  totalBandwidth: number;
  averageLatency: number;
}

/**
 * PeerStats for monitoring
 */
export interface PeerStats {
  peerId: string;
  uploadSpeed: number;
  downloadSpeed: number;
  chunksSent: number;
  chunksReceived: number;
  connectionDuration: number;
}

/**
 * PeerMesh - Manages P2P peer connections
 */
export class PeerMesh {
  private peers: Map<string, PeerInfo> = new Map();
  private peerStats: Map<string, PeerStats> = new Map();
  private chunkRequestHandler: ((peerId: string, chunkId: string) => Promise<void>) | null = null;
  private peerDisconnectHandler: ((peerId: string) => void) | null = null;

  /**
   * Connect to the P2P network
   */
  async connect(): Promise<void> {
    // In production, establish actual P2P connections
    console.log('Connecting to P2P mesh...');
  }

  /**
   * Disconnect from the P2P network
   */
  async disconnect(): Promise<void> {
    for (const peerId of this.peers.keys()) {
      await this.removePeer(peerId);
    }
  }

  /**
   * Discover new peers
   */
  async discoverPeers(): Promise<PeerInfo[]> {
    // In production, use DHT or signaling server for peer discovery
    const newPeers: PeerInfo[] = [];
    
    // Simulated peer discovery
    return newPeers;
  }

  /**
   * Add a peer to the mesh
   */
  addPeer(peer: PeerInfo): void {
    this.peers.set(peer.peerId, peer);
    this.peerStats.set(peer.peerId, {
      peerId: peer.peerId,
      uploadSpeed: 0,
      downloadSpeed: 0,
      chunksSent: 0,
      chunksReceived: 0,
      connectionDuration: 0,
    });
  }

  /**
   * Remove a peer from the mesh
   */
  async removePeer(peerId: string): Promise<void> {
    this.peers.delete(peerId);
    this.peerStats.delete(peerId);
    
    if (this.peerDisconnectHandler) {
      this.peerDisconnectHandler(peerId);
    }
  }

  /**
   * Get connected peers
   */
  getConnectedPeers(): PeerInfo[] {
    return Array.from(this.peers.values());
  }

  /**
   * Get peer statistics
   */
  getPeerStats(): PeerStats[] {
    return Array.from(this.peerStats.values());
  }

  /**
   * Request a chunk from a peer
   */
  async requestChunk(peerId: string, chunkId: string): Promise<FileChunk> {
    const peer = this.peers.get(peerId);
    if (!peer) {
      throw new Error(`Peer ${peerId} not found`);
    }

    // In production, send request over WebRTC data channel
    // Simulated response
    const chunk: FileChunk = {
      chunkId,
      fileId: chunkId.split(':')[0]!,
      index: 0,
      data: new Uint8Array(1024),
      size: 1024,
      hash: new Uint8Array(32),
    };

    // Update stats
    const stats = this.peerStats.get(peerId);
    if (stats) {
      stats.chunksReceived++;
      stats.downloadSpeed += chunk.size;
    }

    return chunk;
  }

  /**
   * Send a chunk to a peer
   */
  async sendChunk(peerId: string, chunk: FileChunk): Promise<void> {
    const peer = this.peers.get(peerId);
    if (!peer) {
      throw new Error(`Peer ${peerId} not found`);
    }

    // In production, send over WebRTC data channel
    // Update stats
    const stats = this.peerStats.get(peerId);
    if (stats) {
      stats.chunksSent++;
      stats.uploadSpeed += chunk.size;
    }
  }

  /**
   * Set chunk request handler
   */
  onChunkRequest(handler: (peerId: string, chunkId: string) => Promise<void>): void {
    this.chunkRequestHandler = handler;
  }

  /**
   * Set peer disconnect handler
   */
  onPeerDisconnect(handler: (peerId: string) => void): void {
    this.peerDisconnectHandler = handler;
  }

  /**
   * Get mesh statistics
   */
  getStats(): MeshStats {
    const peers = this.getConnectedPeers();
    const totalBandwidth = peers.reduce((sum, p) => sum + p.bandwidth, 0);
    const averageLatency = peers.length > 0
      ? peers.reduce((sum, p) => sum + p.latency, 0) / peers.length
      : 0;

    return {
      connectedPeers: peers.length,
      totalBandwidth,
      averageLatency,
    };
  }

  /**
   * Find best peer for chunk download
   */
  findBestPeer(chunkId: string): PeerInfo | null {
    const candidates = Array.from(this.peers.values()).filter(p =>
      p.availableChunks.includes(chunkId)
    );

    if (candidates.length === 0) return null;

    // Score peers by bandwidth and latency
    return candidates.reduce((best, current) => {
      const bestScore = best.bandwidth / (best.latency + 1);
      const currentScore = current.bandwidth / (current.latency + 1);
      return currentScore > bestScore ? current : best;
    });
  }
}
