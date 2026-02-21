# @liberty-reach/p2p-cdn

P2P Content Delivery Network via WebRTC Data Channels.

## Features

- **Decentralized File Distribution** - Files chunked and distributed across peer mesh
- **WebRTC Data Channels** - Direct P2P file transfer
- **Parallel Downloads** - Download chunks from multiple peers simultaneously
- **Automatic Seeding** - Share downloaded chunks with network
- **Streaming Support** - Stream large files while downloading
- **Media Streaming** - Play audio/video while downloading
- **IndexedDB Storage** - Persistent chunk storage in browser
- **Chunk Verification** - Hash-based integrity checking

## Installation

```bash
npm install @liberty-reach/p2p-cdn
```

## Usage

### Basic Upload/Download

```typescript
import { P2PCDN, IndexedDBStorage } from '@liberty-reach/p2p-cdn';

const cdn = new P2PCDN({
  storage: new IndexedDBStorage(),
  maxConcurrentDownloads: 10,
  enableSeeding: true,
  seedDuration: 3600, // 1 hour
});

await cdn.connect();

// Upload a file
const file = new File(['hello world'], 'test.txt');
const cdnFile = await cdn.upload(file, { name: 'test.txt' });

console.log('File ID:', cdnFile.fileId);
console.log('Manifest:', cdnFile.manifest);

// Download a file
const downloaded = await cdn.download(
  cdnFile.fileId,
  cdnFile.manifest,
  (progress) => {
    console.log(`Download: ${(progress.progress * 100).toFixed(1)}%`);
  }
);

console.log('Downloaded:', new TextDecoder().decode(downloaded));
```

### Streaming Large Files

```typescript
// Stream a large file
const stream = cdn.stream(
  fileId,
  manifest,
  (progress) => console.log(progress)
);

for await (const chunk of stream) {
  // Process chunk
  console.log('Received chunk:', chunk.length, 'bytes');
}
```

### Media Streaming

```typescript
import { MediaStreamer } from '@liberty-reach/p2p-cdn';

const mediaStreamer = new MediaStreamer('video/webm; codecs="vp9, opus"');

const videoElement = document.querySelector('video');

// Get chunks from CDN
async function* getChunks() {
  for await (const chunk of cdn.stream(fileId, manifest)) {
    yield chunk;
  }
}

// Stream to video element
await mediaStreamer.streamToElement(
  getChunks(),
  manifest,
  videoElement,
  (progress) => console.log(progress)
);
```

### P2P File Sharing

```typescript
// Multiple peers can share the same file
// Peer 1: Upload and seed
const file1 = await cdn.upload(largeFile);

// Peer 2: Download from Peer 1
const downloaded = await cdn.download(file1.fileId, file1.manifest);

// Peer 3: Can now download from either Peer 1 or Peer 2
// (whichever is faster/closer)
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    P2P CDN Network                           │
│                                                              │
│  ┌──────────┐         ┌──────────┐         ┌──────────┐    │
│  │  Peer 1  │◄───────▶│  Peer 2  │◄───────▶│  Peer 3  │    │
│  │  [A,B]   │  WebRTC  │  [B,C]   │  WebRTC  │  [C,D]   │    │
│  └──────────┘         └──────────┘         └──────────┘    │
│       ▲                    ▲                    ▲           │
│       │                    │                    │           │
│       └────────────────────┼────────────────────┘           │
│                            │                                │
│                     ┌──────▼──────┐                         │
│                     │Chunk Tracker│                         │
│                     └─────────────┘                         │
└─────────────────────────────────────────────────────────────┘

File is split into chunks [A,B,C,D]
Each peer has different chunks
Downloads happen in parallel from multiple peers
```

## API Reference

### P2PCDN

#### Constructor Options

```typescript
interface P2PCDNOptions {
  maxConcurrentDownloads: number;  // Default: 10
  maxConcurrentUploads: number;    // Default: 20
  chunkSize: number;               // Default: 256KB
  storage: ChunkStorage;           // Storage backend
  enableSeeding: boolean;          // Default: true
  seedDuration: number;            // Default: 3600 (1 hour)
  discoveryInterval: number;       // Default: 30000 (30s)
}
```

#### Methods

- `connect()` - Connect to P2P network
- `disconnect()` - Disconnect from network
- `upload(file, metadata)` - Upload file to CDN
- `download(fileId, manifest, onProgress)` - Download file
- `stream(fileId, manifest, onProgress)` - Stream file
- `delete(fileId)` - Delete from local storage
- `getStats()` - Get CDN statistics
- `getStoredFiles()` - List stored files

### ChunkManager

- `chunkFile(data, fileId)` - Split file into chunks
- `reassembleFile(chunks, manifest)` - Reconstruct file
- `verifyChunk(chunk)` - Verify chunk integrity
- `encryptChunk(chunk, key)` - Encrypt chunk
- `decryptChunk(chunk)` - Decrypt chunk

### PeerMesh

- `connect()` - Connect to mesh
- `disconnect()` - Disconnect from mesh
- `discoverPeers()` - Discover new peers
- `requestChunk(peerId, chunkId)` - Request chunk from peer
- `sendChunk(peerId, chunk)` - Send chunk to peer
- `getConnectedPeers()` - Get list of peers
- `getPeerStats()` - Get peer statistics

### ChunkStorage

Abstract interface with implementations:

- `IndexedDBStorage` - Browser persistent storage
- `MemoryStorage` - In-memory storage (testing)

Methods:
- `storeChunk(chunk)` - Store chunk
- `getChunk(chunkId)` - Retrieve chunk
- `deleteChunk(chunkId)` - Delete chunk
- `storeManifest(manifest)` - Store file manifest
- `getManifest(fileId)` - Get file manifest

## Performance

| Metric | Target | Typical |
|--------|--------|---------|
| Chunk Size | 256KB | 256KB |
| Max Concurrent Downloads | 10 | 10 |
| Download Speed (per peer) | 1MB/s | 5MB/s |
| Aggregate Download Speed | 10MB/s | 50MB/s |
| Storage Quota | 10GB | Browser dependent |

## Security

- **Chunk Encryption** - Optional AES-256-GCM encryption
- **Chunk Verification** - BLAKE3 hash verification
- **Peer Authentication** - Signed chunk requests
- **Rate Limiting** - Prevent abuse

## Browser Support

| Browser | Version | Notes |
|---------|---------|-------|
| Chrome | 80+ | Full support |
| Firefox | 75+ | Full support |
| Safari | 14+ | Full support |
| Edge | 80+ | Full support |

## License

AGPL-3.0-or-later
