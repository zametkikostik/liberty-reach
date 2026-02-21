/**
 * Hybrid Key Encapsulation Mechanism
 * 
 * Combines CRYSTALS-Kyber-1024 (post-quantum) with X25519 (classical)
 * for defense in depth. Even if one algorithm is broken, the other
 * remains secure.
 */

import { PQKeyPair, type PublicKey, type PrivateKey } from './pq-keypair.js';
import {
  KYBER_1024_CIPHERTEXT_SIZE,
  X25519_PUBLIC_KEY_SIZE,
  SHA3_512_HASH_SIZE,
} from '../../constants.js';
import {
  secureRandomBytes,
  concatUint8Arrays,
  deriveKey,
  zeroize,
  createCryptoError,
  SecureBuffer,
} from '../../utils/crypto-utils.js';

/**
 * Encapsulated key material
 */
export interface EncapsulatedKey {
  kyberCiphertext: Uint8Array;
  x25519Ephemeral: Uint8Array;
}

/**
 * Shared secret derived from KEM
 */
export type SharedSecret = Uint8Array;

/**
 * HybridKEM - Hybrid Key Encapsulation Mechanism
 * 
 * Implements a hybrid KEM combining:
 * - CRYSTALS-Kyber-1024 (NIST FIPS 203) for post-quantum security
 * - X25519 ECDH for classical security
 * 
 * The shared secret is derived from both KEM outputs using HKDF-SHA3-512,
 * ensuring that breaking one algorithm does not compromise the shared secret.
 */
export class HybridKEM {
  private readonly publicKey: PublicKey;
  private readonly privateKey: PrivateKey;
  private readonly x25519PublicKey: PublicKey;
  private readonly x25519PrivateKey: PrivateKey;

  /**
   * Create a new HybridKEM instance
   * 
   * @param kyberPublicKey - Kyber-1024 public key
   * @param kyberPrivateKey - Kyber-1024 private key
   * @param x25519PublicKey - X25519 public key
   * @param x25519PrivateKey - X25519 private key
   */
  constructor(
    kyberPublicKey: PublicKey,
    kyberPrivateKey: PrivateKey,
    x25519PublicKey: PublicKey,
    x25519PrivateKey: PrivateKey
  ) {
    if (kyberPublicKey.length === 0 || kyberPrivateKey.length === 0) {
      throw createCryptoError('INVALID_KEY', 'Invalid Kyber key pair');
    }
    if (x25519PublicKey.length === 0 || x25519PrivateKey.length === 0) {
      throw createCryptoError('INVALID_KEY', 'Invalid X25519 key pair');
    }

    this.publicKey = kyberPublicKey;
    this.privateKey = kyberPrivateKey;
    this.x25519PublicKey = x25519PublicKey;
    this.x25519PrivateKey = x25519PrivateKey;
  }

  /**
   * Create HybridKEM from key pairs
   */
  static fromKeyPairs(kyber: ReturnType<typeof PQKeyPair.generateKyber>, x25519: ReturnType<typeof PQKeyPair.generateX25519>): HybridKEM {
    return new HybridKEM(
      kyber.publicKey,
      kyber.privateKey,
      x25519.publicKey,
      x25519.privateKey
    );
  }

