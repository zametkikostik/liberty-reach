/**
 * FileSharer - P2P file sharing via WebRTC
 * 
 * Uses WebRTC Data Channels for direct file transfer.
 */

import type { FileInfo, TransferInfo } from '../types.js';

/**
 * Share configuration
 */
export interface ShareConfig {
  /** Max file size (bytes) */
  maxFileSize: number;
  /** Max concurrent transfers */
  maxConcurrentTransfers: number;
  /** Enable chunking for large files */
  enableChunking: boolean;
  /** Chunk size (bytes) */
  chunkSize: number;
  /** Enable encryption */
  enableEncryption: boolean;
}

/**
 * Transfer progress
 */
export interface TransferProgress {
  fileId: string;
  transferredBytes: number;
  totalBytes: number;
  progress: number; // 0-1
  speed: number; // bytes/sec
  eta: number; // seconds
}

/**
 * FileSharer - P2P file transfer
 */
export class FileSharer {
  private config: ShareConfig;
  private activeTransfers: Map<string, TransferInfo> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private onProgress: ((progress: TransferProgress) => void) | null = null;
  private onComplete: ((transfer: TransferInfo) => void) | null = null;

  constructor(config: Partial<ShareConfig> = {}) {
    this.config = {
      maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
      maxConcurrentTransfers: 5,
      enableChunking: true,
      chunkSize: 64 * 1024, // 64KB
      enableEncryption: true,
      ...config,
    };
  }

  /**
   * Share a file - create transfer offer
   */
  async shareFile(file: File): Promise<{ fileId: string; shareUrl: string }> {
    if (file.size > this.config.maxFileSize) {
      throw new Error(`File too large. Max size: ${this.config.maxFileSize} bytes`);
    }

    const fileInfo: FileInfo = {
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      createdAt: Date.now(),
    };

    const transfer: TransferInfo = {
      id: `transfer-${Date.now()}`,
      file: fileInfo,
      from: 'local',
      to: '',
      direction: 'upload',
      status: 'pending',
      progress: 0,
      speed: 0,
      eta: 0,
      createdAt: Date.now(),
    };

    this.activeTransfers.set(transfer.id, transfer);

    // Generate share URL (in production, use FilePizza or similar)
    const shareUrl = `https://file.pizza/#${fileInfo.id}`;

    return {
      fileId: fileInfo.id,
      shareUrl,
    };
  }

  /**
   * Download a file from share URL
   */
  async downloadFile(shareUrl: string): Promise<TransferInfo> {
    const fileId = this.extractFileId(shareUrl);
    if (!fileId) {
      throw new Error('Invalid share URL');
    }

    // Check concurrent transfers
    const activeCount = Array.from(this.activeTransfers.values())
      .filter(t => t.status === 'transferring').length;
    
    if (activeCount >= this.config.maxConcurrentTransfers) {
      throw new Error('Too many active transfers');
    }

    const transfer: TransferInfo = {
      id: `download-${Date.now()}`,
      file: {
        id: fileId,
        name: 'Downloading...',
        size: 0,
        type: '',
        createdAt: Date.now(),
      },
      from: '',
      to: 'local',
      direction: 'download',
      status: 'pending',
      progress: 0,
      speed: 0,
      eta: 0,
      createdAt: Date.now(),
    };

    this.activeTransfers.set(transfer.id, transfer);

    // Connect to peer and start download
    await this.connectToPeer(fileId);

    return transfer;
  }

