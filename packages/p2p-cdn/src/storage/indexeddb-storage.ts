/**
 * IndexedDB Storage Implementation
 */

import { ChunkStorage, type StorageStats } from './chunk-storage.js';
import type { FileChunk, ChunkManifest } from '../core/chunk-manager.js';

const DB_NAME = 'liberty-reach-p2p-cdn';
const DB_VERSION = 1;
const CHUNKS_STORE = 'chunks';
const MANIFESTS_STORE = 'manifests';

/**
 * IndexedDB-based chunk storage
 */
export class IndexedDBStorage extends ChunkStorage {
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(CHUNKS_STORE)) {
          const chunksStore = db.createObjectStore(CHUNKS_STORE, { keyPath: 'chunkId' });
          chunksStore.createIndex('fileId', 'fileId', { unique: false });
        }

        if (!db.objectStoreNames.contains(MANIFESTS_STORE)) {
          const manifestsStore = db.createObjectStore(MANIFESTS_STORE, { keyPath: 'fileId' });
        }
      };
    });
  }

  async storeChunk(chunk: FileChunk): Promise<void> {
    if (!this.db) throw new Error('Storage not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CHUNKS_STORE], 'readwrite');
      const store = transaction.objectStore(CHUNKS_STORE);

      // Convert Uint8Arrays to arrays for IndexedDB
      const serializableChunk = {
        ...chunk,
        data: Array.from(chunk.data),
        hash: Array.from(chunk.hash),
        encryptionKey: chunk.encryptionKey ? Array.from(chunk.encryptionKey) : undefined,
      };

      const request = store.put(serializableChunk);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getChunk(chunkId: string): Promise<FileChunk | null> {
    if (!this.db) throw new Error('Storage not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CHUNKS_STORE], 'readonly');
      const store = transaction.objectStore(CHUNKS_STORE);
      const request = store.get(chunkId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }

        // Convert arrays back to Uint8Arrays
        const chunk: FileChunk = {
          ...result,
          data: new Uint8Array(result.data),
          hash: new Uint8Array(result.hash),
          encryptionKey: result.encryptionKey ? new Uint8Array(result.encryptionKey) : undefined,
        };
        resolve(chunk);
      };
    });
  }

  async deleteChunk(chunkId: string): Promise<void> {
    if (!this.db) throw new Error('Storage not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CHUNKS_STORE], 'readwrite');
      const store = transaction.objectStore(CHUNKS_STORE);
      const request = store.delete(chunkId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getAllChunkIds(): Promise<string[]> {
    if (!this.db) throw new Error('Storage not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CHUNKS_STORE], 'readonly');
      const store = transaction.objectStore(CHUNKS_STORE);
      const request = store.getAllKeys();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as string[]);
    });
  }

  async storeManifest(manifest: ChunkManifest): Promise<void> {
    if (!this.db) throw new Error('Storage not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MANIFESTS_STORE], 'readwrite');
      const store = transaction.objectStore(MANIFESTS_STORE);

      const serializableManifest = {
        ...manifest,
        chunks: manifest.chunks.map(c => ({
          ...c,
          hash: Array.from(c.hash),
        })),
      };

      const request = store.put(serializableManifest);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getManifest(fileId: string): Promise<ChunkManifest | null> {
    if (!this.db) throw new Error('Storage not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MANIFESTS_STORE], 'readonly');
      const store = transaction.objectStore(MANIFESTS_STORE);
      const request = store.get(fileId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }

        const manifest: ChunkManifest = {
          ...result,
          chunks: result.chunks.map((c: any) => ({
            ...c,
            hash: new Uint8Array(c.hash),
          })),
        };
        resolve(manifest);
      };
    });
  }

  async deleteManifest(fileId: string): Promise<void> {
    if (!this.db) throw new Error('Storage not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MANIFESTS_STORE], 'readwrite');
      const store = transaction.objectStore(MANIFESTS_STORE);
      const request = store.delete(fileId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getAllManifests(): Promise<ChunkManifest[]> {
    if (!this.db) throw new Error('Storage not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MANIFESTS_STORE], 'readonly');
      const store = transaction.objectStore(MANIFESTS_STORE);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const manifests = request.result.map((result: any) => ({
          ...result,
          chunks: result.chunks.map((c: any) => ({
            ...c,
            hash: new Uint8Array(c.hash),
          })),
        }));
        resolve(manifests);
      };
    });
  }

  async getStats(): Promise<StorageStats> {
    const chunkIds = await this.getAllChunkIds();
    const manifests = await this.getAllManifests();

    let usedBytes = 0;
    for (const manifest of manifests) {
      usedBytes += manifest.totalSize;
    }

    return {
      usedBytes,
      totalBytes: 10 * 1024 * 1024 * 1024, // 10GB quota
      chunkCount: chunkIds.length,
      fileCount: manifests.length,
    };
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
