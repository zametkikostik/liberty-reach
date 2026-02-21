/**
 * Liberty Reach Crypto Module
 * 
 * Post-Quantum Cryptography implementation for Liberty Reach Messenger.
 * Implements NIST FIPS 203 (Kyber) and FIPS 204 (Dilithium) standards.
 * 
 * @module @liberty-reach/crypto
 */

// Key Encapsulation Mechanism (KEM)
export { PQKeyPair, type KeyPair, type PublicKey, type PrivateKey } from './kem/pq-keypair.js';
export { HybridKEM, type EncapsulatedKey, type SharedSecret } from './kem/hybrid-kem.js';

// Signal Protocol with Post-Quantum extensions
export { DoubleRatchet, type RatchetState, type RatchetKeys } from './ratchet/double-ratchet.js';
export { X3DH, type PreKeyBundle, type SignedPreKey } from './ratchet/x3dh.js';

// Message Encryption
export { MessageCipher, type EncryptedMessage, type MessageHeader } from './cipher/message-cipher.js';
export { SealedSender, type SealedMessage } from './cipher/sealed-sender.js';

// Key Storage Abstraction
export { KeyStorage, type StorageBackend, type KeyEntry } from './storage/key-storage.js';

// Key Transparency
export { KeyTransparency, type MerkleProof, type LeafData } from './transparency/key-transparency.js';

// Constants and Types
export {
  KYBER_1024_PUBLIC_KEY_SIZE,
  KYBER_1024_SECRET_KEY_SIZE,
  KYBER_1024_CIPHERTEXT_SIZE,
  DILITHIUM5_PUBLIC_KEY_SIZE,
  DILITHIUM5_SECRET_KEY_SIZE,
  DILITHIUM5_SIGNATURE_SIZE,
  X25519_PUBLIC_KEY_SIZE,
  X25519_SECRET_KEY_SIZE,
  AES_256_GCM_KEY_SIZE,
  AES_256_GCM_NONCE_SIZE,
  CHACHA20_POLY1305_KEY_SIZE,
  CHACHA20_POLY1305_NONCE_SIZE,
  SHA3_512_HASH_SIZE,
  BLAKE3_HASH_SIZE,
  LIBERTY_REACH_PROTOCOL_VERSION,
} from './constants.js';

export type {
  CryptoError,
  CryptoErrorCode,
  AlgorithmType,
  SecurityLevel,
} from './types.js';

// Utility functions
export {
  constantTimeCompare,
  secureRandomBytes,
  deriveKey,
  hkdfExpand,
  hkdfExtract,
} from './utils/crypto-utils.js';
