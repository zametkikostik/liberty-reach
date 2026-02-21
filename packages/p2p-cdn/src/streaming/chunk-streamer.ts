/**
 * Chunk Streamer - Stream chunks for large files
 */

import type { FileChunk, ChunkManifest } from '../core/chunk-manager.js';
import type { TransferProgress } from '../types.js';

/**
 * Streaming options
 */
export interface StreamOptions {
  prefetchChunks: number;
  bufferSize: number;
}

/**
 * ChunkStreamer - Streams file chunks progressively
 */
export class ChunkStreamer {
  private options: StreamOptions;
  private buffer: Uint8Array[] = [];
  private bufferOffset = 0;

  constructor(options?: Partial<StreamOptions>) {
    this.options = {
      prefetchChunks: 3,
      bufferSize: 1024 * 1024, // 1MB
      ...options,
    };
  }

  /**
   * Create async iterator for streaming
   */
  async *stream(
    chunks: AsyncGenerator<FileChunk>,
    manifest: ChunkManifest,
    onProgress?: (progress: TransferProgress) => void
  ): AsyncGenerator<Uint8Array> {
    let downloadedBytes = 0;
    let chunkCount = 0;

    for await (const chunk of chunks) {
      this.buffer.push(chunk.data);
      downloadedBytes += chunk.size;
      chunkCount++;

      if (onProgress) {
        onProgress({
          fileId: manifest.fileId,
          downloadedBytes,
          totalBytes: manifest.totalSize,
          progress: downloadedBytes / manifest.totalSize,
          downloadedChunks: chunkCount,
          totalChunks: manifest.totalChunks,
        });
      }

      // Yield data when buffer is large enough
      while (this.getBufferSize() >= this.options.bufferSize) {
        yield this.readFromBuffer(this.options.bufferSize);
      }
    }

    // Yield remaining data
    while (this.getBufferSize() > 0) {
      yield this.readFromBuffer(this.options.bufferSize);
    }
  }

  private getBufferSize(): number {
    return this.buffer.reduce((sum, chunk) => sum + chunk.length, 0) - this.bufferOffset;
  }

  private readFromBuffer(maxSize: number): Uint8Array {
    const result = new Uint8Array(Math.min(maxSize, this.getBufferSize()));
    let offset = 0;

    while (offset < result.length && this.buffer.length > 0) {
      const chunk = this.buffer[0]!;
      const available = chunk.length - this.bufferOffset;
      const toCopy = Math.min(available, result.length - offset);

      result.set(chunk.subarray(this.bufferOffset, this.bufferOffset + toCopy), offset);
      offset += toCopy;
      this.bufferOffset += toCopy;

      if (this.bufferOffset >= chunk.length) {
        this.buffer.shift();
        this.bufferOffset = 0;
      }
    }

    return result;
  }
}
