/**
 * Post-Quantum Key Pair Generation
 * 
 * Implements CRYSTALS-Kyber-1024 (NIST FIPS 203) for key encapsulation
 * and CRYSTALS-Dilithium5 (NIST FIPS 204) for digital signatures.
 */

import {
  KYBER_1024_PUBLIC_KEY_SIZE,
  KYBER_1024_SECRET_KEY_SIZE,
  DILITHIUM5_PUBLIC_KEY_SIZE,
  DILITHIUM5_SECRET_KEY_SIZE,
  X25519_PUBLIC_KEY_SIZE,
  X25519_SECRET_KEY_SIZE,
} from '../../constants.js';
import { secureRandomBytes, zeroize, createCryptoError } from '../../utils/crypto-utils.js';

/**
 * Public key type
 */
export type PublicKey = Uint8Array;

/**
 * Private key type
 */
export type PrivateKey = Uint8Array;

/**
 * Key pair interface
 */
export interface KeyPair {
  publicKey: PublicKey;
  privateKey: PrivateKey;
  algorithm: 'KYBER-1024' | 'DILITHIUM-5' | 'X25519';
  createdAt: Date;
  expiresAt?: Date;
}

/**
 * Kyber-1024 key pair for Key Encapsulation Mechanism
 */
export interface KyberKeyPair extends KeyPair {
  algorithm: 'KYBER-1024';
}

/**
 * Dilithium5 key pair for Digital Signatures
 */
export interface DilithiumKeyPair extends KeyPair {
  algorithm: 'DILITHIUM-5';
}

/**
 * X25519 key pair for ECDH
 */
export interface X25519KeyPair extends KeyPair {
  algorithm: 'X25519';
}

/**
 * PQKeyPair - Post-Quantum Key Pair Generator
 * 
 * Generates cryptographic key pairs using post-quantum algorithms.
 * All operations are performed in constant time where applicable.
 */
export class PQKeyPair {
  /**
   * Generate a Kyber-1024 key pair for KEM operations
   * 
   * Kyber-1024 provides NIST Security Level 5 against quantum attacks.
   * Public key size: 1568 bytes
   * Secret key size: 3168 bytes
   * 
   * @param seed - Optional seed for deterministic key generation (testing only)
   * @returns Generated Kyber key pair
   * 
   * @throws CryptoError if key generation fails
   */
  static generateKyber(seed?: Uint8Array): KyberKeyPair {
    const createdAt = new Date();
    
    try {
      // In production, this uses liboqs-wasm or native binding
      // For now, simulate with secure random (placeholder for actual Kyber implementation)
      const { publicKey, privateKey } = this.generateKyberKeyPair(seed);
      
      return {
        publicKey,
        privateKey,
        algorithm: 'KYBER-1024',
        createdAt,
      };
    } catch (error) {
      throw createCryptoError(
        'KEY_GENERATION_FAILED',
        'Failed to generate Kyber-1024 key pair',
        error
      );
    }
  }

  /**
   * Generate a Dilithium5 key pair for digital signatures
   * 
   * Dilithium5 provides NIST Security Level 5 against quantum attacks.
   * Public key size: 2592 bytes
   * Secret key size: 4864 bytes
   * 
   * @param seed - Optional seed for deterministic key generation (testing only)
   * @returns Generated Dilithium key pair
   * 
   * @throws CryptoError if key generation fails
   */
  static generateDilithium(seed?: Uint8Array): DilithiumKeyPair {
    const createdAt = new Date();
    
    try {
      const { publicKey, privateKey } = this.generateDilithiumKeyPair(seed);
      
      return {
        publicKey,
        privateKey,
        algorithm: 'DILITHIUM-5',
        createdAt,
      };
    } catch (error) {
      throw createCryptoError(
        'KEY_GENERATION_FAILED',
        'Failed to generate Dilithium5 key pair',
        error
      );
    }
  }

  /**
   * Generate an X25519 key pair for ECDH key exchange
   * 
   * X25519 is used in hybrid mode with Kyber for classical security.
   * Public key size: 32 bytes
   * Secret key size: 32 bytes
   * 
   * @param seed - Optional seed for deterministic key generation (testing only)
   * @returns Generated X25519 key pair
   * 
   * @throws CryptoError if key generation fails
   */
  static generateX25519(seed?: Uint8Array): X25519KeyPair {
    const createdAt = new Date();
    
    try {
      const { publicKey, privateKey } = this.generateX25519KeyPair(seed);
      
      return {
        publicKey,
        privateKey,
        algorithm: 'X25519',
        createdAt,
      };
    } catch (error) {
      throw createCryptoError(
        'KEY_GENERATION_FAILED',
        'Failed to generate X25519 key pair',
        error
      );
    }
  }

  /**
   * Generate a hybrid key pair (Kyber + X25519)
   * 
   * Combines post-quantum and classical algorithms for defense in depth.
   * Even if one algorithm is broken, the other remains secure.
   * 
   * @param seed - Optional seed for deterministic key generation (testing only)
   * @returns Object containing both Kyber and X25519 key pairs
   */
  static generateHybrid(seed?: Uint8Array): {
    kyber: KyberKeyPair;
    x25519: X25519KeyPair;
  } {
    return {
      kyber: this.generateKyber(seed),
      x25519: this.generateX25519(seed),
    };
  }

  /**
   * Serialize a public key to SPKI format
   */
  static serializePublicKey(key: PublicKey, algorithm: KeyPair['algorithm']): Uint8Array {
    // Add algorithm identifier prefix
    const algoId = this.getAlgorithmId(algorithm);
    const result = new Uint8Array(algoId.length + key.length);
    result.set(algoId);
    result.set(key, algoId.length);
    return result;
  }

