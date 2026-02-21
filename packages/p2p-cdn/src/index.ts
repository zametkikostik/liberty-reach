/**
 * P2P CDN - WebRTC-based Content Delivery Network
 * 
 * Decentralized file distribution using WebRTC Data Channels.
 * Files are chunked, encrypted, and distributed across peer mesh.
 * 
 * @module @liberty-reach/p2p-cdn
 */

// Core CDN
export { P2PCDN, type P2PCDNOptions, type CDNStats } from './core/p2p-cdn.js';
export { ChunkManager, type FileChunk, type ChunkManifest } from './core/chunk-manager.js';

// Peer Network
export { PeerMesh, type PeerInfo, type MeshStats } from './network/peer-mesh.js';
export { ChunkTracker, type ChunkAvailability } from './network/chunk-tracker.js';

// Storage
export { ChunkStorage, type StorageStats } from './storage/chunk-storage.js';
export { IndexedDBStorage } from './storage/indexeddb-storage.js';
export { MemoryStorage } from './storage/memory-storage.js';

// Streaming
export { ChunkStreamer, type StreamOptions } from './streaming/chunk-streamer.js';
export { MediaStreamer } from './streaming/media-streamer.js';

// Types
export type {
  CDNFile,
  CDNRequest,
  CDNResponse,
  TransferProgress,
  PeerStats,
} from './types.js';
