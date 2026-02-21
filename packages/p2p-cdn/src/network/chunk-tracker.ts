/**
 * Chunk Tracker - Track chunk availability across peers
 */

/**
 * Chunk availability information
 */
export interface ChunkAvailability {
  chunkId: string;
  fileId: string;
  peerIds: string[];
  lastUpdate: number;
}

/**
 * ChunkTracker - Tracks which peers have which chunks
 */
export class ChunkTracker {
  private chunkAvailability: Map<string, ChunkAvailability> = new Map();
  private peerChunks: Map<string, Set<string>> = new Map();
  private availabilityHandlers: Array<(fileId: string, chunkIds: string[], peerId: string) => void> = [];

  /**
   * Announce chunk availability
   */
  announceAvailability(fileId: string, chunkIds: string[], peerId?: string): void {
    const timestamp = Date.now();

    for (const chunkId of chunkIds) {
      let availability = this.chunkAvailability.get(chunkId);
      
      if (!availability) {
        availability = {
          chunkId,
          fileId,
          peerIds: [],
          lastUpdate: timestamp,
        };
      }

      if (peerId && !availability.peerIds.includes(peerId)) {
        availability.peerIds.push(peerId);
      }

      availability.lastUpdate = timestamp;
      this.chunkAvailability.set(chunkId, availability);

      // Update peer's chunk list
      if (peerId) {
        let chunks = this.peerChunks.get(peerId);
        if (!chunks) {
          chunks = new Set();
          this.peerChunks.set(peerId, chunks);
        }
        chunks.add(chunkId);
      }
    }

    // Notify handlers
    for (const handler of this.availabilityHandlers) {
      handler(fileId, chunkIds, peerId || 'local');
    }
  }

  /**
   * Remove chunk availability
   */
  removeAvailability(fileId: string, chunkIds: string[], peerId?: string): void {
    for (const chunkId of chunkIds) {
      const availability = this.chunkAvailability.get(chunkId);
      
      if (availability && peerId) {
        availability.peerIds = availability.peerIds.filter(id => id !== peerId);
        
        if (availability.peerIds.length === 0) {
          this.chunkAvailability.delete(chunkId);
        }
      }
    }
  }

  /**
   * Find peers that have specific chunks
   */
  findPeersWithChunks(chunkIds: string[]): Array<{ peerId: string; chunkIds: string[] }> {
    const peerMap = new Map<string, string[]>();

    for (const chunkId of chunkIds) {
      const availability = this.chunkAvailability.get(chunkId);
      if (availability) {
        for (const peerId of availability.peerIds) {
          const existing = peerMap.get(peerId) || [];
          existing.push(chunkId);
          peerMap.set(peerId, existing);
        }
      }
    }

    return Array.from(peerMap.entries()).map(([peerId, chunkIds]) => ({
      peerId,
      chunkIds,
    }));
  }

  /**
   * Get all peers that have a specific chunk
   */
  getPeersForChunk(chunkId: string): string[] {
    const availability = this.chunkAvailability.get(chunkId);
    return availability ? [...availability.peerIds] : [];
  }

  /**
   * Get all chunks a peer has
   */
  getPeerChunks(peerId: string): string[] {
    const chunks = this.peerChunks.get(peerId);
    return chunks ? Array.from(chunks) : [];
  }

  /**
   * Remove peer from tracker
   */
  removePeer(peerId: string): void {
    // Remove from chunk availability
    for (const availability of this.chunkAvailability.values()) {
      availability.peerIds = availability.peerIds.filter(id => id !== peerId);
    }

    // Remove peer's chunk list
    this.peerChunks.delete(peerId);
  }

  /**
   * Set availability update handler
   */
  onAvailabilityUpdate(
    handler: (fileId: string, chunkIds: string[], peerId: string) => void
  ): void {
    this.availabilityHandlers.push(handler);
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalTrackedChunks: number;
    totalPeers: number;
    averageCopiesPerChunk: number;
  } {
    const totalTrackedChunks = this.chunkAvailability.size;
    const totalPeers = this.peerChunks.size;
    
    let totalCopies = 0;
    for (const availability of this.chunkAvailability.values()) {
      totalCopies += availability.peerIds.length;
    }
    
    const averageCopiesPerChunk = totalTrackedChunks > 0
      ? totalCopies / totalTrackedChunks
      : 0;

    return {
      totalTrackedChunks,
      totalPeers,
      averageCopiesPerChunk,
    };
  }
}