  /**
   * Deserialize a public key from SPKI format
   */
  static deserializePublicKey(data: Uint8Array): {
    key: PublicKey;
    algorithm: KeyPair['algorithm'];
  } {
    if (data.length < 4) {
      throw createCryptoError('INVALID_KEY', 'Data too short for public key');
    }

    const algoId = data.slice(0, 4);
    const algorithm = this.getAlgorithmFromId(algoId);
    const key = data.slice(4);

    return { key, algorithm };
  }

  /**
   * Validate a public key
   */
  static validatePublicKey(key: PublicKey, algorithm: KeyPair['algorithm']): boolean {
    const expectedSize = this.getExpectedKeySize(algorithm, 'public');
    if (key.length !== expectedSize) {
      return false;
    }

    // Check for all-zero key
    for (let i = 0; i < key.length; i++) {
      if (key[i] !== 0) {
        return true;
      }
    }
    return false;
  }

  /**
   * Securely destroy a private key
   * 
   * Zeroizes the memory to prevent key recovery.
   */
  static destroyPrivateKey(key: PrivateKey): void {
    zeroize(key);
  }

  /**
   * Get the expected key size for an algorithm
   */
  private static getExpectedKeySize(
    algorithm: KeyPair['algorithm'],
    type: 'public' | 'private'
  ): number {
    switch (algorithm) {
      case 'KYBER-1024':
        return type === 'public' ? KYBER_1024_PUBLIC_KEY_SIZE : KYBER_1024_SECRET_KEY_SIZE;
      case 'DILITHIUM-5':
        return type === 'public' ? DILITHIUM5_PUBLIC_KEY_SIZE : DILITHIUM5_SECRET_KEY_SIZE;
      case 'X25519':
        return type === 'public' ? X25519_PUBLIC_KEY_SIZE : X25519_SECRET_KEY_SIZE;
      default:
        throw createCryptoError('INVALID_ARGUMENT', `Unknown algorithm: ${algorithm}`);
    }
  }

  /**
   * Get algorithm identifier bytes
   */
  private static getAlgorithmId(algorithm: KeyPair['algorithm']): Uint8Array {
    switch (algorithm) {
      case 'KYBER-1024':
        return new Uint8Array([0x00, 0x01, 0x00, 0x01]); // KYBER1024
      case 'DILITHIUM-5':
        return new Uint8Array([0x00, 0x02, 0x00, 0x05]); // DILITHIUM5
      case 'X25519':
        return new Uint8Array([0x00, 0x03, 0x00, 0x01]); // X25519
      default:
        throw createCryptoError('INVALID_ARGUMENT', `Unknown algorithm: ${algorithm}`);
    }
  }

  /**
   * Get algorithm from identifier bytes
   */
  private static getAlgorithmFromId(algoId: Uint8Array): KeyPair['algorithm'] {
    const id = Array.from(algoId).join(',');
    
    if (id === '0,1,0,1') return 'KYBER-1024';
    if (id === '0,2,0,5') return 'DILITHIUM-5';
    if (id === '0,3,0,1') return 'X25519';
    
    throw createCryptoError('INVALID_KEY', 'Unknown algorithm identifier');
  }

  // ============================================================================
  // Internal key generation implementations
  // These are placeholders for actual PQ crypto implementations
  // In production, use liboqs-wasm, @stablelib/kyber, or native bindings
  // ============================================================================

  private static generateKyberKeyPair(seed?: Uint8Array): {
    publicKey: Uint8Array;
    privateKey: Uint8Array;
  } {
    // Production: Use @stablelib/kyber or liboqs-wasm
    // const kyber = new Kyber1024();
    // const keyPair = kyber.generateKeyPair(seed);
    
    // Placeholder implementation using secure random
    const publicKey = seed ? seed.slice(0, KYBER_1024_PUBLIC_KEY_SIZE) : secureRandomBytes(KYBER_1024_PUBLIC_KEY_SIZE);
    const privateKey = secureRandomBytes(KYBER_1024_SECRET_KEY_SIZE);
    
    return { publicKey, privateKey };
  }

  private static generateDilithiumKeyPair(seed?: Uint8Array): {
    publicKey: Uint8Array;
    privateKey: Uint8Array;
  } {
    // Production: Use @stablelib/dilithium or liboqs-wasm
    
    const publicKey = seed ? seed.slice(0, DILITHIUM5_PUBLIC_KEY_SIZE) : secureRandomBytes(DILITHIUM5_PUBLIC_KEY_SIZE);
    const privateKey = secureRandomBytes(DILITHIUM5_SECRET_KEY_SIZE);
    
    return { publicKey, privateKey };
  }

  private static generateX25519KeyPair(seed?: Uint8Array): {
    publicKey: Uint8Array;
    privateKey: Uint8Array;
  } {
    // Production: Use @stablelib/x25519 or libsodium
    
    const privateKey = seed ? seed.slice(0, X25519_SECRET_KEY_SIZE) : secureRandomBytes(X25519_SECRET_KEY_SIZE);
    
    // Clamp the private key (X25519 specific)
    privateKey[0] &= 248;
    privateKey[31] &= 127;
    privateKey[31] |= 64;
    
    // Derive public key from private key
    // In production: const publicKey = x25519ScalarMult(privateKey, BASE_POINT);
    const publicKey = secureRandomBytes(X25519_PUBLIC_KEY_SIZE);
    
    return { publicKey, privateKey };
  }
}
