/**
 * Media Streamer - Stream audio/video media
 */

import { ChunkStreamer } from './chunk-streamer.js';
import type { ChunkManifest } from '../core/chunk-manager.js';
import type { TransferProgress } from '../types.js';

/**
 * MediaStreamer - Specialized streamer for media files
 */
export class MediaStreamer extends ChunkStreamer {
  private mediaSource: MediaSource | null = null;
  private sourceBuffer: SourceBuffer | null = null;
  private mimeType: string;

  constructor(mimeType: string = 'video/webm; codecs="vp9, opus"') {
    super({
      prefetchChunks: 5,
      bufferSize: 2 * 1024 * 1024, // 2MB for media
    });
    this.mimeType = mimeType;
  }

  /**
   * Stream media to HTML5 video/audio element
   */
  async streamToElement(
    chunks: AsyncGenerator<Uint8Array>,
    manifest: ChunkManifest,
    mediaElement: HTMLMediaElement,
    onProgress?: (progress: TransferProgress) => void
  ): Promise<void> {
    if (!('MediaSource' in window)) {
      throw new Error('MediaSource not supported');
    }

    this.mediaSource = new MediaSource();
    mediaElement.src = URL.createObjectURL(this.mediaSource);

    await new Promise<void>((resolve) => {
      this.mediaSource!.addEventListener('sourceopen', () => {
        this.sourceBuffer = this.mediaSource!.addSourceBuffer(this.mimeType);
        resolve();
      });
    });

    // Stream chunks to source buffer
    for await (const chunk of chunks) {
      await this.appendChunk(chunk);
      
      if (onProgress) {
        // Progress tracking would need chunk metadata
      }
    }

    this.mediaSource?.endOfStream();
  }

  private async appendChunk(chunk: Uint8Array): Promise<void> {
    if (!this.sourceBuffer) return;

    // Wait if buffer is updating
    while (this.sourceBuffer.updating) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    // Remove old data to prevent memory overflow
    const currentTime = this.mediaSource?.duration || 0;
    if (currentTime > 60) {
      this.sourceBuffer.remove(0, currentTime - 30);
    }

    this.sourceBuffer.appendBuffer(chunk);
  }

  /**
   * Get playable blob URL (for smaller files)
   */
  async getBlobUrl(chunks: AsyncGenerator<Uint8Array>): Promise<string> {
    const allChunks: Uint8Array[] = [];

    for await (const chunk of chunks) {
      allChunks.push(chunk);
    }

    const blob = new Blob(allChunks, { type: this.mimeType });
    return URL.createObjectURL(blob);
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.mediaSource) {
      URL.revokeObjectURL(URL.createObjectURL(this.mediaSource));
      this.mediaSource = null;
    }
    this.sourceBuffer = null;
  }
}
