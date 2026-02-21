/**
 * STUN Client - Session Traversal Utilities for NAT
 * 
 * Implements STUN (RFC 5389) for discovering public IP and NAT type.
 */

import type { StunServer, StunBinding, P2PError } from '../types.js';
import { createP2PError } from '../utils/p2p-utils.js';

/**
 * STUN message types
 */
const STUN_BINDING_REQUEST = 0x0001;
const STUN_BINDING_RESPONSE = 0x0101;
const STUN_BINDING_ERROR_RESPONSE = 0x0111;

/**
 * STUN attribute types
 */
const ATTR_MAPPED_ADDRESS = 0x0001;
const ATTR_XOR_MAPPED_ADDRESS = 0x0020;
const ATTR_USERNAME = 0x0006;
const ATTR_MESSAGE_INTEGRITY = 0x0008;
const ATTR_FINGERPRINT = 0x8028;

/**
 * STUN magic cookie
 */
const STUN_MAGIC_COOKIE = 0x2112a442;

/**
 * StunClient - STUN protocol implementation
 * 
 * Used for:
 * - Discovering public IP address
 * - Detecting NAT type
 * - Connectivity checks for ICE
 */
export class StunClient {
  private readonly server: StunServer;
  private readonly transactionId: Uint8Array;

  /**
   * Create a new STUN client
   * 
   * @param server - STUN server configuration
   */
  constructor(server: StunServer) {
    this.server = server;
    this.transactionId = this.generateTransactionId();
  }

