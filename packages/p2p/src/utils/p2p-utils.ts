/**
 * P2P Utility Functions
 */

import type {
  IceCandidate,
  NetworkMetrics,
  ConnectionQuality,
  P2PError,
} from '../types.js';
import { QUALITY_THRESHOLDS } from '../types.js';

/**
 * Parse an ICE candidate from SDP format
 */
export function parseCandidate(sdp: string): IceCandidate | null {
  // a=foundation component protocol priority ip port type ...
  const parts = sdp.split(' ');
  
  if (parts.length < 8 || parts[0] !== 'a=candidate') {
    return null;
  }

  const candidate: IceCandidate = {
    foundation: parts[1]!,
    component: parseInt(parts[2]!, 10),
    protocol: parts[3]! as 'udp' | 'tcp',
    priority: parseInt(parts[4]!, 10),
    ip: parts[5]!,
    port: parseInt(parts[6]!, 10),
    type: parts[7]!.split(':')[1] as IceCandidateType,
  };

  // Parse additional attributes
  for (let i = 8; i < parts.length; i++) {
    const part = parts[i]!;
    if (part.startsWith('raddr')) {
      candidate.relatedAddress = parts[++i];
    } else if (part.startsWith('rport')) {
      candidate.relatedPort = parseInt(parts[++i]!, 10);
    } else if (part.startsWith('tcptype')) {
      candidate.tcpType = parts[++i]! as 'active' | 'passive' | 'so';
    } else if (part.startsWith('generation')) {
      candidate.generation = parseInt(parts[++i]!, 10);
    }
  }

  return candidate;
}

/**
 * Serialize an ICE candidate to SDP format
 */
export function serializeCandidate(candidate: IceCandidate): string {
  let sdp = `a=candidate ${candidate.foundation} ${candidate.component} ${candidate.protocol} ${candidate.priority} ${candidate.ip} ${candidate.port} typ ${candidate.type}`;

  if (candidate.relatedAddress) {
    sdp += ` raddr ${candidate.relatedAddress}`;
  }
  if (candidate.relatedPort) {
    sdp += ` rport ${candidate.relatedPort}`;
  }
  if (candidate.tcpType) {
    sdp += ` tcptype ${candidate.tcpType}`;
  }
  if (candidate.generation !== undefined) {
    sdp += ` generation ${candidate.generation}`;
  }

  return sdp;
}

/**
 * Parse a STUN message
 */
export function parseStunMessage(data: Uint8Array): {
  messageType: number;
  messageLength: number;
  magicCookie: number;
  transactionId: Uint8Array;
  attributes: Map<number, Uint8Array>;
} {
  const view = new DataView(data.buffer);
  
  const messageType = view.getUint16(0, false);
  const messageLength = view.getUint16(2, false);
  const magicCookie = view.getUint32(4, false);
  const transactionId = data.slice(8, 20);

  const attributes = new Map<number, Uint8Array>();
  
  let offset = 20;
  const endOffset = 20 + messageLength;

  while (offset < endOffset) {
    const attrType = view.getUint16(offset, false);
    const attrLength = view.getUint16(offset + 2, false);
    const attrValue = data.slice(offset + 4, offset + 4 + attrLength);

    attributes.set(attrType, attrValue);

    offset += 4 + attrLength;
    // Pad to 4-byte boundary
    if (attrLength % 4 !== 0) {
      offset += 4 - (attrLength % 4);
    }
  }

  return {
    messageType,
    messageLength,
    magicCookie,
    transactionId,
    attributes,
  };
}

/**
 * Create a STUN message
 */
export function createStunMessage(
  messageType: number,
  transactionId: Uint8Array,
  attributes: Map<number, Uint8Array>
): Uint8Array {
  // Calculate total length
  let attributesLength = 0;
  for (const value of attributes.values()) {
    attributesLength += 4 + value.length;
    if (value.length % 4 !== 0) {
      attributesLength += 4 - (value.length % 4);
    }
  }

  const buffer = new Uint8Array(20 + attributesLength);
  const view = new DataView(buffer.buffer);

  // Header
  view.setUint16(0, messageType, false);
  view.setUint16(2, attributesLength, false);
  view.setUint32(4, 0x2112a442, false); // Magic cookie
  buffer.set(transactionId, 8);

  // Attributes
  let offset = 20;
  for (const [type, value] of attributes.entries()) {
    view.setUint16(offset, type, false);
    view.setUint16(offset + 2, value.length, false);
    buffer.set(value, offset + 4);
    
    offset += 4 + value.length;
    if (value.length % 4 !== 0) {
      offset += 4 - (value.length % 4);
    }
  }

  return buffer;
}

/**
 * Calculate connection quality from metrics
 */
export function calculateConnectionQuality(metrics: NetworkMetrics): ConnectionQuality {
  const { rtt, jitter, packetLossRate } = metrics;

  if (
    rtt <= QUALITY_THRESHOLDS.EXCELLENT.maxRtt &&
    jitter <= QUALITY_THRESHOLDS.EXCELLENT.maxJitter &&
    packetLossRate <= QUALITY_THRESHOLDS.EXCELLENT.maxPacketLoss
  ) {
    return 'EXCELLENT';
  }

  if (
    rtt <= QUALITY_THRESHOLDS.GOOD.maxRtt &&
    jitter <= QUALITY_THRESHOLDS.GOOD.maxJitter &&
    packetLossRate <= QUALITY_THRESHOLDS.GOOD.maxPacketLoss
  ) {
    return 'GOOD';
  }

  if (
    rtt <= QUALITY_THRESHOLDS.FAIR.maxRtt &&
    jitter <= QUALITY_THRESHOLDS.FAIR.maxJitter &&
    packetLossRate <= QUALITY_THRESHOLDS.FAIR.maxPacketLoss
  ) {
    return 'FAIR';
  }

  if (
    rtt <= QUALITY_THRESHOLDS.POOR.maxRtt &&
    jitter <= QUALITY_THRESHOLDS.POOR.maxJitter &&
    packetLossRate <= QUALITY_THRESHOLDS.POOR.maxPacketLoss
  ) {
    return 'POOR';
  }

  return 'FAILED';
}

/**
 * Create a P2P error
 */
export function createP2PError(code: string, message: string, cause?: unknown): P2PError {
  const error = new Error(message) as P2PError;
  error.name = 'P2PError';
  (error as unknown as { code: string }).code = code as never;
  error.cause = cause;
  error.timestamp = new Date();
  return error;
}

/**
 * Type for ICE candidate types
 */
export type IceCandidateType = 'host' | 'srflx' | 'prflx' | 'relay';