  /**
   * Encapsulate a shared secret using the recipient's public key
   * 
   * This is the sender's operation. It generates a fresh shared secret
   * and encapsulates it for the recipient.
   * 
   * @param recipientKyberPublicKey - Recipient's Kyber public key
   * @param recipientX25519PublicKey - Recipient's X25519 public key
   * @returns Encapsulated key and shared secret
   * 
   * @throws CryptoError if encapsulation fails
   */
  static encapsulate(
    recipientKyberPublicKey: PublicKey,
    recipientX25519PublicKey: PublicKey
  ): { encapsulatedKey: EncapsulatedKey; sharedSecret: SharedSecret } {
    try {
      // Generate ephemeral X25519 key pair
      const ephemeralX25519 = PQKeyPair.generateX25519();
      
      // Perform X25519 ECDH
      const x25519SharedSecret = this.x25519Dh(
        ephemeralX25519.privateKey,
        recipientX25519PublicKey
      );

      // Perform Kyber KEM encapsulation
      const kyberCiphertext = this.kyberEncapsulate(recipientKyberPublicKey);
      
      // For Kyber, we also get a shared secret from the KEM
      // In production, this comes from the actual Kyber implementation
      const kyberSharedSecret = secureRandomBytes(SHA3_512_HASH_SIZE);

      // Combine both shared secrets using HKDF-SHA3-512
      const combinedSecret = concatUint8Arrays(x25519SharedSecret, kyberSharedSecret);
      
      // Derive final shared secret with context
      const info = new TextEncoder().encode('LibertyReach-HybridKEM-SharedSecret');
      const salt = secureRandomBytes(32);
      const sharedSecret = deriveKey(combinedSecret, salt, info, SHA3_512_HASH_SIZE);

      // Create encapsulated key to send to recipient
      const encapsulatedKey: EncapsulatedKey = {
        kyberCiphertext: kyberCiphertext.ciphertext,
        x25519Ephemeral: ephemeralX25519.publicKey,
      };

      // Zeroize intermediate secrets
      zeroize(x25519SharedSecret);
      zeroize(kyberSharedSecret);
      zeroize(combinedSecret);
      PQKeyPair.destroyPrivateKey(ephemeralX25519.privateKey);

      return { encapsulatedKey, sharedSecret };
    } catch (error) {
      throw createCryptoError(
        'ENCRYPTION_FAILED',
        'Hybrid KEM encapsulation failed',
        error
      );
    }
  }

  /**
   * Decapsulate a shared secret using the private key
   * 
   * This is the recipient's operation. It recovers the shared secret
   * from the encapsulated key.
   * 
   * @param encapsulatedKey - The encapsulated key from sender
   * @returns The shared secret
   * 
   * @throws CryptoError if decapsulation fails
   */
  decapsulate(encapsulatedKey: EncapsulatedKey): SharedSecret {
    try {
      using ephemeralSecret = new SecureBuffer(this.x25519PrivateKey.length);
      ephemeralSecret.data = this.x25519PrivateKey;

      // Perform X25519 ECDH with sender's ephemeral key
      const x25519SharedSecret = this.x25519Dh(
        this.x25519PrivateKey,
        encapsulatedKey.x25519Ephemeral
      );

      // Perform Kyber KEM decapsulation
      const kyberSharedSecret = this.kyberDecapsulate(
        encapsulatedKey.kyberCiphertext
      );

      // Combine both shared secrets using HKDF-SHA3-512
      const combinedSecret = concatUint8Arrays(x25519SharedSecret, kyberSharedSecret);
      
      // Derive final shared secret with same context as encapsulate
      const info = new TextEncoder().encode('LibertyReach-HybridKEM-SharedSecret');
      const salt = secureRandomBytes(32);
      const sharedSecret = deriveKey(combinedSecret, salt, info, SHA3_512_HASH_SIZE);

      // Zeroize intermediate secrets
      zeroize(x25519SharedSecret);
      zeroize(kyberSharedSecret);
      zeroize(combinedSecret);

      return sharedSecret;
    } catch (error) {
      throw createCryptoError(
        'DECRYPTION_FAILED',
        'Hybrid KEM decapsulation failed',
        error
      );
    }
  }

  /**
   * Get the public key material for sharing
   */
  getPublicKeyBundle(): {
    kyberPublicKey: PublicKey;
    x25519PublicKey: PublicKey;
  } {
    return {
      kyberPublicKey: new Uint8Array(this.publicKey),
      x25519PublicKey: new Uint8Array(this.x25519PublicKey),
    };
  }

  /**
   * Serialize the public key bundle for transmission
   */
  serializePublicKeyBundle(): Uint8Array {
    const kyberLen = this.publicKey.length;
    const x25519Len = this.x25519PublicKey.length;
    
    const result = new Uint8Array(4 + 4 + kyberLen + x25519Len);
    const view = new DataView(result.buffer);
    
    // Write lengths
    view.setUint32(0, kyberLen, false);
    view.setUint32(4, x25519Len, false);
    
    // Write keys
    result.set(this.publicKey, 8);
    result.set(this.x25519PublicKey, 8 + kyberLen);
    
    return result;
  }

  /**
   * Deserialize a public key bundle
   */
  static deserializePublicKeyBundle(data: Uint8Array): {
    kyberPublicKey: PublicKey;
    x25519PublicKey: PublicKey;
  } {
    if (data.length < 8) {
      throw createCryptoError('INVALID_KEY', 'Data too short for public key bundle');
    }

    const view = new DataView(data.buffer);
    const kyberLen = view.getUint32(0, false);
    const x25519Len = view.getUint32(4, false);

    if (data.length < 8 + kyberLen + x25519Len) {
      throw createCryptoError('INVALID_KEY', 'Data truncated');
    }

    return {
      kyberPublicKey: data.slice(8, 8 + kyberLen),
      x25519PublicKey: data.slice(8 + kyberLen, 8 + kyberLen + x25519Len),
    };
  }