  /**
   * Send a STUN binding request
   * 
   * @param timeout - Request timeout in milliseconds
   * @returns Binding response with mapped address
   */
  async sendBindingRequest(timeout = 5000): Promise<StunBinding> {
    const request = this.createBindingRequest();
    
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(createP2PError('TIMEOUT', 'STUN binding request timeout'));
      }, timeout);

      // In production, send UDP packet to STUN server
      // For now, simulate response
      this.simulateStunResponse()
        .then((response) => {
          clearTimeout(timer);
          resolve(response);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Test connectivity to STUN server
   * 
   * @returns True if server is reachable
   */
  async testConnectivity(): Promise<boolean> {
    try {
      await this.sendBindingRequest(3000);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the STUN server address
   */
  getServerAddress(): string {
    return `${this.server.host}:${this.server.port}`;
  }

  // ============================================================================
  // Private methods
  // ============================================================================

  private createBindingRequest(): Uint8Array {
    // STUN message format:
    //  0                   1                   2                   3
    //  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
    // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    // |0 0|     STUN Message Type     |         Message Length        |
    // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    // |                         Magic Cookie                          |
    // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    // |                                                               |
    // |                     Transaction ID (96 bits)                  |
    // |                                                               |
    // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+

    const messageLength = 0; // No attributes for simple binding request
    const buffer = new Uint8Array(20 + messageLength);
    const view = new DataView(buffer.buffer);

    // Message type (Binding Request)
    view.setUint16(0, STUN_BINDING_REQUEST, false);
    
    // Message length
    view.setUint16(2, messageLength, false);
    
    // Magic cookie
    view.setUint32(4, STUN_MAGIC_COOKIE, false);
    
    // Transaction ID
    buffer.set(this.transactionId, 8);

    return buffer;
  }

  private parseStunResponse(data: Uint8Array): StunBinding {
    const view = new DataView(data.buffer);
    
    const messageType = view.getUint16(0, false);
    const messageLength = view.getUint16(2, false);
    const magicCookie = view.getUint32(4, false);
    
    if (magicCookie !== STUN_MAGIC_COOKIE) {
      throw createP2PError('PROTOCOL_ERROR', 'Invalid STUN magic cookie');
    }

    if (messageType === STUN_BINDING_ERROR_RESPONSE) {
      const errorCode = view.getUint32(24, false);
      throw createP2PError('STUN_FAILED', `STUN error: ${errorCode}`);
    }

    if (messageType !== STUN_BINDING_RESPONSE) {
      throw createP2PError('PROTOCOL_ERROR', 'Unexpected STUN message type');
    }

    // Parse attributes
    let offset = 20;
    const endOffset = 20 + messageLength;
    
    let mappedAddress: { ip: string; port: number } | null = null;

    while (offset < endOffset) {
      const attrType = view.getUint16(offset, false);
      const attrLength = view.getUint16(offset + 2, false);
      const attrValue = data.slice(offset + 4, offset + 4 + attrLength);

      if (attrType === ATTR_XOR_MAPPED_ADDRESS || attrType === ATTR_MAPPED_ADDRESS) {
        mappedAddress = this.parseMappedAddress(attrValue, attrType === ATTR_XOR_MAPPED_ADDRESS);
      }

      offset += 4 + attrLength;
      // Pad to 4-byte boundary
      if (attrLength % 4 !== 0) {
        offset += 4 - (attrLength % 4);
      }
    }

    if (!mappedAddress) {
      throw createP2PError('PROTOCOL_ERROR', 'No mapped address in STUN response');
    }

    return {
      publicIp: mappedAddress.ip,
      publicPort: mappedAddress.port,
      serverAddress: this.getServerAddress(),
      timestamp: Date.now(),
    };
  }

  private parseMappedAddress(data: Uint8Array, isXor: boolean): { ip: string; port: number } {
    const view = new DataView(data.buffer);
    
    // First byte is reserved (must be 0)
    // Second byte is family (0x01 = IPv4, 0x02 = IPv6)
    const family = data[1];
    const port = view.getUint16(2, false);
    
    let decodedPort = port;
    if (isXor) {
      decodedPort = port ^ (STUN_MAGIC_COOKIE >> 16);
    }

    let ip: string;
    if (family === 0x01) {
      // IPv4
      let ipBytes = data.slice(4, 8);
      if (isXor) {
        ipBytes = this.xorBytes(ipBytes, STUN_MAGIC_COOKIE);
      }
      ip = Array.from(ipBytes).join('.');
    } else if (family === 0x02) {
      // IPv6
      let ipBytes = data.slice(4, 20);
      if (isXor) {
        ipBytes = this.xorBytes(ipBytes, STUN_MAGIC_COOKIE);
      }
      const parts: string[] = [];
      for (let i = 0; i < 16; i += 2) {
        parts.push((ipBytes[i]! << 8 | ipBytes[i + 1]!).toString(16));
      }
      ip = parts.join(':');
    } else {
      throw createP2PError('PROTOCOL_ERROR', `Unknown address family: ${family}`);
    }

    return { ip, port: decodedPort };
  }

  private xorBytes(data: Uint8Array, cookie: number): Uint8Array {
    const result = new Uint8Array(data.length);
    const cookieBytes = new Uint8Array(4);
    new DataView(cookieBytes.buffer).setUint32(0, cookie, false);
    
    for (let i = 0; i < data.length; i++) {
      result[i] = data[i]! ^ cookieBytes[i % 4]!;
    }
    
    return result;
  }

  private generateTransactionId(): Uint8Array {
    // 96-bit (12 byte) transaction ID
    const transactionId = new Uint8Array(12);
    crypto.getRandomValues(transactionId);
    return transactionId;
  }

  private async simulateStunResponse(): Promise<StunBinding> {
    // Simulate STUN server response
    // In production, this would actually send/receive UDP packets
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          publicIp: '203.0.113.1', // Placeholder public IP
          publicPort: 50000 + Math.floor(Math.random() * 1000),
          serverAddress: this.getServerAddress(),
          timestamp: Date.now(),
        });
      }, 50 + Math.random() * 100); // Simulate network latency
    });
  }
}

/**
 * Create a P2P error
 */
function createP2PError(code: string, message: string, cause?: unknown): P2PError {
  const error = new Error(message) as P2PError;
  error.name = 'P2PError';
  (error as unknown as { code: string }).code = code as never;
  error.cause = cause;
  error.timestamp = new Date();
  return error;
}
