/**
 * Cryptographic Constants
 * 
 * All sizes and parameters follow NIST FIPS standards and security best practices.
 */

// CRYSTALS-Kyber-1024 (NIST FIPS 203) - Security Level 5
export const KYBER_1024_PUBLIC_KEY_SIZE = 1568;
export const KYBER_1024_SECRET_KEY_SIZE = 3168;
export const KYBER_1024_CIPHERTEXT_SIZE = 1568;

// CRYSTALS-Dilithium5 (NIST FIPS 204) - Security Level 5
export const DILITHIUM5_PUBLIC_KEY_SIZE = 2592;
export const DILITHIUM5_SECRET_KEY_SIZE = 4864;
export const DILITHIUM5_SIGNATURE_SIZE = 4595;

// NTRU Prime (Backup algorithm)
export const NTRU_PRIME_PUBLIC_KEY_SIZE = 1419;
export const NTRU_PRIME_SECRET_KEY_SIZE = 5747;
export const NTRU_PRIME_CIPHERTEXT_SIZE = 1419;

// X25519 (Classic ECDH)
export const X25519_PUBLIC_KEY_SIZE = 32;
export const X25519_SECRET_KEY_SIZE = 32;

// Ed25519 (Classic signatures)
export const ED25519_PUBLIC_KEY_SIZE = 32;
export const ED25519_SECRET_KEY_SIZE = 64;
export const ED25519_SIGNATURE_SIZE = 64;

// AES-256-GCM
export const AES_256_GCM_KEY_SIZE = 32;
export const AES_256_GCM_NONCE_SIZE = 12;
export const AES_256_GCM_TAG_SIZE = 16;

// ChaCha20-Poly1305
export const CHACHA20_POLY1305_KEY_SIZE = 32;
export const CHACHA20_POLY1305_NONCE_SIZE = 12;
export const CHACHA20_POLY1305_TAG_SIZE = 16;

// Hash functions
export const SHA3_512_HASH_SIZE = 64;
export const SHA3_256_HASH_SIZE = 32;
export const BLAKE3_HASH_SIZE = 32;
export const BLAKE3_MAX_OUTPUT_SIZE = 65535;

// HKDF parameters
export const HKDF_SALT_SIZE = 32;
export const HKDF_INFO_MAX_SIZE = 1024;

// Liberty Reach Protocol
export const LIBERTY_REACH_PROTOCOL_VERSION = '1.0.0';
export const PROTOCOL_VERSION_BYTES = Buffer.from(LIBERTY_REACH_PROTOCOL_VERSION, 'utf-8');

// Double Ratchet parameters
export const RATCHET_MAX_SKIP = 1000;
export const RATCHET_DH_HEADER_SIZE = 32;
export const RATCHET_MESSAGE_KEY_COUNT = 5;

// PreKey bundle sizes
export const PREKEY_INDEX_BITS = 16;
export const PREKEY_COUNT = 100;
export const SIGNED_PREKEY_COUNT = 10;
export const ONE_TIME_PREKEY_COUNT = 100;

// Session parameters
export const SESSION_MAX_MESSAGE_KEYS = 100;
export const SESSION_PRUNE_INTERVAL = 100;

// Security thresholds
export const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000; // 5 minutes
export const KEY_ROTATION_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const PREKEY_REFRESH_THRESHOLD = 10;

// Message format
export const MESSAGE_HEADER_SIZE = 64;
export const MESSAGE_VERSION = 1;
export const MESSAGE_TYPE_PLAIN = 0x01;
export const MESSAGE_TYPE_ENCRYPTED = 0x02;
export const MESSAGE_TYPE_PREKEY = 0x03;

// Sealed Sender
export const SEALED_SENDER_STATIC_KEY_SIZE = 32;
export const SEALED_SENDER_EPHHEMERAL_KEY_SIZE = 32;

// Key Transparency
export const MERKLE_TREE_DEPTH = 32;
export const KEY_TRANSPARENCY_AUDIT_SIZE = 256;

// Error codes
export const ERROR_CODE_SUCCESS = 0x00;
export const ERROR_CODE_INVALID_KEY = 0x01;
export const ERROR_CODE_INVALID_SIGNATURE = 0x02;
export const ERROR_CODE_INVALID_CIPHERTEXT = 0x03;
export const ERROR_CODE_INVALID_NONCE = 0x04;
export const ERROR_CODE_KEY_EXPIRED = 0x05;
export const ERROR_CODE_SESSION_EXPIRED = 0x06;
export const ERROR_CODE_INVALID_PROTOCOL_VERSION = 0x07;
export const ERROR_CODE_DECRYPTION_FAILED = 0x08;
export const ERROR_CODE_ENCRYPTION_FAILED = 0x09;
export const ERROR_CODE_KEY_GENERATION_FAILED = 0x0A;
export const ERROR_CODE_DERIVATION_FAILED = 0x0B;
export const ERROR_CODE_STORAGE_ERROR = 0x0C;
export const ERROR_CODE_INVALID_ARGUMENT = 0x0D;
export const ERROR_CODE_BUFFER_TOO_SMALL = 0x0E;
export const ERROR_CODE_INTERNAL_ERROR = 0xFF;
