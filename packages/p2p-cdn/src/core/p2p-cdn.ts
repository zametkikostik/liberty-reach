/**
 * P2P CDN Core Implementation
 * 
 * Main class for P2P content delivery via WebRTC Data Channels.
 * Handles file chunking, distribution, and retrieval across peer mesh.
 */

import type { FileChunk, ChunkManifest } from './chunk-manager.js';
import { ChunkManager } from './chunk-manager.js';
import { PeerMesh } from '../network/peer-mesh.js';
import { ChunkTracker } from '../network/chunk-tracker.js';
import { ChunkStorage, IndexedDBStorage } from '../storage/chunk-storage.js';
import type { CDNFile, CDNRequest, CDNResponse, TransferProgress, PeerStats } from '../types.js';

/**
 * P2P CDN configuration options
 */
export interface P2PCDNOptions {
  /** Maximum concurrent downloads */
  maxConcurrentDownloads: number;
  /** Maximum concurrent uploads */
  maxConcurrentUploads: number;
  /** Chunk size in bytes (default: 256KB) */
  chunkSize: number;
  /** Storage backend */
  storage: ChunkStorage;
  /** Enable seeding (share downloaded chunks) */
  enableSeeding: boolean;
  /** Seed duration in seconds */
  seedDuration: number;
  /** Peer discovery interval in ms */
  discoveryInterval: number;
}

/**
 * CDN statistics
 */
export interface CDNStats {
  /** Total files stored */
  totalFiles: number;
  /** Total chunks stored */
  totalChunks: number;
  /** Total bytes stored */
  totalBytes: number;
  /** Active downloads */
  activeDownloads: number;
  /** Active uploads */
  activeUploads: number;
  /** Download speed in bytes/sec */
  downloadSpeed: number;
  /** Upload speed in bytes/sec */
  uploadSpeed: number;
  /** Connected peers */
  connectedPeers: number;
  /** Peer stats */
  peers: PeerStats[];
}

/**
 * P2PCDN - Decentralized Content Delivery Network
 * 
 * Features:
 * - File chunking and distribution
 * - WebRTC Data Channel transfer
 * - Chunk availability tracking
 * - Parallel downloads from multiple peers
 * - Automatic seeding after download
 * - Storage management with quotas
 */
export class P2PCDN {
  private options: P2PCDNOptions;
  private chunkManager: ChunkManager;
  private peerMesh: PeerMesh;
  private chunkTracker: ChunkTracker;
  private storage: ChunkStorage;
  private activeDownloads: Map<string, AbortController> = new Map();
  private uploadQueue: Array<{ chunk: FileChunk; peer: string }> = [];
  private statsInterval: ReturnType<typeof setInterval> | null = null;
  private _stats: CDNStats = {
    totalFiles: 0,
    totalChunks: 0,
    totalBytes: 0,
    activeDownloads: 0,
    activeUploads: 0,
    downloadSpeed: 0,
    uploadSpeed: 0,
    connectedPeers: 0,
    peers: [],
  };

  constructor(options?: Partial<P2PCDNOptions>) {
    this.options = {
      maxConcurrentDownloads: 10,
      maxConcurrentUploads: 20,
      chunkSize: 256 * 1024, // 256KB
      storage: new IndexedDBStorage(),
      enableSeeding: true,
      seedDuration: 3600, // 1 hour
      discoveryInterval: 30000,
      ...options,
    };

    this.storage = this.options.storage;
    this.chunkManager = new ChunkManager(this.options.chunkSize);
    this.peerMesh = new PeerMesh();
    this.chunkTracker = new ChunkTracker();

    this.setupEventListeners();
    this.startStatsCollection();
  }

  /**
   * Initialize and connect to the P2P network
   */
  async connect(): Promise<void> {
    await this.storage.initialize();
    await this.peerMesh.connect();
    
    // Load existing chunks from storage
    await this.loadStoredChunks();
    
    // Start peer discovery
    this.startPeerDiscovery();
  }

  /**
   * Disconnect from the P2P network
   */
  async disconnect(): Promise<void> {
    this.stopStatsCollection();
    this.stopPeerDiscovery();
    
    // Abort active downloads
    for (const controller of this.activeDownloads.values()) {
      controller.abort();
    }
    this.activeDownloads.clear();
    
    await this.peerMesh.disconnect();
    await this.storage.close();
  }

