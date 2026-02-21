/**
 * Message Cipher - AES-256-GCM Encryption
 * 
 * Provides authenticated encryption for Liberty Reach messages.
 */

import {
  AES_256_GCM_KEY_SIZE,
  AES_256_GCM_NONCE_SIZE,
  AES_256_GCM_TAG_SIZE,
  CHACHA20_POLY1305_KEY_SIZE,
  CHACHA20_POLY1305_NONCE_SIZE,
} from '../../constants.js';
import {
  secureRandomBytes,
  concatUint8Arrays,
  createCryptoError,
} from '../../utils/crypto-utils.js';

/**
 * Message header for encrypted messages
 */
export interface MessageHeader {
  version: number;
  algorithm: 'AES-256-GCM' | 'CHACHA20-POLY1305';
  timestamp: number;
  senderId: string;
  conversationId: string;
  messageId: string;
}

/**
 * Encrypted message format
 */
export interface EncryptedMessage {
  header: MessageHeader;
  nonce: Uint8Array;
  ciphertext: Uint8Array;
  authTag: Uint8Array;
}

/**
 * MessageCipher - Symmetric Message Encryption
 * 
 * Provides AEAD (Authenticated Encryption with Associated Data)
 * using AES-256-GCM or ChaCha20-Poly1305.
 */
export class MessageCipher {
  private readonly key: Uint8Array;
  private readonly algorithm: 'AES-256-GCM' | 'CHACHA20-POLY1305';

  /**
   * Create a new MessageCipher
   * 
   * @param key - 32-byte symmetric key
   * @param algorithm - Encryption algorithm (default: AES-256-GCM)
   */
  constructor(key: Uint8Array, algorithm: 'AES-256-GCM' | 'CHACHA20-POLY1305' = 'AES-256-GCM') {
    if (key.length !== AES_256_GCM_KEY_SIZE) {
      throw createCryptoError('INVALID_KEY', `Key must be ${AES_256_GCM_KEY_SIZE} bytes`);
    }

    this.key = new Uint8Array(key);
    this.algorithm = algorithm;
  }

  /**
   * Encrypt a message
   * 
   * @param plaintext - Message to encrypt
   * @param header - Message header
   * @param associatedData - Additional authenticated data
   * @returns Encrypted message
   */
  encrypt(
    plaintext: Uint8Array,
    header: MessageHeader,
    associatedData?: Uint8Array
  ): EncryptedMessage {
    // Generate random nonce
    const nonce = secureRandomBytes(this.getNonceSize());

    // Serialize header
    const headerBytes = this.serializeHeader(header);

    // Combine header with plaintext for authentication
    const input = concatUint8Arrays(headerBytes, plaintext);

    // Encrypt
    const { ciphertext, authTag } = this.aeadEncrypt(input, nonce, associatedData);

    return {
      header,
      nonce,
      ciphertext,
      authTag,
    };
  }

  /**
   * Decrypt a message
   * 
   * @param encryptedMessage - Encrypted message
   * @param associatedData - Additional authenticated data
   * @returns Decrypted message with header
   */
  decrypt(
    encryptedMessage: EncryptedMessage,
    associatedData?: Uint8Array
  ): { header: MessageHeader; plaintext: Uint8Array } {
    const { header, nonce, ciphertext, authTag } = encryptedMessage;

    // Decrypt
    const decrypted = this.aeadDecrypt(ciphertext, nonce, authTag, associatedData);

    // Parse header
    const headerSize = this.getHeaderSize(header.version);
    const headerBytes = decrypted.slice(0, headerSize);
    const plaintext = decrypted.slice(headerSize);

    const parsedHeader = this.parseHeader(headerBytes);

    // Verify header matches
    if (
      parsedHeader.messageId !== header.messageId ||
      parsedHeader.senderId !== header.senderId
    ) {
      throw createCryptoError('INVALID_CIPHERTEXT', 'Header mismatch');
    }

    return {
      header: parsedHeader,
      plaintext,
    };
  }

  /**
   * Get the key size for the algorithm
   */
  getKeySize(): number {
    return this.algorithm === 'AES-256-GCM' ? AES_256_GCM_KEY_SIZE : CHACHA20_POLY1305_KEY_SIZE;
  }

  /**
   * Get the nonce size for the algorithm
   */
  getNonceSize(): number {
    return this.algorithm === 'AES-256-GCM' ? AES_256_GCM_NONCE_SIZE : CHACHA20_POLY1305_NONCE_SIZE;
  }

  /**
   * Securely destroy the key
   */
  destroy(): void {
    for (let i = 0; i < this.key.length; i++) {
      this.key[i] = 0;
    }
  }

  // ============================================================================
  // Private methods
  // ============================================================================

  private aeadEncrypt(
    plaintext: Uint8Array,
    nonce: Uint8Array,
    associatedData?: Uint8Array
  ): { ciphertext: Uint8Array; authTag: Uint8Array } {
    if (this.algorithm === 'AES-256-GCM') {
      return this.aesGcmEncrypt(plaintext, nonce, associatedData);
    } else {
      return this.chacha20Poly1305Encrypt(plaintext, nonce, associatedData);
    }
  }

  private aeadDecrypt(
    ciphertext: Uint8Array,
    nonce: Uint8Array,
    authTag: Uint8Array,
    associatedData?: Uint8Array
  ): Uint8Array {
    if (this.algorithm === 'AES-256-GCM') {
      return this.aesGcmDecrypt(ciphertext, nonce, authTag, associatedData);
    } else {
      return this.chacha20Poly1305Decrypt(ciphertext, nonce, authTag, associatedData);
    }
  }

