# @liberty-reach/protocol

Liberty Reach Protocol (LRP) - Wire Protocol and Message Format.

## Features

- **Binary Frame Format** - Efficient wire protocol with CRC32 integrity
- **Message Types** - Text, media, files, calls, reactions, system messages
- **Multi-frame Support** - Automatic fragmentation for large payloads
- **Metadata** - Rich message metadata (reactions, receipts, edits)
- **Session Management** - Direct, group, channel conversations
- **Contact System** - Public key registry and profile management

## Installation

```bash
npm install @liberty-reach/protocol
```

## Usage

### Encoding Messages

```typescript
import { LRPEncoder, MessageType, MessagePriority } from '@liberty-reach/protocol';

const encoder = new LRPEncoder();

const message = {
  header: {
    version: '1.0.0',
    messageId: encoder.generateMessageId(),
    conversationId: 'conv_abc123',
    senderId: 'user_xyz789',
    timestamp: Date.now(),
    type: MessageType.TEXT,
    priority: MessagePriority.NORMAL,
    flags: {
      encrypted: true,
      signed: true,
      compressed: false,
      requiresReceipt: true,
      isForwarded: false,
      isEdited: false,
      isDeleted: false,
    },
  },
  body: {
    content: 'Hello, World!',
  },
};

const frames = encoder.encode(message);
// Send frames over network
```

### Decoding Messages

```typescript
import { LRPDecoder } from '@liberty-reach/protocol';

const decoder = new LRPDecoder();

// Receive frames from network
const message = decoder.decode(frames);

console.log(message.header.type); // MessageType.TEXT
console.log(message.body.content); // "Hello, World!"
```

### Frame Operations

```typescript
import { 
  encodeFrame, 
  decodeFrame, 
  splitIntoFrames, 
  reassembleFrames,
  FrameType 
} from '@liberty-reach/protocol';

// Encode single frame
const frame = {
  type: FrameType.SINGLE,
  frameId: 1n,
  previousFrameId: 0n,
  payload: new Uint8Array([1, 2, 3, 4]),
  crc: 0,
};

const encoded = encodeFrame(frame);
const decoded = decodeFrame(encoded);

// Split large payload
const frames = splitIntoFrames(largePayload);

// Reassemble frames
const payload = reassembleFrames(frames);
```

## Message Types

| Type | Code | Category |
|------|------|----------|
| TEXT | 0x01 | Chat |
| MARKDOWN | 0x02 | Chat |
| IMAGE | 0x10 | Media |
| VIDEO | 0x11 | Media |
| AUDIO | 0x12 | Media |
| VOICE_MESSAGE | 0x13 | Media |
| FILE | 0x20 | File |
| DOCUMENT | 0x21 | File |
| CALL_INVITE | 0x40 | Call |
| CALL_ACCEPT | 0x41 | Call |
| CALL_END | 0x43 | Call |
| REACTION | 0x50 | Interaction |
| EDIT | 0x51 | Interaction |
| TYPING | 0x60 | Control |
| READ_RECEIPT | 0x63 | Control |

## Frame Format

```
+------------------+------------------+------------------+
|     Magic (4)    |   Version (1)    |  Frame Type (1)  |
+------------------+------------------+------------------+
|        Length (4 bytes, big-endian)                    |
+------------------+------------------+------------------+
|        Frame ID (8 bytes, big-endian)                  |
+------------------+------------------+------------------+
|        Previous Frame ID (8 bytes)                     |
+------------------+------------------+------------------+
|                    Payload...                          |
+------------------+------------------+------------------+
|        CRC32 (4 bytes)                                 |
+------------------+------------------+------------------+
```

### Frame Types

- `SINGLE` (0x01) - Single-frame message
- `FIRST` (0x02) - First frame of multi-frame
- `MIDDLE` (0x03) - Middle frame
- `LAST` (0x04) - Last frame
- `ACK` (0x10) - Acknowledgment
- `NACK` (0x11) - Negative acknowledgment
- `PING` (0x20) - Keep-alive ping
- `PONG` (0x21) - Keep-alive pong

## Conversation Types

- `PRIVATE` - One-on-one chat
- `GROUP` - Multi-user chat
- `CHANNEL` - Broadcast channel
- `SECRET` - Encrypted group chat

## API Reference

### LRPEncoder

- `encode(message, options)` - Encode message to frames
- `generateMessageId()` - Generate unique message ID

### LRPDecoder

- `decode(frames, options)` - Decode frames to message

### Frame Functions

- `encodeFrame(frame)` - Encode frame to binary
- `decodeFrame(data)` - Decode frame from binary
- `splitIntoFrames(payload)` - Split large payload
- `reassembleFrames(frames)` - Reassemble payload
- `parseFrameHeader(data)` - Parse header only

### Constants

- `FRAME_MAGIC` - Frame magic bytes
- `FRAME_VERSION` - Current frame version
- `MAX_FRAME_SIZE` - Maximum frame size (64MB)
- `FRAME_HEADER_SIZE` - Header size (30 bytes)
- `PROTOCOL_VERSION` - Protocol version string

## License

AGPL-3.0-or-later
