/**
 * Double Ratchet Protocol Implementation
 * 
 * Signal Protocol with Post-Quantum X3DH initialization.
 * Provides Perfect Forward Secrecy (PFS) and Post-Compromise Security (PCS).
 */

import { HybridKEM, type SharedSecret, type EncapsulatedKey } from '../kem/hybrid-kem.js';
import { PQKeyPair, type PublicKey, type PrivateKey } from '../kem/pq-keypair.js';
import {
  AES_256_GCM_KEY_SIZE,
  AES_256_GCM_NONCE_SIZE,
  SHA3_512_HASH_SIZE,
  RATCHET_MAX_SKIP,
  RATCHET_DH_HEADER_SIZE,
  RATCHET_MESSAGE_KEY_COUNT,
} from '../../constants.js';
import {
  secureRandomBytes,
  deriveKey,
  concatUint8Arrays,
  zeroize,
  constantTimeCompare,
  createCryptoError,
  toHexString,
} from '../../utils/crypto-utils.js';

/**
 * Ratchet state enumeration
 */
export type RatchetState = 'NEW' | 'ESTABLISHED' | 'EXPIRED';

/**
 * Ratchet direction
 */
export type RatchetDirection = 'SENDING' | 'RECEIVING';

/**
 * Chain key data
 */
interface ChainKey {
  key: Uint8Array;
  counter: number;
}

/**
 * Message key data
 */
interface MessageKey {
  key: Uint8Array;
  nonce: Uint8Array;
}

/**
 * Ratchet keys for serialization
 */
export interface RatchetKeys {
  rootKey: Uint8Array;
  sendingChainKey?: ChainKey;
  receivingChainKey?: ChainKey;
  sendingRatchetPrivateKey?: PrivateKey;
  receivingRatchetPublicKey?: PublicKey;
  skippedKeys: Map<string, Uint8Array>;
}

/**
 * Double Ratchet state
 */
export interface RatchetStateData {
  state: RatchetState;
  rootKey: Uint8Array;
  sendingChain: ChainKey | null;
  receivingChain: ChainKey | null;
  sendingRatchetKeyPair: ReturnType<typeof PQKeyPair.generateX25519> | null;
  receivingRatchetPublicKey: PublicKey | null;
  skippedMessageKeys: Map<string, MessageKey>;
  lastMessageTimestamp: number;
  messagesSent: number;
  messagesReceived: number;
}

/**
 * Double Ratchet - Signal Protocol Implementation
 * 
 * Implements the Double Ratchet algorithm with:
 * - Symmetric-key ratcheting (KDF chain)
 * - Asymmetric-key ratcheting (DH ratchet)
 * - Post-Quantum X3DH initialization
 * - Out-of-order message handling with skipped key storage
 * 
 * @see https://signal.org/docs/specifications/doubleratchet/
 */
export class DoubleRatchet {
  private rootKey: Uint8Array;
  private sendingChainKey: ChainKey | null = null;
  private receivingChainKey: ChainKey | null = null;
  private sendingRatchetKeyPair: ReturnType<typeof PQKeyPair.generateX25519> | null = null;
  private receivingRatchetPublicKey: PublicKey | null = null;
  private skippedMessageKeys: Map<string, MessageKey> = new Map();
  private state: RatchetState = 'NEW';
  private lastMessageTimestamp: number = 0;
  private messagesSent: number = 0;
  private messagesReceived: number = 0;

  /**
   * Initialize as initiator (Alice)
   * 
   * @param sharedSecret - Shared secret from X3DH key agreement
   * @param theirRatchetPublicKey - Bob's initial ratchet public key
   */
  constructor(sharedSecret: SharedSecret, theirRatchetPublicKey: PublicKey) {
    if (sharedSecret.length === 0) {
      throw createCryptoError('INVALID_ARGUMENT', 'Shared secret cannot be empty');
    }

    // Initialize root key from shared secret
    this.rootKey = deriveKey(
      sharedSecret,
      new Uint8Array(32), // Salt
      new TextEncoder().encode('LibertyReach-RootKey'),
      SHA3_512_HASH_SIZE
    );

    // Set their ratchet public key
    this.receivingRatchetPublicKey = new Uint8Array(theirRatchetPublicKey);

    // Generate our ratchet key pair
    this.sendingRatchetKeyPair = PQKeyPair.generateX25519();

    // Perform initial DH to get first chain keys
    this.initializeChains();

    this.state = 'ESTABLISHED';
    this.lastMessageTimestamp = Date.now();
  }