  /**
   * Upload a file to the P2P CDN
   */
  async upload(file: File | Uint8Array, metadata?: Record<string, unknown>): Promise<CDNFile> {
    const bytes = file instanceof File ? new Uint8Array(await file.arrayBuffer()) : file;
    const fileId = await this.chunkManager.generateFileId(bytes);
    
    // Chunk the file
    const chunks = this.chunkManager.chunkFile(bytes, fileId);
    
    // Create manifest
    const manifest: ChunkManifest = {
      fileId,
      totalChunks: chunks.length,
      chunkSize: this.options.chunkSize,
      totalSize: bytes.length,
      createdAt: Date.now(),
      metadata,
      chunks: chunks.map(c => ({
        chunkId: c.chunkId,
        index: c.index,
        size: c.size,
        hash: c.hash,
      })),
    };

    // Store chunks locally
    for (const chunk of chunks) {
      await this.storage.storeChunk(chunk);
    }

    // Announce availability to peer mesh
    await this.chunkTracker.announceAvailability(fileId, chunks.map(c => c.chunkId));

    // Start seeding to peers
    if (this.options.enableSeeding) {
      this.startSeeding(fileId, chunks);
    }

    return {
      fileId,
      manifest,
      size: bytes.length,
      createdAt: Date.now(),
    };
  }

  /**
   * Download a file from the P2P CDN
   */
  async download(
    fileId: string,
    manifest: ChunkManifest,
    onProgress?: (progress: TransferProgress) => void
  ): Promise<Uint8Array> {
    const controller = new AbortController();
    this.activeDownloads.set(fileId, controller);

    try {
      const chunks: (FileChunk | null)[] = new Array(manifest.totalChunks);
      const downloadedChunks = new Set<number>();
      let downloadedBytes = 0;

      // Check which chunks we already have
      for (let i = 0; i < manifest.totalChunks; i++) {
        const chunkId = manifest.chunks[i]!.chunkId;
        const existingChunk = await this.storage.getChunk(chunkId);
        if (existingChunk) {
          chunks[i] = existingChunk;
          downloadedChunks.add(i);
          downloadedBytes += existingChunk.size;
        }
      }

      // Find peers with missing chunks
      const missingChunkIds = manifest.chunks
        .filter((_, i) => !downloadedChunks.has(i))
        .map(c => c.chunkId);

      if (missingChunkIds.length > 0) {
        // Get peers that have the missing chunks
        const peerChunks = await this.chunkTracker.findPeersWithChunks(missingChunkIds);
        
        // Download chunks from peers in parallel
        await this.downloadChunksFromPeers(
          peerChunks,
          chunks,
          downloadedChunks,
          manifest,
          onProgress,
          controller.signal
        );
      }

      // Reassemble file
      const reassembled = this.chunkManager.reassembleFile(chunks as FileChunk[], manifest);

      // Start seeding after download
      if (this.options.enableSeeding) {
        this.startSeeding(fileId, chunks as FileChunk[]);
      }

      return reassembled;
    } finally {
      this.activeDownloads.delete(fileId);
    }
  }

  /**
   * Stream a file (for large files)
   */
  async *stream(
    fileId: string,
    manifest: ChunkManifest,
    onProgress?: (progress: TransferProgress) => void
  ): AsyncGenerator<Uint8Array> {
    const controller = new AbortController();
    this.activeDownloads.set(fileId, controller);

    try {
      let downloadedBytes = 0;

      for (let i = 0; i < manifest.totalChunks; i++) {
        const chunkInfo = manifest.chunks[i]!;
        
        // Try to get chunk from local storage first
        let chunk = await this.storage.getChunk(chunkInfo.chunkId);
        
        if (!chunk) {
          // Download from peer
          const peers = await this.chunkTracker.findPeersWithChunks([chunkInfo.chunkId]);
          if (peers.length > 0) {
            chunk = await this.downloadChunkFromPeer(chunkInfo.chunkId, peers[0]!);
          }
        }

        if (chunk) {
          downloadedBytes += chunk.size;
          
          if (onProgress) {
            onProgress({
              fileId,
              downloadedBytes,
              totalBytes: manifest.totalSize,
              progress: downloadedBytes / manifest.totalSize,
              downloadedChunks: i + 1,
              totalChunks: manifest.totalChunks,
            });
          }

          yield chunk.data;
        }
      }
    } finally {
      this.activeDownloads.delete(fileId);
    }
  }

  /**
   * Delete a file from local storage
   */
  async delete(fileId: string): Promise<void> {
    const manifest = await this.storage.getManifest(fileId);
    if (manifest) {
      for (const chunk of manifest.chunks) {
        await this.storage.deleteChunk(chunk.chunkId);
      }
      await this.storage.deleteManifest(fileId);
    }
  }

  /**
   * Get CDN statistics
   */
  getStats(): CDNStats {
    return { ...this._stats };
  }

  /**
   * Get list of stored files
   */
  async getStoredFiles(): Promise<CDNFile[]> {
    const manifests = await this.storage.getAllManifests();
    return manifests.map(m => ({
      fileId: m.fileId,
      manifest: m,
      size: m.totalSize,
      createdAt: m.createdAt,
    }));
  }

  // ============================================================================
  // Private methods
  // ============================================================================

