/**
 * LRP Frame Format
 * 
 * Binary frame format for wire transmission.
 * 
 * Frame Structure:
 * +------------------+------------------+------------------+
 * |     Magic (4)    |   Version (1)    |  Frame Type (1)  |
 * +------------------+------------------+------------------+
 * |        Length (4 bytes, big-endian)                    |
 * +------------------+------------------+------------------+
 * |        Frame ID (8 bytes, big-endian)                  |
 * +------------------+------------------+------------------+
 * |        Previous Frame ID (8 bytes, or 0)               |
 * +------------------+------------------+------------------+
 * |                    Payload...                          |
 * +------------------+------------------+------------------+
 * |        CRC32 (4 bytes)                                 |
 * +------------------+------------------+------------------+
 */

/**
 * Frame magic bytes: "LRPF" (Liberty Reach Protocol Frame)
 */
export const FRAME_MAGIC = new Uint8Array([0x4c, 0x52, 0x50, 0x46]);

/**
 * Frame version
 */
export const FRAME_VERSION = 1;

/**
 * Maximum frame size (64MB)
 */
export const MAX_FRAME_SIZE = 64 * 1024 * 1024;

/**
 * Frame header size
 */
export const FRAME_HEADER_SIZE = 30;

/**
 * CRC size
 */
export const FRAME_CRC_SIZE = 4;

/**
 * Frame types
 */
export enum FrameType {
  /** Single-frame message */
  SINGLE = 0x01,
  
  /** First frame of multi-frame message */
  FIRST = 0x02,
  
  /** Middle frame of multi-frame message */
  MIDDLE = 0x03,
  
  /** Last frame of multi-frame message */
  LAST = 0x04,
  
  /** Acknowledgment frame */
  ACK = 0x10,
  
  /** Negative acknowledgment */
  NACK = 0x11,
  
  /** Keep-alive ping */
  PING = 0x20,
  
  /** Keep-alive pong */
  PONG = 0x21,
  
  /** Flow control */
  FLOW_CONTROL = 0x30,
}

/**
 * LRP Frame structure
 */
export interface LRPFrame {
  type: FrameType;
  frameId: bigint;
  previousFrameId: bigint;
  payload: Uint8Array;
  crc: number;
}

/**
 * Frame header structure
 */
export interface FrameHeader {
  magic: Uint8Array;
  version: number;
  type: FrameType;
  length: number;
  frameId: bigint;
  previousFrameId: bigint;
}

/**
 * Encode a frame to binary
 */
export function encodeFrame(frame: LRPFrame): Uint8Array {
  const totalSize = FRAME_HEADER_SIZE + frame.payload.length + FRAME_CRC_SIZE;
  const buffer = new Uint8Array(totalSize);
  const view = new DataView(buffer.buffer);
  
  let offset = 0;
  
  // Magic (4 bytes)
  buffer.set(FRAME_MAGIC, offset);
  offset += 4;
  
  // Version (1 byte)
  view.setUint8(offset, FRAME_VERSION);
  offset += 1;
  
  // Frame type (1 byte)
  view.setUint8(offset, frame.type);
  offset += 1;
  
  // Length (4 bytes, big-endian)
  view.setUint32(offset, frame.payload.length, false);
  offset += 4;
  
  // Frame ID (8 bytes, big-endian)
  view.setBigUint64(offset, frame.frameId, false);
  offset += 8;
  
  // Previous Frame ID (8 bytes, big-endian)
  view.setBigUint64(offset, frame.previousFrameId, false);
  offset += 8;
  
  // Payload
  buffer.set(frame.payload, offset);
  offset += frame.payload.length;
  
  // CRC32 (4 bytes, big-endian)
  const crc = calculateCRC32(buffer.slice(0, offset));
  view.setUint32(offset, crc, false);
  
  return buffer;
}

/**
 * Decode a frame from binary
 */