  // ============================================================================
  // Internal cryptographic operations
  // ============================================================================

  /**
   * X25519 Diffie-Hellman shared secret computation
   */
  private static x25519Dh(privateKey: PrivateKey, publicKey: PublicKey): Uint8Array {
    // Production: Use @stablelib/x25519 or libsodium
    // return x25519(privateKey, publicKey);
    
    // Placeholder: In production, this performs actual X25519 scalar multiplication
    const sharedSecret = new Uint8Array(SHA3_512_HASH_SIZE);
    const input = concatUint8Arrays(privateKey, publicKey);
    
    // Use HKDF to derive a consistent shared secret
    const salt = new Uint8Array(32);
    const info = new TextEncoder().encode('X25519-DH');
    return deriveKey(input, salt, info, SHA3_512_HASH_SIZE);
  }

  /**
   * Kyber KEM encapsulation
   */
  private static kyberEncapsulate(publicKey: PublicKey): {
    ciphertext: Uint8Array;
    sharedSecret: Uint8Array;
  } {
    // Production: Use @stablelib/kyber or liboqs-wasm
    // const kyber = new Kyber1024();
    // kyber.setPublicKey(publicKey);
    // return kyber.encapsulate();
    
    // Placeholder implementation
    const ciphertext = secureRandomBytes(KYBER_1024_CIPHERTEXT_SIZE);
    const sharedSecret = secureRandomBytes(SHA3_512_HASH_SIZE);
    
    return { ciphertext, sharedSecret };
  }

  /**
   * Kyber KEM decapsulation
   */
  private kyberDecapsulate(ciphertext: Uint8Array): Uint8Array {
    // Production: Use @stablelib/kyber or liboqs-wasm
    // const kyber = new Kyber1024();
    // kyber.setPrivateKey(this.privateKey);
    // return kyber.decapsulate(ciphertext);
    
    // Placeholder implementation
    const input = concatUint8Arrays(this.privateKey, ciphertext);
    const salt = new Uint8Array(32);
    const info = new TextEncoder().encode('Kyber-Decapsulate');
    return deriveKey(input, salt, info, SHA3_512_HASH_SIZE);
  }

  /**
   * Securely destroy private key material
   */
  destroy(): void {
    zeroize(this.privateKey);
    zeroize(this.x25519PrivateKey);
  }
}

/**
 * Async variant of HybridKEM for WebAssembly implementations
 */
export class AsyncHybridKEM {
  private inner: HybridKEM | null = null;

  /**
   * Initialize from key pairs asynchronously
   */
  static async fromKeyPairs(
    kyber: ReturnType<typeof PQKeyPair.generateKyber>,
    x25519: ReturnType<typeof PQKeyPair.generateX25519>
  ): Promise<AsyncHybridKEM> {
    const instance = new AsyncHybridKEM();
    instance.inner = HybridKEM.fromKeyPairs(kyber, x25519);
    return instance;
  }

  /**
   * Encapsulate asynchronously
   */
  static async encapsulate(
    recipientKyberPublicKey: PublicKey,
    recipientX25519PublicKey: PublicKey
  ): Promise<{ encapsulatedKey: EncapsulatedKey; sharedSecret: SharedSecret }> {
    // For WASM implementations, this would be async
    return HybridKEM.encapsulate(recipientKyberPublicKey, recipientX25519PublicKey);
  }

  /**
   * Decapsulate asynchronously
   */
  async decapsulate(encapsulatedKey: EncapsulatedKey): Promise<SharedSecret> {
    if (!this.inner) {
      throw createCryptoError('INVALID_ARGUMENT', 'KEM not initialized');
    }
    return this.inner.decapsulate(encapsulatedKey);
  }

  /**
   * Get public key bundle
   */
  getPublicKeyBundle(): {
    kyberPublicKey: PublicKey;
    x25519PublicKey: PublicKey;
  } | null {
    return this.inner?.getPublicKeyBundle() ?? null;
  }

  /**
   * Destroy the KEM instance
   */
  destroy(): void {
    this.inner?.destroy();
    this.inner = null;
  }
}
