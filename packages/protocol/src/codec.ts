/**
 * LRP Codec - Message Encoding/Decoding
 * 
 * Handles serialization and deserialization of LRP messages.
 */

import type { LRPMessage, LRPHeader, LRPBody, TextBody, MessageFlags } from './message-types.js';
import type { LRPFrame } from './frame-format.js';
import { encodeFrame, decodeFrame, FrameType, createSingleFrame } from './frame-format.js';
import { MessageType, MessagePriority, getMessageCategory, getDefaultPriority } from './message-types.js';

/**
 * Encode options
 */
export interface EncodeOptions {
  compress?: boolean;
  encrypt?: boolean;
  sign?: boolean;
}

/**
 * Decode options
 */
export interface DecodeOptions {
  verifySignature?: boolean;
  decrypt?: boolean;
  decompress?: boolean;
}

/**
 * LRPEncoder - Encodes LRP messages to frames
 */
export class LRPEncoder {
  private messageIdCounter: bigint = BigInt(Date.now() * 1000);

  /**
   * Encode a message to frames
   */
  encode(message: LRPMessage, options: EncodeOptions = {}): LRPFrame[] {
    // Serialize message to binary
    const payload = this.serializeMessage(message, options);

    // Split into frames if necessary
    return this.createFrames(payload);
  }

  /**
   * Generate a unique message ID
   */
  generateMessageId(): string {
    const id = ++this.messageIdCounter;
    return id.toString(36) + Math.random().toString(36).substring(2, 8);
  }

  /**
   * Serialize message to binary
   */
  private serializeMessage(message: LRPMessage, options: EncodeOptions): Uint8Array {
    const encoder = new TextEncoder();
    const parts: Uint8Array[] = [];

    // Serialize header
    const headerBytes = this.serializeHeader(message.header, options);
    parts.push(this.encodeLengthPrefix(headerBytes));

    // Serialize body
    const bodyBytes = this.serializeBody(message.body);
    parts.push(this.encodeLengthPrefix(bodyBytes));

    // Serialize metadata if present
    if (message.metadata) {
      const metadataBytes = this.serializeMetadata(message.metadata);
      parts.push(this.encodeLengthPrefix(metadataBytes));
    } else {
      // Empty metadata marker
      parts.push(new Uint8Array([0, 0, 0, 0]));
    }

    // Concatenate all parts
    const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const part of parts) {
      result.set(part, offset);
      offset += part.length;
    }

