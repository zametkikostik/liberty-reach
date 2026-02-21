/**
 * Type definitions for Liberty Reach Crypto Module
 */

/**
 * Crypto error codes
 */
export type CryptoErrorCode =
  | 'SUCCESS'
  | 'INVALID_KEY'
  | 'INVALID_SIGNATURE'
  | 'INVALID_CIPHERTEXT'
  | 'INVALID_NONCE'
  | 'KEY_EXPIRED'
  | 'SESSION_EXPIRED'
  | 'INVALID_PROTOCOL_VERSION'
  | 'DECRYPTION_FAILED'
  | 'ENCRYPTION_FAILED'
  | 'KEY_GENERATION_FAILED'
  | 'DERIVATION_FAILED'
  | 'STORAGE_ERROR'
  | 'INVALID_ARGUMENT'
  | 'BUFFER_TOO_SMALL'
  | 'INTERNAL_ERROR';

/**
 * Crypto error with detailed information
 */
export interface CryptoError extends Error {
  code: CryptoErrorCode;
  cause?: unknown;
  timestamp: Date;
  context?: Record<string, unknown>;
}

/**
 * Algorithm types supported by Liberty Reach
 */
export type AlgorithmType =
  // Key Encapsulation
  | 'KYBER-1024'
  | 'NTRU-PRIME'
  | 'X25519'
  // Digital Signatures
  | 'DILITHIUM-5'
  | 'ED25519'
  // Symmetric Encryption
  | 'AES-256-GCM'
  | 'CHACHA20-POLY1305'
  // Hash Functions
  | 'SHA3-512'
  | 'SHA3-256'
  | 'BLAKE3'
  // Key Derivation
  | 'HKDF-SHA3-512';

/**
 * Security levels as defined by NIST
 */
export type SecurityLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Key types for different cryptographic operations
 */
export type KeyType =
  | 'IDENTITY'
  | 'SIGNED_PREKEY'
  | 'ONE_TIME_PREKEY'
  | 'SESSION'
  | 'MESSAGE'
  | 'SENDER_CHAIN'
  | 'RECEIVER_CHAIN';

/**
 * Key format for serialization
 */
export type KeyFormat = 'RAW' | 'SPKI' | 'PKCS8' | 'JWK';

/**
 * Cipher mode for symmetric encryption
 */
export type CipherMode = 'ENCRYPT' | 'DECRYPT';

/**
 * Session state for Double Ratchet
 */
export type SessionState =
  | 'INITIALIZING'
  | 'ESTABLISHED'
  | 'EXPIRED'
  | 'COMPROMISED';

/**
 * Message type indicators
 */
export type MessageType =
  | 'PLAIN'
  | 'ENCRYPTED'
  | 'PREKEY_MESSAGE'
  | 'KEY_DISTRIBUTION';

/**
 * Direction of message flow in ratchet
 */
export type RatchetDirection = 'SENDING' | 'RECEIVING';

/**
 * Options for key generation
 */
export interface KeyGenOptions {
  algorithm: AlgorithmType;
  securityLevel?: SecurityLevel;
  seed?: Uint8Array; // For deterministic key generation (testing only)
}

/**
 * Options for encryption
 */
export interface EncryptOptions {
  algorithm: AlgorithmType;
  associatedData?: Uint8Array; // For AEAD
  nonce?: Uint8Array; // Optional, generated if not provided
}

/**
 * Options for decryption
 */
export interface DecryptOptions {
  algorithm: AlgorithmType;
  associatedData?: Uint8Array;
}

/**
 * Callback for async crypto operations
 */
export type CryptoCallback<T> = (result: T) => void;
export type CryptoErrorCallback = (error: CryptoError) => void;

/**
 * Result type for crypto operations
 */
export type CryptoResult<T> = 
  | { success: true; data: T }
  | { success: false; error: CryptoError };

/**
 * Async crypto operation result
 */
export type AsyncCryptoResult<T> = Promise<CryptoResult<T>>;