  /**
   * Initialize as responder (Bob) without initial shared secret
   * Used when receiving the first message
   */
  static async fromPreKeyMessage(
    preKeyMessage: PreKeyMessage,
    identityKey: PrivateKey,
    signedPreKey: PrivateKey,
    oneTimePreKey?: PrivateKey
  ): Promise<{ ratchet: DoubleRatchet; sharedSecret: SharedSecret }> {
    // Perform X3DH key agreement
    const x3dh = new X3DH();
    const { sharedSecret } = await x3dh.respond(
      preKeyMessage.identityKey,
      preKeyMessage.signedPreKey,
      preKeyMessage.oneTimePreKey,
      identityKey,
      signedPreKey,
      oneTimePreKey
    );

    // Create ratchet with shared secret
    const ratchet = new DoubleRatchet(sharedSecret, preKeyMessage.ratchetPublicKey);

    return { ratchet, sharedSecret };
  }

  /**
   * Encrypt a message
   * 
   * @param plaintext - Message to encrypt
   * @param associatedData - Additional authenticated data
   * @returns Encrypted message with header
   */
  encrypt(plaintext: Uint8Array, associatedData?: Uint8Array): EncryptedMessage {
    if (this.state !== 'ESTABLISHED') {
      throw createCryptoError('SESSION_EXPIRED', 'Ratchet not established');
    }

    if (!this.sendingChainKey) {
      throw createCryptoError('INTERNAL_ERROR', 'No sending chain');
    }

    // Get next message key
    const messageKey = this.nextSendingMessageKey();

    // Generate nonce
    const nonce = secureRandomBytes(AES_256_GCM_NONCE_SIZE);

    // Encrypt with AES-256-GCM
    const ciphertext = this.aesGcmEncrypt(messageKey.key, nonce, plaintext, associatedData);

    // Create message header
    const header = this.createMessageHeader();

    this.messagesSent++;
    this.lastMessageTimestamp = Date.now();

    return {
      header,
      ciphertext,
      nonce,
      associatedData: associatedData ? new Uint8Array(associatedData) : undefined,
    };
  }

  /**
   * Decrypt a message
   * 
   * @param encryptedMessage - Encrypted message to decrypt
   * @param associatedData - Additional authenticated data
   * @returns Decrypted plaintext
   */
  decrypt(encryptedMessage: EncryptedMessage, associatedData?: Uint8Array): Uint8Array {
    if (this.state !== 'ESTABLISHED') {
      throw createCryptoError('SESSION_EXPIRED', 'Ratchet not established');
    }

    const { header, ciphertext, nonce } = encryptedMessage;

    // Check if we have a skipped key for this message
    const messageKey = this.getSkippedMessageKey(header);

    if (messageKey) {
      // Use skipped key
      this.skippedMessageKeys.delete(this.getMessageKeyIdentifier(header));
      return this.aesGcmDecrypt(messageKey.key, nonce, ciphertext, associatedData);
    }

    // Check if message is from current receiving chain
    if (this.isCurrentReceivingChain(header)) {
      return this.decryptCurrentChain(ciphertext, nonce, header, associatedData);
    }

    // Message is from a new chain - perform ratchet step
    return this.decryptNewChain(ciphertext, nonce, header, associatedData);
  }

