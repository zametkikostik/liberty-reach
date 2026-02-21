/**
 * TransferManager - Manage file transfers queue
 */

import type { TransferInfo } from '../types.js';

/**
 * TransferManager - Manages transfer queue
 */
export class TransferManager {
  private transfers: Map<string, TransferInfo> = new Map();
  private maxConcurrent: number = 5;
  private queue: string[] = [];

  constructor(maxConcurrent: number = 5) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Add transfer to queue
   */
  addTransfer(transfer: TransferInfo): void {
    this.transfers.set(transfer.id, transfer);
    
    if (transfer.status === 'pending') {
      this.queue.push(transfer.id);
      this.processQueue();
    }
  }

  /**
   * Get transfer by ID
   */
  getTransfer(id: string): TransferInfo | null {
    return this.transfers.get(id) || null;
  }

  /**
   * Get all transfers
   */
  getAllTransfers(): TransferInfo[] {
    return Array.from(this.transfers.values());
  }

  /**
   * Get active transfers
   */
  getActiveTransfers(): TransferInfo[] {
    return Array.from(this.transfers.values())
      .filter(t => t.status === 'transferring');
  }

  /**
   * Get pending transfers
   */
  getPendingTransfers(): TransferInfo[] {
    return Array.from(this.transfers.values())
      .filter(t => t.status === 'pending');
  }

  /**
   * Get completed transfers
   */
  getCompletedTransfers(): TransferInfo[] {
    return Array.from(this.transfers.values())
      .filter(t => t.status === 'completed');
  }

  /**
   * Pause transfer
   */
  pauseTransfer(id: string): boolean {
    const transfer = this.transfers.get(id);
    if (!transfer) return false;

    transfer.status = 'paused';
    this.queue = this.queue.filter(tid => tid !== id);
    return true;
  }

  /**
   * Resume transfer
   */
  resumeTransfer(id: string): boolean {
    const transfer = this.transfers.get(id);
    if (!transfer) return false;

    transfer.status = 'pending';
    this.queue.push(id);
    this.processQueue();
    return true;
  }

  /**
   * Cancel transfer
   */
  cancelTransfer(id: string): boolean {
    const transfer = this.transfers.get(id);
    if (!transfer) return false;

    transfer.status = 'failed';
    this.queue = this.queue.filter(tid => tid !== id);
    return true;
  }

  /**
   * Remove transfer from history
   */
  removeTransfer(id: string): boolean {
    return this.transfers.delete(id);
  }

  /**
   * Clear completed transfers
   */
  clearCompleted(): number {
    let count = 0;
    for (const [id, transfer] of this.transfers.entries()) {
      if (transfer.status === 'completed') {
        this.transfers.delete(id);
        count++;
      }
    }
    return count;
  }

  /**
   * Get transfer statistics
   */
  getStats(): {
    total: number;
    active: number;
    pending: number;
    completed: number;
    failed: number;
    totalBytesTransferred: number;
  } {
    const transfers = Array.from(this.transfers.values());
    
    return {
      total: transfers.length,
      active: transfers.filter(t => t.status === 'transferring').length,
      pending: transfers.filter(t => t.status === 'pending').length,
      completed: transfers.filter(t => t.status === 'completed').length,
      failed: transfers.filter(t => t.status === 'failed').length,
      totalBytesTransferred: transfers
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + t.file.size, 0),
    };
  }

  // ============================================================================
  // Private methods
  // ============================================================================

  private processQueue(): void {
    const activeCount = this.getActiveTransfers().length;
    
    while (this.queue.length > 0 && activeCount < this.maxConcurrent) {
      const transferId = this.queue.shift()!;
      const transfer = this.transfers.get(transferId);
      
      if (transfer && transfer.status === 'pending') {
        transfer.status = 'transferring';
      }
    }
  }
}