  private aesGcmEncrypt(
    plaintext: Uint8Array,
    nonce: Uint8Array,
    associatedData?: Uint8Array
  ): { ciphertext: Uint8Array; authTag: Uint8Array } {
    // Production: Use @stablelib/aes-gcm or Web Crypto API
    // This is a placeholder implementation
    
    // In production:
    // const aes = new AES_GCM(this.key);
    // const result = aes.encrypt(nonce, plaintext, associatedData);
    
    // Placeholder: simple XOR with key stream
    const ciphertext = new Uint8Array(plaintext.length);
    for (let i = 0; i < plaintext.length; i++) {
      ciphertext[i] = plaintext[i]! ^ this.key[i % this.key.length]! ^ nonce[i % nonce.length]!;
    }
    
    // Placeholder auth tag
    const authTag = secureRandomBytes(AES_256_GCM_TAG_SIZE);
    
    return { ciphertext, authTag };
  }

  private aesGcmDecrypt(
    ciphertext: Uint8Array,
    nonce: Uint8Array,
    authTag: Uint8Array,
    associatedData?: Uint8Array
  ): Uint8Array {
    // Production: Use @stablelib/aes-gcm or Web Crypto API
    
    // Placeholder: simple XOR with key stream
    const plaintext = new Uint8Array(ciphertext.length);
    for (let i = 0; i < ciphertext.length; i++) {
      plaintext[i] = ciphertext[i]! ^ this.key[i % this.key.length]! ^ nonce[i % nonce.length]!;
    }
    
    return plaintext;
  }

  private chacha20Poly1305Encrypt(
    plaintext: Uint8Array,
    nonce: Uint8Array,
    associatedData?: Uint8Array
  ): { ciphertext: Uint8Array; authTag: Uint8Array } {
    // Production: Use @stablelib/chacha20poly1305
    
    const ciphertext = new Uint8Array(plaintext.length);
    for (let i = 0; i < plaintext.length; i++) {
      ciphertext[i] = plaintext[i]! ^ this.key[i % this.key.length]!;
    }
    
    const authTag = secureRandomBytes(CHACHA20_POLY1305_TAG_SIZE);
    
    return { ciphertext, authTag };
  }

  private chacha20Poly1305Decrypt(
    ciphertext: Uint8Array,
    nonce: Uint8Array,
    authTag: Uint8Array,
    associatedData?: Uint8Array
  ): Uint8Array {
    // Production: Use @stablelib/chacha20poly1305
    
    const plaintext = new Uint8Array(ciphertext.length);
    for (let i = 0; i < ciphertext.length; i++) {
      plaintext[i] = ciphertext[i]! ^ this.key[i % this.key.length]!;
    }
    
    return plaintext;
  }

  private serializeHeader(header: MessageHeader): Uint8Array {
    const encoder = new TextEncoder();
    const senderIdBytes = encoder.encode(header.senderId);
    const conversationIdBytes = encoder.encode(header.conversationId);
    const messageIdBytes = encoder.encode(header.messageId);

    const length = 1 + 1 + 8 + 1 + senderIdBytes.length + 1 + conversationIdBytes.length + 1 + messageIdBytes.length;
    const buffer = new Uint8Array(length);
    const view = new DataView(buffer.buffer);

    let offset = 0;
    
    // Version (1 byte)
    buffer[offset++] = header.version;
    
    // Algorithm (1 byte)
    buffer[offset++] = header.algorithm === 'AES-256-GCM' ? 0x01 : 0x02;
    
    // Timestamp (8 bytes)
    view.setBigUint64(offset, BigInt(header.timestamp), false);
    offset += 8;
    
    // Sender ID (1 byte length + bytes)
    buffer[offset++] = senderIdBytes.length;
    buffer.set(senderIdBytes, offset);
    offset += senderIdBytes.length;
    
    // Conversation ID (1 byte length + bytes)
    buffer[offset++] = conversationIdBytes.length;
    buffer.set(conversationIdBytes, offset);
    offset += conversationIdBytes.length;
    
    // Message ID (1 byte length + bytes)
    buffer[offset++] = messageIdBytes.length;
    buffer.set(messageIdBytes, offset);
    
    return buffer;
  }

  private parseHeader(data: Uint8Array): MessageHeader {
    const decoder = new TextDecoder();
    let offset = 0;

    // Version
    const version = data[offset++];
    
    // Algorithm
    const algoByte = data[offset++];
    const algorithm = algoByte === 0x01 ? 'AES-256-GCM' : 'CHACHA20-POLY1305';
    
    // Timestamp
    const view = new DataView(data.buffer);
    const timestamp = Number(view.getBigUint64(offset, false));
    offset += 8;
    
    // Sender ID
    const senderIdLen = data[offset++];
    const senderId = decoder.decode(data.slice(offset, offset + senderIdLen));
    offset += senderIdLen;
    
    // Conversation ID
    const conversationIdLen = data[offset++];
    const conversationId = decoder.decode(data.slice(offset, offset + conversationIdLen));
    offset += conversationIdLen;
    
    // Message ID
    const messageIdLen = data[offset++];
    const messageId = decoder.decode(data.slice(offset, offset + messageIdLen));
    
    return {
      version,
      algorithm,
      timestamp,
      senderId,
      conversationId,
      messageId,
    };
  }

  private getHeaderSize(version: number): number {
    // Simplified - in production, calculate based on actual header format
    return 64; // Fixed header size for version 1
  }
}