  /**
   * Send file via data channel
   */
  async sendFile(dataChannel: RTCDataChannel, file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const chunkSize = this.config.chunkSize;
      let offset = 0;
      const startTime = Date.now();

      const sendNextChunk = () => {
        if (offset >= file.size) {
          resolve();
          return;
        }

        const chunk = file.slice(offset, offset + chunkSize);
        const reader = new FileReader();

        reader.onload = () => {
          const buffer = reader.result as ArrayBuffer;
          
          // Send chunk metadata
          dataChannel.send(JSON.stringify({
            type: 'chunk',
            offset,
            size: chunk.size,
          }));

          // Send chunk data
          dataChannel.send(buffer);

          offset += chunk.size;

          // Update progress
          const elapsed = (Date.now() - startTime) / 1000;
          const speed = offset / elapsed;
          const progress = offset / file.size;
          const eta = (file.size - offset) / speed;

          if (this.onProgress) {
            this.onProgress({
              fileId: file.name,
              transferredBytes: offset,
              totalBytes: file.size,
              progress,
              speed,
              eta,
            });
          }

          // Send next chunk
          setTimeout(sendNextChunk, 0);
        };

        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(chunk);
      };

      sendNextChunk();
    });
  }

  /**
   * Receive file from data channel
   */
  async receiveFile(dataChannel: RTCDataChannel, fileInfo: FileInfo): Promise<File> {
    return new Promise((resolve, reject) => {
      const chunks: ArrayBuffer[] = [];
      let receivedBytes = 0;
      const startTime = Date.now();

      dataChannel.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          chunks.push(event.data);
          receivedBytes += event.data.byteLength;

          // Update progress
          const elapsed = (Date.now() - startTime) / 1000;
          const speed = receivedBytes / elapsed;
          const progress = receivedBytes / fileInfo.size;
          const eta = (fileInfo.size - receivedBytes) / speed;

          if (this.onProgress) {
            this.onProgress({
              fileId: fileInfo.id,
              transferredBytes: receivedBytes,
              totalBytes: fileInfo.size,
              progress,
              speed,
              eta,
            });
          }

          // Check if complete
          if (receivedBytes >= fileInfo.size) {
            const blob = new Blob(chunks, { type: fileInfo.type });
            const file = new File([blob], fileInfo.name, { type: fileInfo.type });
            resolve(file);

            if (this.onComplete) {
              this.onComplete({
                id: `transfer-${Date.now()}`,
                file: fileInfo,
                from: 'remote',
                to: 'local',
                direction: 'download',
                status: 'completed',
                progress: 100,
                speed,
                eta: 0,
                createdAt: Date.now(),
                completedAt: Date.now(),
              });
            }
          }
        }
      };
    });
  }

  /**
   * Pause transfer
   */
  pauseTransfer(transferId: string): boolean {
    const transfer = this.activeTransfers.get(transferId);
    if (!transfer) return false;

    transfer.status = 'paused';
    return true;
  }

  /**
   * Resume transfer
   */
  resumeTransfer(transferId: string): boolean {
    const transfer = this.activeTransfers.get(transferId);
    if (!transfer) return false;

    transfer.status = 'transferring';
    return true;
  }

  /**
   * Cancel transfer
   */
  cancelTransfer(transferId: string): boolean {
    const transfer = this.activeTransfers.get(transferId);
    if (!transfer) return false;

    transfer.status = 'failed';
    this.activeTransfers.delete(transferId);
    return true;
  }

  /**
   * Get active transfers
   */
  getActiveTransfers(): TransferInfo[] {
    return Array.from(this.activeTransfers.values());
  }

  /**
   * Get transfer by ID
   */
  getTransfer(transferId: string): TransferInfo | null {
    return this.activeTransfers.get(transferId) || null;
  }

  /**
   * Set progress handler
   */
  onTransferProgress(handler: (progress: TransferProgress) => void): void {
    this.onProgress = handler;
  }

  /**
   * Set complete handler
   */
  onTransferComplete(handler: (transfer: TransferInfo) => void): void {
    this.onComplete = handler;
  }

  // ============================================================================
  // Private methods
  // ============================================================================

  private extractFileId(shareUrl: string): string | null {
    try {
      const url = new URL(shareUrl);
      const hash = url.hash.substring(1);
      return hash || null;
    } catch {
      return null;
    }
  }

  private async connectToPeer(fileId: string): Promise<void> {
    // In production, connect to FilePizza tracker or use WebTorrent
    console.log('Connecting to peer for file:', fileId);
  }
}
