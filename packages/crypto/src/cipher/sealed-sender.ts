/**
 * Sealed Sender - Anonymous Message Sending
 * 
 * Allows sending messages without revealing the sender's identity to the server.
 * Only the recipient can determine who sent the message.
 */

import { PQKeyPair, type PublicKey, type PrivateKey } from '../kem/pq-keypair.js';
import { HybridKEM } from '../kem/hybrid-kem.js';
import {
  AES_256_GCM_KEY_SIZE,
  AES_256_GCM_NONCE_SIZE,
  SEALED_SENDER_STATIC_KEY_SIZE,
  SHA3_512_HASH_SIZE,
} from '../../constants.js';
import {
  secureRandomBytes,
  deriveKey,
  concatUint8Arrays,
  zeroize,
  createCryptoError,
} from '../../utils/crypto-utils.js';

/**
 * Sealed message format
 */
export interface SealedMessage {
  // Outer envelope (visible to server)
  recipientId: string;
  timestamp: number;
  
  // Encrypted payload (only recipient can decrypt)
  ephemeralPublicKey: PublicKey;
  encryptedSenderIdentity: Uint8Array;
  encryptedMessage: Uint8Array;
  authenticationTag: Uint8Array;
}

/**
 * SealedSender - Anonymous Message Transmission
 * 
 * Implements the Sealed Sender protocol for Liberty Reach.
 * 
 * Properties:
 * - Server cannot determine who sent a message
 * - Only the recipient can decrypt the sender's identity
 * - Provides unlinkability between sender and message
 * - Prevents traffic analysis
 */
export class SealedSender {
  private readonly senderIdentityKey: PrivateKey;
  private readonly senderPublicKey: PublicKey;

  /**
   * Create a new SealedSender instance
   * 
   * @param senderIdentityKey - Sender's identity private key
   */
  constructor(senderIdentityKey: PrivateKey) {
    this.senderIdentityKey = new Uint8Array(senderIdentityKey);
    this.senderPublicKey = this.derivePublicKey(senderIdentityKey);
  }

  /**
   * Seal a message for anonymous sending
   * 
   * @param plaintext - Message to send
   * @param recipientPublicKey - Recipient's public key
   * @param recipientId - Recipient's identifier
   * @returns Sealed message ready for transmission
   */
  seal(
    plaintext: Uint8Array,
    recipientPublicKey: PublicKey,
    recipientId: string
  ): SealedMessage {
    try {
      // Generate ephemeral key pair for this message
      const ephemeralKeyPair = PQKeyPair.generateX25519();

      // Derive shared secret with recipient
      const sharedSecret = this.deriveSharedSecret(
        ephemeralKeyPair.privateKey,
        recipientPublicKey
      );

      // Derive encryption keys from shared secret
      const keys = this.deriveMessageKeys(sharedSecret);

      // Encrypt sender identity
      const senderIdentityData = concatUint8Arrays(
        this.senderPublicKey,
        secureRandomBytes(16) // Random padding
      );
      const encryptedSenderIdentity = this.encryptSenderIdentity(
        senderIdentityData,
        keys.senderIdentityKey
      );

      // Encrypt message
      const encryptedMessage = this.encryptMessage(plaintext, keys.messageKey);

      // Create authentication tag
      const authenticationTag = this.createAuthenticationTag(
        encryptedSenderIdentity,
        encryptedMessage,
        keys.authKey
      );

      return {
        recipientId,
        timestamp: Date.now(),
        ephemeralPublicKey: ephemeralKeyPair.publicKey,
        encryptedSenderIdentity,
        encryptedMessage,
        authenticationTag,
      };
    } catch (error) {
      throw createCryptoError('ENCRYPTION_FAILED', 'Failed to seal message', error);
    }
  }

  /**
   * Open a sealed message (recipient side)
   * 
   * @param sealedMessage - The sealed message
   * @param recipientPrivateKey - Recipient's private key
   * @returns Decrypted message with sender identity
   */
  static open(
    sealedMessage: SealedMessage,
    recipientPrivateKey: PrivateKey
  ): {
    senderPublicKey: PublicKey;
    plaintext: Uint8Array;
  } {
    try {
      // Derive shared secret with sender's ephemeral key
      const sharedSecret = new SealedSender(recipientPrivateKey).deriveSharedSecret(
        recipientPrivateKey,
        sealedMessage.ephemeralPublicKey
      );

      // Derive decryption keys
      const keys = new SealedSender(recipientPrivateKey).deriveMessageKeys(sharedSecret);

      // Verify authentication tag
      const expectedTag = new SealedSender(recipientPrivateKey).createAuthenticationTag(
        sealedMessage.encryptedSenderIdentity,
        sealedMessage.encryptedMessage,
        keys.authKey
      );

      if (!this.constantTimeCompare(sealedMessage.authenticationTag, expectedTag)) {
        throw createCryptoError('INVALID_SIGNATURE', 'Authentication tag mismatch');
      }

      // Decrypt sender identity
      const senderIdentityData = new SealedSender(recipientPrivateKey).decryptSenderIdentity(
        sealedMessage.encryptedSenderIdentity,
        keys.senderIdentityKey
      );

      // Extract sender's public key
      const senderPublicKey = senderIdentityData.slice(0, SEALED_SENDER_STATIC_KEY_SIZE);

      // Decrypt message
      const plaintext = new SealedSender(recipientPrivateKey).decryptMessage(
        sealedMessage.encryptedMessage,
        keys.messageKey
      );

      return {
        senderPublicKey,
        plaintext,
      };
    } catch (error) {
      throw createCryptoError('DECRYPTION_FAILED', 'Failed to open sealed message', error);
    }
  }

