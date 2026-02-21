/**
 * Chunk Storage - Abstract storage interface
 */

import type { FileChunk, ChunkManifest } from '../core/chunk-manager.js';

/**
 * Storage statistics
 */
export interface StorageStats {
  usedBytes: number;
  totalBytes: number;
  chunkCount: number;
  fileCount: number;
}

/**
 * ChunkStorage - Abstract interface for chunk storage
 */
export abstract class ChunkStorage {
  /**
   * Initialize storage
   */
  abstract initialize(): Promise<void>;

  /**
   * Store a chunk
   */
  abstract storeChunk(chunk: FileChunk): Promise<void>;

  /**
   * Get a chunk
   */
  abstract getChunk(chunkId: string): Promise<FileChunk | null>;

  /**
   * Delete a chunk
   */
  abstract deleteChunk(chunkId: string): Promise<void>;

  /**
   * Get all chunk IDs
   */
  abstract getAllChunkIds(): Promise<string[]>;

  /**
   * Store a manifest
   */
  abstract storeManifest(manifest: ChunkManifest): Promise<void>;

  /**
   * Get a manifest
   */
  abstract getManifest(fileId: string): Promise<ChunkManifest | null>;

  /**
   * Delete a manifest
   */
  abstract deleteManifest(fileId: string): Promise<void>;

  /**
   * Get all manifests
   */
  abstract getAllManifests(): Promise<ChunkManifest[]>;

  /**
   * Get storage statistics
   */
  abstract getStats(): Promise<StorageStats>;

  /**
   * Close storage
   */
  abstract close(): Promise<void>;
}