    return result;
  }

  /**
   * Serialize message header
   */
  private serializeHeader(header: LRPHeader, options: EncodeOptions): Uint8Array {
    const encoder = new TextEncoder();
    const parts: Uint8Array[] = [];

    // Version (variable length string)
    const versionBytes = encoder.encode(header.version);
    parts.push(new Uint8Array([versionBytes.length]));
    parts.push(versionBytes);

    // Message ID (variable length string)
    const messageIdBytes = encoder.encode(header.messageId);
    parts.push(new Uint8Array([messageIdBytes.length]));
    parts.push(messageIdBytes);

    // Conversation ID (variable length string)
    const conversationIdBytes = encoder.encode(header.conversationId);
    parts.push(new Uint8Array([conversationIdBytes.length]));
    parts.push(conversationIdBytes);

    // Sender ID (variable length string)
    const senderIdBytes = encoder.encode(header.senderId);
    parts.push(new Uint8Array([senderIdBytes.length]));
    parts.push(senderIdBytes);

    // Timestamp (8 bytes, big-endian)
    const timestampBuffer = new Uint8Array(8);
    new DataView(timestampBuffer.buffer).setBigUint64(0, BigInt(header.timestamp), false);
    parts.push(timestampBuffer);

    // Message type (1 byte)
    parts.push(new Uint8Array([header.type]));

    // Priority (1 byte)
    parts.push(new Uint8Array([header.priority]));

    // Flags (1 byte)
    const flagsByte = this.encodeFlags(header.flags, options);
    parts.push(new Uint8Array([flagsByte]));

    // Encryption info (if present)
    if (header.encryptionInfo) {
      const algoBytes = encoder.encode(header.encryptionInfo.algorithm);
      parts.push(new Uint8Array([algoBytes.length]));
      parts.push(algoBytes);
      parts.push(new Uint8Array([header.encryptionInfo.keyVersion]));
      
      if (header.encryptionInfo.signature) {
        parts.push(new Uint8Array([header.encryptionInfo.signature.length]));
        parts.push(header.encryptionInfo.signature);
      } else {
        parts.push(new Uint8Array([0]));
      }
    } else {
      parts.push(new Uint8Array([0])); // No encryption info
    }

    // Concatenate
    const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const part of parts) {
      result.set(part, offset);
      offset += part.length;
    }

    return result;
  }

  /**
   * Encode flags to byte
   */
  private encodeFlags(flags: MessageFlags, options: EncodeOptions): number {
    let byte = 0;
    if (options.encrypt || flags.encrypted) byte |= 0x01;
    if (options.sign || flags.signed) byte |= 0x02;
    if (options.compress || flags.compressed) byte |= 0x04;
    if (flags.requiresReceipt) byte |= 0x08;
    if (flags.isForwarded) byte |= 0x10;
    if (flags.isEdited) byte |= 0x20;
    if (flags.isDeleted) byte |= 0x40;
    return byte;
  }

  /**
   * Serialize message body based on type
   */
  private serializeBody(body: LRPBody): Uint8Array {
    const encoder = new TextEncoder();
    
    // Determine body type and serialize accordingly
    if ('content' in body) {
      // Text body
      const contentBytes = encoder.encode(body.content);
      const result = new Uint8Array(1 + 4 + contentBytes.length);
      result[0] = MessageType.TEXT;
      new DataView(result.buffer).setUint32(1, contentBytes.length, false);
      result.set(contentBytes, 5);
      return result;
    }

    if ('mediaType' in body) {
      // Media body
      return this.serializeMediaBody(body);
    }

    if ('filename' in body) {
      // File body
      return this.serializeFileBody(body);
    }

    if ('callId' in body) {
      // Call body
      return this.serializeCallBody(body);
    }

    // Default: empty body
    return new Uint8Array([0]);
  }

  /**
   * Serialize media body
   */
  private serializeMediaBody(body: LRPBody & { mediaType: string }): Uint8Array {
    const encoder = new TextEncoder();
    const parts: Uint8Array[] = [];

    // Type marker
    parts.push(new Uint8Array([0x10]));

    // Media type
    const mediaTypeBytes = encoder.encode(body.mediaType);
    parts.push(new Uint8Array([mediaTypeBytes.length]));
    parts.push(mediaTypeBytes);

    // MIME type
    const mimeTypeBytes = encoder.encode(body.mimeType || 'application/octet-stream');
    parts.push(new Uint8Array([mimeTypeBytes.length]));
    parts.push(mimeTypeBytes);

    // Size (4 bytes)
    const sizeBuffer = new Uint8Array(4);
    new DataView(sizeBuffer.buffer).setUint32(0, body.size || 0, false);
    parts.push(sizeBuffer);

    // Caption (if present)
    if (body.caption) {
      const captionBytes = encoder.encode(body.caption);
      parts.push(new Uint8Array([captionBytes.length]));
      parts.push(captionBytes);
    } else {
      parts.push(new Uint8Array([0]));
    }

    // Concatenate
    const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
    return new Uint8Array(totalLength);
  }

  /**
   * Serialize file body
   */
  private serializeFileBody(body: LRPBody & { filename: string }): Uint8Array {
    const encoder = new TextEncoder();
    const parts: Uint8Array[] = [];

    // Type marker
    parts.push(new Uint8Array([0x20]));

    // Filename
    const filenameBytes = encoder.encode(body.filename);
    parts.push(new Uint8Array([filenameBytes.length]));
    parts.push(filenameBytes);

    // MIME type
    const mimeTypeBytes = encoder.encode(body.mimeType || 'application/octet-stream');
    parts.push(new Uint8Array([mimeTypeBytes.length]));
    parts.push(mimeTypeBytes);

    // Size (4 bytes)
    const sizeBuffer = new Uint8Array(4);
    new DataView(sizeBuffer.buffer).setUint32(0, body.size || 0, false);
    parts.push(sizeBuffer);

    // Concatenate
    const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
    return new Uint8Array(totalLength);
  }

  /**
   * Serialize call body
   */
  private serializeCallBody(body: LRPBody & { callId: string; callType: string; action: string }): Uint8Array {
    const encoder = new TextEncoder();
    const parts: Uint8Array[] = [];

    // Type marker
    parts.push(new Uint8Array([0x40]));

    // Call ID
    const callIdBytes = encoder.encode(body.callId);
    parts.push(new Uint8Array([callIdBytes.length]));
    parts.push(callIdBytes);

    // Call type
    const callTypeBytes = encoder.encode(body.callType);
    parts.push(new Uint8Array([callTypeBytes.length]));
    parts.push(callTypeBytes);

    // Action
    const actionBytes = encoder.encode(body.action);
    parts.push(new Uint8Array([actionBytes.length]));
    parts.push(actionBytes);

    // Concatenate
    const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
    return new Uint8Array(totalLength);
  }

  /**
   * Serialize metadata
   */
  private serializeMetadata(metadata: Record<string, unknown>): Uint8Array {
    const encoder = new TextEncoder();
    const jsonStr = JSON.stringify(metadata);
    return encoder.encode(jsonStr);
  }

  /**
   * Encode length-prefixed bytes
   */
  private encodeLengthPrefix(data: Uint8Array): Uint8Array {
    const result = new Uint8Array(4 + data.length);
    new DataView(result.buffer).setUint32(0, data.length, false);
    result.set(data, 4);
    return result;
  }

  /**
   * Create frames from payload
   */
  private createFrames(payload: Uint8Array): LRPFrame[] {
    const messageId = BigInt(Date.now() * 1000);
    return [createSingleFrame(messageId, payload)];
  }
}