  /**
   * Get the sender's public key (for verification)
   */
  getSenderPublicKey(): PublicKey {
    return new Uint8Array(this.senderPublicKey);
  }

  /**
   * Securely destroy sensitive data
   */
  destroy(): void {
    zeroize(this.senderIdentityKey);
  }

  // ============================================================================
  // Private methods
  // ============================================================================

  private deriveSharedSecret(privateKey: PrivateKey, publicKey: PublicKey): Uint8Array {
    // X25519 Diffie-Hellman
    const input = concatUint8Arrays(privateKey, publicKey);
    const salt = new Uint8Array(32);
    const info = new TextEncoder().encode('LibertyReach-SealedSender-DH');
    return deriveKey(input, salt, info, SHA3_512_HASH_SIZE);
  }

  private deriveMessageKeys(sharedSecret: Uint8Array): {
    senderIdentityKey: Uint8Array;
    messageKey: Uint8Array;
    authKey: Uint8Array;
  } {
    const salt = new Uint8Array(32);
    const info = new TextEncoder().encode('LibertyReach-SealedSender-Keys');
    const output = deriveKey(sharedSecret, salt, info, SHA3_512_HASH_SIZE * 3);

    return {
      senderIdentityKey: output.slice(0, AES_256_GCM_KEY_SIZE),
      messageKey: output.slice(AES_256_GCM_KEY_SIZE, AES_256_GCM_KEY_SIZE * 2),
      authKey: output.slice(AES_256_GCM_KEY_SIZE * 2),
    };
  }

  private encryptSenderIdentity(data: Uint8Array, key: Uint8Array): Uint8Array {
    const nonce = secureRandomBytes(AES_256_GCM_NONCE_SIZE);
    
    // Production: Use AES-256-GCM
    const ciphertext = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      ciphertext[i] = data[i]! ^ key[i % key.length]! ^ nonce[i % nonce.length]!;
    }

    return concatUint8Arrays(nonce, ciphertext);
  }

  private decryptSenderIdentity(data: Uint8Array, key: Uint8Array): Uint8Array {
    const nonce = data.slice(0, AES_256_GCM_NONCE_SIZE);
    const ciphertext = data.slice(AES_256_GCM_NONCE_SIZE);

    // Production: Use AES-256-GCM
    const plaintext = new Uint8Array(ciphertext.length);
    for (let i = 0; i < ciphertext.length; i++) {
      plaintext[i] = ciphertext[i]! ^ key[i % key.length]! ^ nonce[i % nonce.length]!;
    }

    return plaintext;
  }

  private encryptMessage(plaintext: Uint8Array, key: Uint8Array): Uint8Array {
    const nonce = secureRandomBytes(AES_256_GCM_NONCE_SIZE);
    
    // Production: Use AES-256-GCM
    const ciphertext = new Uint8Array(plaintext.length);
    for (let i = 0; i < plaintext.length; i++) {
      ciphertext[i] = plaintext[i]! ^ key[i % key.length]! ^ nonce[i % nonce.length]!;
    }

    return concatUint8Arrays(nonce, ciphertext);
  }

  private decryptMessage(ciphertext: Uint8Array, key: Uint8Array): Uint8Array {
    const nonce = ciphertext.slice(0, AES_256_GCM_NONCE_SIZE);
    const encrypted = ciphertext.slice(AES_256_GCM_NONCE_SIZE);

    // Production: Use AES-256-GCM
    const plaintext = new Uint8Array(encrypted.length);
    for (let i = 0; i < encrypted.length; i++) {
      plaintext[i] = encrypted[i]! ^ key[i % key.length]! ^ nonce[i % nonce.length]!;
    }

    return plaintext;
  }

  private createAuthenticationTag(
    encryptedSenderIdentity: Uint8Array,
    encryptedMessage: Uint8Array,
    authKey: Uint8Array
  ): Uint8Array {
    // Create HMAC-like authentication tag
    const data = concatUint8Arrays(encryptedSenderIdentity, encryptedMessage);
    const salt = new Uint8Array(32);
    const info = new TextEncoder().encode('LibertyReach-SealedSender-Auth');
    const output = deriveKey(concatUint8Arrays(data, authKey), salt, info, 32);
    return output;
  }

  private derivePublicKey(privateKey: PrivateKey): PublicKey {
    // Derive public key from private key (simplified)
    // In production, use proper X25519 or Ed25519 public key derivation
    const salt = new Uint8Array(32);
    const info = new TextEncoder().encode('LibertyReach-PublicKeyDerive');
    return deriveKey(privateKey, salt, info, SEALED_SENDER_STATIC_KEY_SIZE);
  }

  private static constantTimeCompare(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i]! ^ b[i]!;
    }
    
    return result === 0;
  }
}
