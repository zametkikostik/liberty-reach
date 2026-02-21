/**
 * File Sharing Types
 */

/**
 * File information
 */
export interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  hash?: string;
  thumbnail?: string;
  createdAt: number;
}

/**
 * Transfer information
 */
export interface TransferInfo {
  id: string;
  file: FileInfo;
  from: string;
  to: string;
  direction: 'upload' | 'download';
  status: 'pending' | 'transferring' | 'completed' | 'paused' | 'failed';
  progress: number; // 0-100
  speed: number; // bytes per second
  eta: number; // seconds
  peerId?: string;
  createdAt: number;
  completedAt?: number;
}

/**
 * Peer information
 */
export interface PeerInfo {
  id: string;
  name: string;
  connected: boolean;
  uploadSpeed: number;
  downloadSpeed: number;
  filesShared: number;
}
