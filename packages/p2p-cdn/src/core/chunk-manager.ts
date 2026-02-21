/**
 * Chunk Manager - File chunking and reassembly
 */

import { secureRandomBytes } from '@liberty-reach/crypto';

/**
 * File chunk structure
 */
export interface FileChunk {
  chunkId: string;
  fileId: string;
  index: number;
  data: Uint8Array;
  size: number;
  hash: Uint8Array;
  encrypted?: boolean;
  encryptionKey?: Uint8Array;
}

/**
 * Chunk manifest for file reconstruction
 */
export interface ChunkManifest {
  fileId: string;
  totalChunks: number;
  chunkSize: number;
  totalSize: number;
  createdAt: number;
  metadata?: Record<string, unknown>;
  chunks: Array<{
    chunkId: string;
    index: number;
    size: number;
    hash: Uint8Array;
  }>;
}

/**
 * ChunkManager - Handles file chunking and reassembly
 */
export class ChunkManager {
  private chunkSize: number;

  constructor(chunkSize: number = 256 * 1024) {
    this.chunkSize = chunkSize;
  }

  /**
   * Generate unique file ID from content
   */
  async generateFileId(data: Uint8Array): Promise<string> {
    const hash = await this.hashData(data);
    return this.bufferToHex(hash);
  }

  /**
   * Chunk a file into pieces
   */
  chunkFile(data: Uint8Array, fileId: string): FileChunk[] {
    const chunks: FileChunk[] = [];
    const totalChunks = Math.ceil(data.length / this.chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.chunkSize;
      const end = Math.min(start + this.chunkSize, data.length);
      const chunkData = data.slice(start, end);

      chunks.push({
        chunkId: `${fileId}:${i}`,
        fileId,
        index: i,
        data: chunkData,
        size: chunkData.length,
        hash: this.hashDataSync(chunkData),
        encrypted: false,
      });
    }

    return chunks;
  }

  /**
   * Reassemble file from chunks
   */
  reassembleFile(chunks: FileChunk[], manifest: ChunkManifest): Uint8Array {
    // Sort chunks by index
    const sorted = [...chunks].sort((a, b) => a.index - b.index);

    // Verify all chunks are present
    if (sorted.length !== manifest.totalChunks) {
      throw new Error(`Missing chunks: expected ${manifest.totalChunks}, got ${sorted.length}`);
    }

    // Concatenate chunk data
    const totalSize = sorted.reduce((sum, c) => sum + c.size, 0);
    const reassembled = new Uint8Array(totalSize);

    let offset = 0;
    for (const chunk of sorted) {
      reassembled.set(chunk.data, offset);
      offset += chunk.size;
    }

    return reassembled;
  }

  /**
   * Verify chunk integrity
   */
  verifyChunk(chunk: FileChunk): boolean {
    const computedHash = this.hashDataSync(chunk.data);
    return this.arraysEqual(computedHash, chunk.hash);
  }

  /**
   * Encrypt chunk data
   */
  async encryptChunk(chunk: FileChunk, key: Uint8Array): Promise<FileChunk> {
    // In production, use actual encryption
    const encrypted = new Uint8Array(chunk.data); // Placeholder
    for (let i = 0; i < encrypted.length; i++) {
      encrypted[i] = chunk.data[i]! ^ key[i % key.length]!;
    }

    return {
      ...chunk,
      data: encrypted,
      encrypted: true,
      encryptionKey: key,
    };
  }

  /**
   * Decrypt chunk data
   */
  async decryptChunk(chunk: FileChunk): Promise<FileChunk> {
    if (!chunk.encrypted || !chunk.encryptionKey) {
      return chunk;
    }

    const decrypted = new Uint8Array(chunk.data);
    for (let i = 0; i < decrypted.length; i++) {
      decrypted[i] = chunk.data[i]! ^ chunk.encryptionKey[i % chunk.encryptionKey.length]!;
    }

    return {
      ...chunk,
      data: decrypted,
      encrypted: false,
    };
  }

  // ============================================================================
  // Private methods
  // ============================================================================

  private async hashData(data: Uint8Array): Promise<Uint8Array> {
    // In production, use BLAKE3 or SHA3-256
    const hash = new Uint8Array(32);
    for (let i = 0; i < data.length; i++) {
      hash[i % 32] ^= data[i]!;
    }
    return hash;
  }

  private hashDataSync(data: Uint8Array): Uint8Array {
    // Synchronous hash for chunking
    const hash = new Uint8Array(32);
    for (let i = 0; i < data.length; i++) {
      hash[i % 32] ^= data[i]!;
    }
    return hash;
  }

  private bufferToHex(buffer: Uint8Array): string {
    return Array.from(buffer)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
}