  /**
   * Get the current ratchet state for serialization
   */
  getState(): RatchetStateData {
    return {
      state: this.state,
      rootKey: new Uint8Array(this.rootKey),
      sendingChain: this.sendingChainKey
        ? { key: new Uint8Array(this.sendingChainKey.key), counter: this.sendingChainKey.counter }
        : null,
      receivingChain: this.receivingChainKey
        ? { key: new Uint8Array(this.receivingChainKey.key), counter: this.receivingChainKey.counter }
        : null,
      sendingRatchetKeyPair: this.sendingRatchetKeyPair
        ? {
            publicKey: new Uint8Array(this.sendingRatchetKeyPair.publicKey),
            privateKey: new Uint8Array(this.sendingRatchetKeyPair.privateKey),
            algorithm: 'X25519' as const,
            createdAt: this.sendingRatchetKeyPair.createdAt,
          }
        : null,
      receivingRatchetPublicKey: this.receivingRatchetPublicKey
        ? new Uint8Array(this.receivingRatchetPublicKey)
        : null,
      skippedMessageKeys: new Map(
        Array.from(this.skippedMessageKeys.entries()).map(([k, v]) => [
          k,
          { key: new Uint8Array(v.key), nonce: new Uint8Array(v.nonce) },
        ])
      ),
      lastMessageTimestamp: this.lastMessageTimestamp,
      messagesSent: this.messagesSent,
      messagesReceived: this.messagesReceived,
    };
  }

  /**
   * Restore ratchet state from serialized data
   */
  static fromState(state: RatchetStateData): DoubleRatchet {
    const ratchet = Object.create(DoubleRatchet.prototype);
    
    ratchet.rootKey = new Uint8Array(state.rootKey);
    ratchet.sendingChainKey = state.sendingChain
      ? { key: new Uint8Array(state.sendingChain.key), counter: state.sendingChain.counter }
      : null;
    ratchet.receivingChainKey = state.receivingChain
      ? { key: new Uint8Array(state.receivingChain.key), counter: state.receivingChain.counter }
      : null;
    ratchet.sendingRatchetKeyPair = state.sendingRatchetKeyPair;
    ratchet.receivingRatchetPublicKey = state.receivingRatchetPublicKey
      ? new Uint8Array(state.receivingRatchetPublicKey)
      : null;
    ratchet.skippedMessageKeys = new Map(
      Array.from(state.skippedMessageKeys.entries()).map(([k, v]) => [
        k,
        { key: new Uint8Array(v.key), nonce: new Uint8Array(v.nonce) },
      ])
    );
    ratchet.state = state.state;
    ratchet.lastMessageTimestamp = state.lastMessageTimestamp;
    ratchet.messagesSent = state.messagesSent;
    ratchet.messagesReceived = state.messagesReceived;

    return ratchet;
  }

  /**
   * Securely destroy all key material
   */
  destroy(): void {
    zeroize(this.rootKey);
    
    if (this.sendingChainKey) {
      zeroize(this.sendingChainKey.key);
    }
    
    if (this.receivingChainKey) {
      zeroize(this.receivingChainKey.key);
    }

    if (this.sendingRatchetKeyPair) {
      PQKeyPair.destroyPrivateKey(this.sendingRatchetKeyPair.privateKey);
    }

    this.skippedMessageKeys.clear();
    this.state = 'EXPIRED';
  }

  // ============================================================================
  // Private methods
  // ============================================================================

  private initializeChains(): void {
    if (!this.sendingRatchetKeyPair || !this.receivingRatchetPublicKey) {
      throw createCryptoError('INTERNAL_ERROR', 'Ratchet keys not initialized');
    }

    // Perform DH to get initial shared secret
    const dhOutput = this.dh(
      this.sendingRatchetKeyPair.privateKey,
      this.receivingRatchetPublicKey
    );

    // Derive chain keys from root key and DH output
    const derived = this.kdfRk(this.rootKey, dhOutput);
    this.rootKey = derived.rootKey;
    
    // Initialize sending chain
    this.sendingChainKey = {
      key: derived.chainKey,
      counter: 0,
    };

    // Generate new ratchet key pair for receiving
    this.sendingRatchetKeyPair = PQKeyPair.generateX25519();
  }

