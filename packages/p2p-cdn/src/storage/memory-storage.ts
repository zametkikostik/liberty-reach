/**
 * Memory Storage Implementation (for testing)
 */

import { ChunkStorage, type StorageStats } from './chunk-storage.js';
import type { FileChunk, ChunkManifest } from '../core/chunk-manager.js';

/**
 * In-memory chunk storage
 */
export class MemoryStorage extends ChunkStorage {
  private chunks: Map<string, FileChunk> = new Map();
  private manifests: Map<string, ChunkManifest> = new Map();
  private maxBytes: number;

  constructor(maxBytes: number = 1024 * 1024 * 100) {
    // 100MB default
    super();
    this.maxBytes = maxBytes;
  }

  async initialize(): Promise<void> {
    // No initialization needed
  }

  async storeChunk(chunk: FileChunk): Promise<void> {
    this.chunks.set(chunk.chunkId, chunk);
  }

  async getChunk(chunkId: string): Promise<FileChunk | null> {
    return this.chunks.get(chunkId) || null;
  }

  async deleteChunk(chunkId: string): Promise<void> {
    this.chunks.delete(chunkId);
  }

  async getAllChunkIds(): Promise<string[]> {
    return Array.from(this.chunks.keys());
  }

  async storeManifest(manifest: ChunkManifest): Promise<void> {
    this.manifests.set(manifest.fileId, manifest);
  }

  async getManifest(fileId: string): Promise<ChunkManifest | null> {
    return this.manifests.get(fileId) || null;
  }

  async deleteManifest(fileId: string): Promise<void> {
    this.manifests.delete(fileId);
  }

  async getAllManifests(): Promise<ChunkManifest[]> {
    return Array.from(this.manifests.values());
  }

  async getStats(): Promise<StorageStats> {
    let usedBytes = 0;
    for (const chunk of this.chunks.values()) {
      usedBytes += chunk.size;
    }

    return {
      usedBytes,
      totalBytes: this.maxBytes,
      chunkCount: this.chunks.size,
      fileCount: this.manifests.size,
    };
  }

  async close(): Promise<void> {
    this.chunks.clear();
    this.manifests.clear();
  }
}