/**
 * LRPDecoder - Decodes frames to LRP messages
 */
export class LRPDecoder {
  /**
   * Decode frames to a message
   */
  decode(frames: LRPFrame[], options: DecodeOptions = {}): LRPMessage {
    if (frames.length === 0) {
      throw new Error('No frames to decode');
    }

    // Reassemble payload from frames
    const payload = this.reassemblePayload(frames);

    // Parse message from payload
    return this.parseMessage(payload, options);
  }

  /**
   * Reassemble payload from frames
   */
  private reassemblePayload(frames: LRPFrame[]): Uint8Array {
    if (frames.length === 1) {
      return frames[0]!.payload;
    }

    // Sort by frame ID
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

  /**
   * Parse message from binary
   */
  private parseMessage(payload: Uint8Array, options: DecodeOptions): LRPMessage {
    let offset = 0;

    // Parse header length
    const headerLength = new DataView(payload.buffer).getUint32(offset, false);
    offset += 4;

    // Parse header
    const header = this.parseHeader(payload.slice(offset, offset + headerLength));
    offset += headerLength;

    // Parse body length
    const bodyLength = new DataView(payload.buffer).getUint32(offset, false);
    offset += 4;

    // Parse body
    const body = this.parseBody(payload.slice(offset, offset + bodyLength));
    offset += bodyLength;

    // Parse metadata (if present)
    const metadataLength = new DataView(payload.buffer).getUint32(offset, false);
    offset += 4;

    let metadata: Record<string, unknown> | undefined;
    if (metadataLength > 0) {
      metadata = this.parseMetadata(payload.slice(offset, offset + metadataLength));
    }

    return {
      header,
      body,
      metadata,
    };
  }

  /**
   * Parse header from binary
   */
  private parseHeader(data: Uint8Array): LRPHeader {
    const decoder = new TextDecoder();
    let offset = 0;

    // Version
    const versionLen = data[offset++];
    const version = decoder.decode(data.slice(offset, offset + versionLen));
    offset += versionLen;

    // Message ID
    const messageIdLen = data[offset++];
    const messageId = decoder.decode(data.slice(offset, offset + messageIdLen));
    offset += messageIdLen;

    // Conversation ID
    const conversationIdLen = data[offset++];
    const conversationId = decoder.decode(data.slice(offset, offset + conversationIdLen));
    offset += conversationIdLen;

    // Sender ID
    const senderIdLen = data[offset++];
    const senderId = decoder.decode(data.slice(offset, offset + senderIdLen));
    offset += senderIdLen;

    // Timestamp
    const timestamp = Number(new DataView(data.buffer).getBigUint64(offset, false));
    offset += 8;

    // Message type
    const type = data[offset++] as MessageType;

    // Priority
    const priority = data[offset++] as MessagePriority;

    // Flags
    const flagsByte = data[offset++];
    const flags = this.parseFlags(flagsByte);

    // Encryption info
    const encryptionInfoLen = data[offset++];
    let encryptionInfo: { algorithm: string; keyVersion: number; signature?: Uint8Array } | undefined;
    if (encryptionInfoLen > 0) {
      const algoLen = data[offset++];
      const algorithm = decoder.decode(data.slice(offset, offset + algoLen));
      offset += algoLen;
      const keyVersion = data[offset++];
      
      const sigLen = data[offset++];
      const signature = sigLen > 0 ? data.slice(offset, offset + sigLen) : undefined;
      
      encryptionInfo = { algorithm, keyVersion, signature };
    }

    return {
      version,
      messageId,
      conversationId,
      senderId,
      timestamp,
      type,
      priority,
      flags,
      encryptionInfo,
    };
  }

  /**
   * Parse flags from byte
   */
  private parseFlags(byte: number): {
    encrypted: boolean;
    signed: boolean;
    compressed: boolean;
    requiresReceipt: boolean;
    isForwarded: boolean;
    isEdited: boolean;
    isDeleted: boolean;
  } {
    return {
      encrypted: (byte & 0x01) !== 0,
      signed: (byte & 0x02) !== 0,
      compressed: (byte & 0x04) !== 0,
      requiresReceipt: (byte & 0x08) !== 0,
      isForwarded: (byte & 0x10) !== 0,
      isEdited: (byte & 0x20) !== 0,
      isDeleted: (byte & 0x40) !== 0,
    };
  }

  /**
   * Parse body from binary
   */
  private parseBody(data: Uint8Array): LRPBody {
    const decoder = new TextDecoder();
    const typeMarker = data[0];

    if (typeMarker === MessageType.TEXT) {
      const length = new DataView(data.buffer).getUint32(1, false);
      const content = decoder.decode(data.slice(5, 5 + length));
      return { content };
    }

    if (typeMarker === 0x10) {
      return this.parseMediaBody(data);
    }

    if (typeMarker === 0x20) {
      return this.parseFileBody(data);
    }

    if (typeMarker === 0x40) {
      return this.parseCallBody(data);
    }

    // Default empty body
    return { content: '' };
  }

  /**
   * Parse media body
   */
  private parseMediaBody(data: Uint8Array): LRPBody & { mediaType: string } {
    const decoder = new TextDecoder();
    let offset = 1;

    const mediaTypeLen = data[offset++];
    const mediaType = decoder.decode(data.slice(offset, offset + mediaTypeLen));
    offset += mediaTypeLen;

    const mimeTypeLen = data[offset++];
    const mimeType = decoder.decode(data.slice(offset, offset + mimeTypeLen));
    offset += mimeTypeLen;

    const size = new DataView(data.buffer).getUint32(offset, false);
    offset += 4;

    const captionLen = data[offset++];
    const caption = captionLen > 0 ? decoder.decode(data.slice(offset, offset + captionLen)) : undefined;

    return {
      mediaType,
      mimeType,
      size,
      caption,
    };
  }

  /**
   * Parse file body
   */
  private parseFileBody(data: Uint8Array): LRPBody & { filename: string } {
    const decoder = new TextDecoder();
    let offset = 1;

    const filenameLen = data[offset++];
    const filename = decoder.decode(data.slice(offset, offset + filenameLen));
    offset += filenameLen;

    const mimeTypeLen = data[offset++];
    const mimeType = decoder.decode(data.slice(offset, offset + mimeTypeLen));
    offset += mimeTypeLen;

    const size = new DataView(data.buffer).getUint32(offset, false);

    return {
      filename,
      mimeType,
      size,
    };
  }

  /**
   * Parse call body
   */
  private parseCallBody(data: Uint8Array): LRPBody & { callId: string; callType: string; action: string } {
    const decoder = new TextDecoder();
    let offset = 1;

    const callIdLen = data[offset++];
    const callId = decoder.decode(data.slice(offset, offset + callIdLen));
    offset += callIdLen;

    const callTypeLen = data[offset++];
    const callType = decoder.decode(data.slice(offset, offset + callTypeLen));
    offset += callTypeLen;

    const actionLen = data[offset++];
    const action = decoder.decode(data.slice(offset, offset + actionLen));

    return {
      callId,
      callType,
      action,
    };
  }

  /**
   * Parse metadata from binary
   */
  private parseMetadata(data: Uint8Array): Record<string, unknown> {
    const decoder = new TextDecoder();
    const jsonStr = decoder.decode(data);
    return JSON.parse(jsonStr);
  }
}