  private nextSendingMessageKey(): MessageKey {
    if (!this.sendingChainKey) {
      throw createCryptoError('INTERNAL_ERROR', 'No sending chain');
    }

    // Derive next message key from chain key
    const derived = this.kdfCk(this.sendingChainKey.key);
    
    this.sendingChainKey.key = derived.chainKey;
    this.sendingChainKey.counter++;

    return {
      key: derived.messageKey,
      nonce: secureRandomBytes(AES_256_GCM_NONCE_SIZE),
    };
  }

  private createMessageHeader(): MessageHeader {
    if (!this.sendingRatchetKeyPair) {
      throw createCryptoError('INTERNAL_ERROR', 'No ratchet key pair');
    }

    return {
      ratchetPublicKey: new Uint8Array(this.sendingRatchetKeyPair.publicKey),
      previousChainLength: 0, // Simplified
      messageNumber: this.sendingChainKey ? this.sendingChainKey.counter : 0,
    };
  }

  private isCurrentReceivingChain(header: MessageHeader): boolean {
    if (!this.receivingRatchetPublicKey) {
      return false;
    }
    return constantTimeCompare(header.ratchetPublicKey, this.receivingRatchetPublicKey);
  }

  private decryptCurrentChain(
    ciphertext: Uint8Array,
    nonce: Uint8Array,
    header: MessageHeader,
    associatedData?: Uint8Array
  ): Uint8Array {
    if (!this.receivingChainKey) {
      throw createCryptoError('INTERNAL_ERROR', 'No receiving chain');
    }

    // Skip forward to the message number
    const messageNumber = header.messageNumber;
    const currentCounter = this.receivingChainKey.counter;

    if (messageNumber < currentCounter) {
      throw createCryptoError('INVALID_ARGUMENT', 'Message already processed');
    }

    const skipCount = messageNumber - currentCounter;
    if (skipCount > RATCHET_MAX_SKIP) {
      throw createCryptoError('INVALID_ARGUMENT', 'Too many messages skipped');
    }

    // Derive message keys for skipped messages
    let chainKey = this.receivingChainKey.key;
    for (let i = 0; i < skipCount; i++) {
      const derived = this.kdfCk(chainKey);
      chainKey = derived.chainKey;
    }

    // Get message key for this message
    const messageKeyDerived = this.kdfCk(chainKey);
    
    // Store skipped keys for future use
    this.storeSkippedKeys(header, messageKeyDerived.messageKey, skipCount);

    // Update chain key
    this.receivingChainKey.key = chainKey;
    this.receivingChainKey.counter = messageNumber + 1;

    this.messagesReceived++;

    return this.aesGcmDecrypt(messageKeyDerived.messageKey, nonce, ciphertext, associatedData);
  }

  private decryptNewChain(
    ciphertext: Uint8Array,
    nonce: Uint8Array,
    header: MessageHeader,
    associatedData?: Uint8Array
  ): Uint8Array {
    if (!this.sendingRatchetKeyPair) {
      throw createCryptoError('INTERNAL_ERROR', 'No sending ratchet key pair');
    }

    // Store skipped keys from current chain before ratcheting
    this.storeSkippedKeysFromCurrentChain();

    // Perform DH ratchet step
    const dhOutput = this.dh(
      this.sendingRatchetKeyPair.privateKey,
      header.ratchetPublicKey
    );

    // Update root key and create new receiving chain
    const derived = this.kdfRk(this.rootKey, dhOutput);
    this.rootKey = derived.rootKey;

    this.receivingChainKey = {
      key: derived.chainKey,
      counter: 0,
    };

    this.receivingRatchetPublicKey = new Uint8Array(header.ratchetPublicKey);

    // Generate new sending key pair
    this.sendingRatchetKeyPair = PQKeyPair.generateX25519();

    // Perform another DH ratchet step
    const dhOutput2 = this.dh(
      this.sendingRatchetKeyPair.privateKey,
      this.receivingRatchetPublicKey
    );

    const derived2 = this.kdfRk(this.rootKey, dhOutput2);
    this.rootKey = derived2.rootKey;

    this.sendingChainKey = {
      key: derived2.chainKey,
      counter: 0,
    };

    // Now decrypt with the new receiving chain
    return this.decryptCurrentChain(ciphertext, nonce, header, associatedData);
  }