export function decodeFrame(data: Uint8Array): LRPFrame {
  if (data.length < FRAME_HEADER_SIZE + FRAME_CRC_SIZE) {
    throw new Error('Frame too small');
  }
  
  const view = new DataView(data.buffer);
  let offset = 0;
  
  // Magic (4 bytes)
  const magic = data.slice(offset, offset + 4);
  if (!arraysEqual(magic, FRAME_MAGIC)) {
    throw new Error('Invalid frame magic');
  }
  offset += 4;
  
  // Version (1 byte)
  const version = view.getUint8(offset);
  if (version !== FRAME_VERSION) {
    throw new Error(`Unsupported frame version: ${version}`);
  }
  offset += 1;
  
  // Frame type (1 byte)
  const type = view.getUint8(offset) as FrameType;
  offset += 1;
  
  // Length (4 bytes)
  const length = view.getUint32(offset, false);
  offset += 4;
  
  // Frame ID (8 bytes)
  const frameId = view.getBigUint64(offset, false);
  offset += 8;
  
  // Previous Frame ID (8 bytes)
  const previousFrameId = view.getBigUint64(offset, false);
  offset += 8;
  
  // Validate total size
  const expectedSize = FRAME_HEADER_SIZE + length + FRAME_CRC_SIZE;
  if (data.length !== expectedSize) {
    throw new Error(`Frame size mismatch: expected ${expectedSize}, got ${data.length}`);
  }
  
  // Payload
  const payload = data.slice(offset, offset + length);
  offset += length;
  
  // CRC32 (4 bytes)
  const storedCrc = view.getUint32(offset, false);
  const calculatedCrc = calculateCRC32(data.slice(0, offset));
  
  if (storedCrc !== calculatedCrc) {
    throw new Error(`CRC mismatch: stored ${storedCrc}, calculated ${calculatedCrc}`);
  }
  
  return {
    type,
    frameId,
    previousFrameId,
    payload,
    crc: storedCrc,
  };
}

/**
 * Parse frame header without parsing full frame
 */
export function parseFrameHeader(data: Uint8Array): FrameHeader | null {
  if (data.length < FRAME_HEADER_SIZE) {
    return null;
  }
  
  const view = new DataView(data.buffer);
  
  const magic = data.slice(0, 4);
  if (!arraysEqual(magic, FRAME_MAGIC)) {
    return null;
  }
  
  return {
    magic,
    version: view.getUint8(4),
    type: view.getUint8(5) as FrameType,
    length: view.getUint32(6, false),
    frameId: view.getBigUint64(10, false),
    previousFrameId: view.getBigUint64(18, false),
  };
}

/**
 * Calculate CRC32 checksum
 */
function calculateCRC32(data: Uint8Array): number {
  // CRC32 polynomial (reversed)
  const polynomial = 0xedb88320;
  let crc = 0xffffffff;
  
  // CRC32 table
  const table = getCRC32Table();
  
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ data[i]!) & 0xff];
  }
  
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Get CRC32 lookup table (cached)
 */
const crcTableCache: number[] | null = null;

function getCRC32Table(): number[] {
  // In production, cache this table
  const table: number[] = [];
  const polynomial = 0xedb88320;
  
  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 1) ? (polynomial ^ (crc >>> 1)) : (crc >>> 1);
    }
    table.push(crc >>> 0);
  }
  
  return table;
}

/**
 * Compare two Uint8Arrays
 */
function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Create a single-frame message
 */
export function createSingleFrame(messageId: bigint, payload: Uint8Array): LRPFrame {
  return {
    type: FrameType.SINGLE,
    frameId: messageId,
    previousFrameId: 0n,
    payload,
    crc: 0, // Will be calculated during encoding
  };
}

/**
 * Split a large payload into multiple frames
 */
export function splitIntoFrames(
  payload: Uint8Array,
  maxPayloadSize: number = MAX_FRAME_SIZE - FRAME_HEADER_SIZE - FRAME_CRC_SIZE
): LRPFrame[] {
  const frames: LRPFrame[] = [];
  const frameCount = Math.ceil(payload.length / maxPayloadSize);
  
  if (frameCount === 1) {
    return [createSingleFrame(1n, payload)];
  }
  
  let frameId = BigInt(Date.now() * 1000);
  let previousFrameId = 0n;
  
  for (let i = 0; i < frameCount; i++) {
    const start = i * maxPayloadSize;
    const end = Math.min(start + maxPayloadSize, payload.length);
    const chunk = payload.slice(start, end);
    
    const type = i === 0 ? FrameType.FIRST : i === frameCount - 1 ? FrameType.LAST : FrameType.MIDDLE;
    
    frames.push({
      type,
      frameId: frameId + BigInt(i),
      previousFrameId: i === 0 ? 0n : frameId + BigInt(i - 1),
      payload: chunk,
      crc: 0,
    });
  }
  
  return frames;
}

/**
 * Reassemble frames into a complete payload
 */
export function reassembleFrames(frames: LRPFrame[]): Uint8Array {
  if (frames.length === 0) {
    return new Uint8Array(0);
  }
  
  if (frames.length === 1) {
    return frames[0]!.payload;
  }
  
  // Sort frames by frameId
  const sorted = [...frames].sort((a, b) => (a.frameId < b.frameId ? -1 : 1));
  
  // Concatenate payloads
  const totalLength = sorted.reduce((sum, f) => sum + f.payload.length, 0);
  const result = new Uint8Array(totalLength);
  
  let offset = 0;
  for (const frame of sorted) {
    result.set(frame.payload, offset);
    offset += frame.payload.length;
  }
  
  return result;
}
