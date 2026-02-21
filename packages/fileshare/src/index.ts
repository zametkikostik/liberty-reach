/**
 * P2P File Sharing for Liberty Reach
 * 
 * FilePizza integration - WebRTC P2P file transfer.
 * 
 * @module @liberty-reach/fileshare
 */

// Core
export { FileSharer, type ShareConfig, type TransferProgress } from './core/file-sharer.js';
export { FilePizzaClient, type PizzaConfig } from './core/filepizza-client.js';
export { TransferManager } from './core/transfer-manager.js';

// UI
export { FileTransferUI } from './ui/file-transfer-ui.js';
export { DropZone } from './ui/dropzone.js';

// Types
export type {
  FileInfo,
  TransferInfo,
  PeerInfo,
} from './types.js';