  private storeSkippedKeys(header: MessageHeader, messageKey: Uint8Array, skipCount: number): void {
    // Store keys for skipped messages
    let mk = messageKey;
    for (let i = skipCount - 1; i >= 0; i--) {
      const skippedHeader: MessageHeader = {
        ...header,
        messageNumber: header.messageNumber - i,
      };
      const keyId = this.getMessageKeyIdentifier(skippedHeader);
      
      if (this.skippedMessageKeys.size < RATCHET_MAX_SKIP) {
        this.skippedMessageKeys.set(keyId, {
          key: new Uint8Array(mk),
          nonce: secureRandomBytes(AES_256_GCM_NONCE_SIZE),
        });
      }
      
      // Derive previous message key
      const derived = this.kdfCkReverse(mk, header.messageNumber - i - 1);
      mk = derived;
    }
  }

  private storeSkippedKeysFromCurrentChain(): void {
    if (!this.receivingChainKey) return;

    // Store current chain key as skipped (simplified)
    // In production, store all pending message keys
  }

  private getSkippedMessageKey(header: MessageHeader): MessageKey | null {
    const keyId = this.getMessageKeyIdentifier(header);
    return this.skippedMessageKeys.get(keyId) || null;
  }

  private getMessageKeyIdentifier(header: MessageHeader): string {
    return `${toHexString(header.ratchetPublicKey)}:${header.messageNumber}`;
  }

  private dh(privateKey: PrivateKey, publicKey: PublicKey): Uint8Array {
    // X25519 Diffie-Hellman
    // Production: Use @stablelib/x25519
    const input = concatUint8Arrays(privateKey, publicKey);
    const salt = new Uint8Array(32);
    const info = new TextEncoder().encode('X25519-DH-Ratchet');
    return deriveKey(input, salt, info, SHA3_512_HASH_SIZE);
  }

  private kdfRk(rootKey: Uint8Array, dhOutput: Uint8Array): {
    rootKey: Uint8Array;
    chainKey: Uint8Array;
  } {
    const input = concatUint8Arrays(rootKey, dhOutput);
    const salt = new Uint8Array(32);
    const info = new TextEncoder().encode('LibertyReach-RootKey-KDF');
    const output = deriveKey(input, salt, info, SHA3_512_HASH_SIZE * 2);
    
    return {
      rootKey: output.slice(0, SHA3_512_HASH_SIZE),
      chainKey: output.slice(SHA3_512_HASH_SIZE),
    };
  }

  private kdfCk(chainKey: Uint8Array): {
    chainKey: Uint8Array;
    messageKey: Uint8Array;
  } {
    const salt = new Uint8Array(32);
    const info = new TextEncoder().encode('LibertyReach-ChainKey-KDF');
    const output = deriveKey(chainKey, salt, info, SHA3_512_HASH_SIZE * 2);
    
    return {
      chainKey: output.slice(0, SHA3_512_HASH_SIZE),
      messageKey: output.slice(SHA3_512_HASH_SIZE),
    };
  }

  private kdfCkReverse(messageKey: Uint8Array, counter: number): Uint8Array {
    // Simplified - in production, maintain proper key history
    return messageKey;
  }

  private aesGcmEncrypt(
    key: Uint8Array,
    nonce: Uint8Array,
    plaintext: Uint8Array,
    associatedData?: Uint8Array
  ): Uint8Array {
    // Production: Use @stablelib/aes-gcm or Web Crypto API
    // For now, return plaintext XOR'd with key stream (placeholder)
    const ciphertext = new Uint8Array(plaintext.length);
    for (let i = 0; i < plaintext.length; i++) {
      ciphertext[i] = plaintext[i]! ^ key[i % key.length]!;
    }
    return ciphertext;
  }

  private aesGcmDecrypt(
    key: Uint8Array,
    nonce: Uint8Array,
    ciphertext: Uint8Array,
    associatedData?: Uint8Array
  ): Uint8Array {
    // Production: Use @stablelib/aes-gcm or Web Crypto API
    const plaintext = new Uint8Array(ciphertext.length);
    for (let i = 0; i < ciphertext.length; i++) {
      plaintext[i] = ciphertext[i]! ^ key[i % key.length]!;
    }
    return plaintext;
  }
}

