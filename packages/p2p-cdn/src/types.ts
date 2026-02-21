/**
 * P2P CDN Types
 */

import type { ChunkManifest } from '../core/chunk-manager.js';

/**
 * CDN file information
 */
export interface CDNFile {
  fileId: string;
  manifest: ChunkManifest;
  size: number;
  createdAt: number;
}

/**
 * CDN request
 */
export interface CDNRequest {
  type: 'download' | 'upload' | 'stream' | 'delete';
  fileId: string;
  peerId?: string;
  chunkIds?: string[];
}

/**
 * CDN response
 */
export interface CDNResponse {
  success: boolean;
  fileId?: string;
  data?: Uint8Array;
  error?: string;
}

/**
 * Transfer progress
 */
export interface TransferProgress {
  fileId: string;
  downloadedBytes: number;
  totalBytes: number;
  progress: number; // 0 to 1
  downloadedChunks: number;
  totalChunks: number;
  speed?: number; // bytes per second
  eta?: number; // estimated time in seconds
}

/**
 * Peer statistics
 */
export interface PeerStats {
  peerId: string;
  uploadSpeed: number;
  downloadSpeed: number;
  chunksSent: number;
  chunksReceived: number;
  connectionDuration: number;
}