  private setupEventListeners(): void {
    // Handle incoming chunk requests from peers
    this.peerMesh.onChunkRequest(async (peerId, chunkId) => {
      const chunk = await this.storage.getChunk(chunkId);
      if (chunk) {
        await this.peerMesh.sendChunk(peerId, chunk);
        this.updateUploadStats(chunk.size);
      }
    });

    // Handle peer disconnects
    this.peerMesh.onPeerDisconnect((peerId) => {
      this.chunkTracker.removePeer(peerId);
    });

    // Handle new chunk availability announcements
    this.chunkTracker.onAvailabilityUpdate((fileId, chunkIds, peerId) => {
      // Could trigger prefetching here
    });
  }

  private async loadStoredChunks(): Promise<void> {
    const manifests = await this.storage.getAllManifests();
    for (const manifest of manifests) {
      for (const chunk of manifest.chunks) {
        this.chunkTracker.announceAvailability(manifest.fileId, [chunk.chunkId]);
      }
    }
  }

  private async downloadChunksFromPeers(
    peerChunks: Array<{ peerId: string; chunkIds: string[] }>,
    chunks: (FileChunk | null)[],
    downloadedChunks: Set<number>,
    manifest: ChunkManifest,
    onProgress?: (progress: TransferProgress) => void,
    signal?: AbortSignal
  ): Promise<void> {
    const downloadPromises: Promise<void>[] = [];
    let downloadedBytes = chunks.reduce((sum, c) => sum + (c?.size || 0), 0);

    for (const { peerId, chunkIds } of peerChunks) {
      for (const chunkId of chunkIds) {
        if (signal?.aborted) break;
        if (downloadPromises.length >= this.options.maxConcurrentDownloads) {
          await Promise.race(downloadPromises);
        }

        const chunkIndex = manifest.chunks.findIndex(c => c.chunkId === chunkId);
        if (chunkIndex === -1 || downloadedChunks.has(chunkIndex)) continue;

        const promise = this.downloadChunkFromPeer(chunkId, peerId)
          .then(async (chunk) => {
            if (signal?.aborted) return;
            
            chunks[chunkIndex] = chunk;
            downloadedChunks.add(chunkIndex);
            downloadedBytes += chunk.size;
            await this.storage.storeChunk(chunk);

            if (onProgress) {
              onProgress({
                fileId: manifest.fileId,
                downloadedBytes,
                totalBytes: manifest.totalSize,
                progress: downloadedBytes / manifest.totalSize,
                downloadedChunks: downloadedChunks.size,
                totalChunks: manifest.totalChunks,
              });
            }
          })
          .catch(console.error);

        downloadPromises.push(promise);
      }
    }

    await Promise.all(downloadPromises);
  }

  private async downloadChunkFromPeer(chunkId: string, peerId: string): Promise<FileChunk> {
    const startTime = Date.now();
    const chunk = await this.peerMesh.requestChunk(peerId, chunkId);
    const duration = (Date.now() - startTime) / 1000;
    
    this.updateDownloadStats(chunk.size, duration);
    return chunk;
  }

  private startSeeding(fileId: string, chunks: FileChunk[]): void {
    // Announce chunk availability
    const chunkIds = chunks.map(c => c.chunkId);
    this.chunkTracker.announceAvailability(fileId, chunkIds);

    // Seed for configured duration
    setTimeout(() => {
      this.chunkTracker.removeAvailability(fileId, chunkIds);
    }, this.options.seedDuration * 1000);
  }

  private startPeerDiscovery(): void {
    const discover = async () => {
      try {
        await this.peerMesh.discoverPeers();
      } catch (error) {
        console.error('Peer discovery failed:', error);
      }
    };

    discover();
    // Continue discovery at intervals
  }

  private stopPeerDiscovery(): void {
    // Cleanup discovery interval
  }

  private startStatsCollection(): void {
    let lastDownloadBytes = 0;
    let lastUploadBytes = 0;

    this.statsInterval = setInterval(async () => {
      const storedFiles = await this.storage.getAllManifests();
      const storedChunks = await this.storage.getAllChunkIds();
      const totalBytes = storedFiles.reduce((sum, f) => sum + f.totalSize, 0);
      
      const currentDownloadBytes = this._stats.downloadSpeed;
      const currentUploadBytes = this._stats.uploadSpeed;
      
      this._stats = {
        totalFiles: storedFiles.length,
        totalChunks: storedChunks.length,
        totalBytes,
        activeDownloads: this.activeDownloads.size,
        activeUploads: this.uploadQueue.length,
        downloadSpeed: currentDownloadBytes,
        uploadSpeed: currentUploadBytes,
        connectedPeers: this.peerMesh.getConnectedPeers().length,
        peers: this.peerMesh.getPeerStats(),
      };

      lastDownloadBytes = currentDownloadBytes;
      lastUploadBytes = currentUploadBytes;
    }, 1000);
  }

  private stopStatsCollection(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
  }

  private updateDownloadStats(bytes: number, durationSeconds: number): void {
    this._stats.downloadSpeed = bytes / durationSeconds;
  }

  private updateUploadStats(bytes: number): void {
    this._stats.uploadSpeed += bytes;
  }
}