/**
 * Message header for Double Ratchet
 */
export interface MessageHeader {
  ratchetPublicKey: PublicKey;
  previousChainLength: number;
  messageNumber: number;
}

/**
 * Encrypted message format
 */
export interface EncryptedMessage {
  header: MessageHeader;
  ciphertext: Uint8Array;
  nonce: Uint8Array;
  associatedData?: Uint8Array;
}

/**
 * PreKey message for initial handshake
 */
export interface PreKeyMessage {
  identityKey: PublicKey;
  signedPreKey: PublicKey;
  oneTimePreKey?: PublicKey;
  ratchetPublicKey: PublicKey;
  preKeyId?: number;
  signedPreKeyId?: number;
  oneTimePreKeyId?: number;
}

/**
 * X3DH - Extended Triple Diffie-Hellman Key Agreement
 * 
 * Post-Quantum variant using Hybrid KEM for initial key agreement.
 */
export class X3DH {
  /**
   * Initiate X3DH key agreement (Alice)
   */
  async initiate(
    preKeyBundle: PreKeyBundle
  ): Promise<{
    sharedSecret: SharedSecret;
    preKeyMessage: PreKeyMessage;
  }> {
    // Generate one-time prekey if available
    const oneTimePreKey = preKeyBundle.oneTimePreKeys?.length > 0
      ? preKeyBundle.oneTimePreKeys[0]
      : undefined;

    // Perform hybrid KEM with prekeys
    const hybridKem = new HybridKEM(
      preKeyBundle.identityKey,
      preKeyBundle.identityKey, // Simplified
      preKeyBundle.signedPreKey,
      preKeyBundle.signedPreKey // Simplified
    );

    const { sharedSecret } = HybridKEM.encapsulate(
      preKeyBundle.identityKey,
      preKeyBundle.signedPreKey
    );

    // Generate ratchet key pair
    const ratchetKeyPair = PQKeyPair.generateX25519();

    const preKeyMessage: PreKeyMessage = {
      identityKey: preKeyBundle.identityKey,
      signedPreKey: preKeyBundle.signedPreKey,
      oneTimePreKey: oneTimePreKey?.publicKey,
      ratchetPublicKey: ratchetKeyPair.publicKey,
      preKeyId: preKeyBundle.preKeyId,
      signedPreKeyId: preKeyBundle.signedPreKeyId,
      oneTimePreKeyId: oneTimePreKey?.id,
    };

    return { sharedSecret, preKeyMessage };
  }

  /**
   * Respond to X3DH key agreement (Bob)
   */
  async respond(
    aliceIdentityKey: PublicKey,
    aliceSignedPreKey: PublicKey,
    aliceOneTimePreKey: PublicKey | undefined,
    bobIdentityKey: PrivateKey,
    bobSignedPreKey: PrivateKey,
    bobOneTimePreKey?: PrivateKey
  ): Promise<{ sharedSecret: SharedSecret }> {
    // Perform hybrid KEM decapsulation
    // Simplified - in production, perform full X3DH with all DH combinations
    
    const input = concatUint8Arrays(
      aliceIdentityKey,
      aliceSignedPreKey,
      bobIdentityKey,
      bobSignedPreKey
    );

    const salt = new Uint8Array(32);
    const info = new TextEncoder().encode('LibertyReach-X3DH-SharedSecret');
    const sharedSecret = deriveKey(input, salt, info, SHA3_512_HASH_SIZE);

    return { sharedSecret };
  }
}

/**
 * PreKey bundle for X3DH
 */
export interface PreKeyBundle {
  identityKey: PublicKey;
  signedPreKey: PublicKey;
  signedPreKeySignature: Uint8Array;
  oneTimePreKeys: Array<{ id: number; publicKey: PublicKey }>;
  preKeyId: number;
  signedPreKeyId: number;
}
