/**
 * PQKeyPair Tests
 * 
 * Property-based and unit tests for post-quantum key pair generation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { PQKeyPair } from '../kem/pq-keypair.js';
import {
  KYBER_1024_PUBLIC_KEY_SIZE,
  KYBER_1024_SECRET_KEY_SIZE,
  DILITHIUM5_PUBLIC_KEY_SIZE,
  DILITHIUM5_SECRET_KEY_SIZE,
  X25519_PUBLIC_KEY_SIZE,
  X25519_SECRET_KEY_SIZE,
} from '../../constants.js';
import { constantTimeCompare, zeroize } from '../../utils/crypto-utils.js';

describe('PQKeyPair', () => {
  describe('generateKyber', () => {
    it('should generate a valid Kyber-1024 key pair', () => {
      const keyPair = PQKeyPair.generateKyber();

      expect(keyPair.algorithm).toBe('KYBER-1024');
      expect(keyPair.publicKey.length).toBe(KYBER_1024_PUBLIC_KEY_SIZE);
      expect(keyPair.privateKey.length).toBe(KYBER_1024_SECRET_KEY_SIZE);
      expect(keyPair.createdAt).toBeInstanceOf(Date);
    });

    it('should generate different key pairs each time', () => {
      const keyPair1 = PQKeyPair.generateKyber();
      const keyPair2 = PQKeyPair.generateKyber();

      expect(constantTimeCompare(keyPair1.publicKey, keyPair2.publicKey)).toBe(false);
      expect(constantTimeCompare(keyPair1.privateKey, keyPair2.privateKey)).toBe(false);
    });

    it('should generate deterministic key pairs with seed', () => {
      const seed = new Uint8Array(64).fill(42);
      
      const keyPair1 = PQKeyPair.generateKyber(seed);
      const keyPair2 = PQKeyPair.generateKyber(new Uint8Array(seed));

      expect(constantTimeCompare(keyPair1.publicKey, keyPair2.publicKey)).toBe(true);
      expect(constantTimeCompare(keyPair1.privateKey, keyPair2.privateKey)).toBe(true);
    });

    it('property: generated keys should be non-zero', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100 }), () => {
          const keyPair = PQKeyPair.generateKyber();
          
          const publicKeyNonZero = keyPair.publicKey.some(b => b !== 0);
          const privateKeyNonZero = keyPair.privateKey.some(b => b !== 0);
          
          return publicKeyNonZero && privateKeyNonZero;
        })
      );
    });

    it('property: public key should have correct size', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100 }), (n) => {
          for (let i = 0; i < n; i++) {
            const keyPair = PQKeyPair.generateKyber();
            expect(keyPair.publicKey.length).toBe(KYBER_1024_PUBLIC_KEY_SIZE);
          }
          return true;
        })
      );
    });
  });

  describe('generateDilithium', () => {
    it('should generate a valid Dilithium5 key pair', () => {
      const keyPair = PQKeyPair.generateDilithium();

      expect(keyPair.algorithm).toBe('DILITHIUM-5');
      expect(keyPair.publicKey.length).toBe(DILITHIUM5_PUBLIC_KEY_SIZE);
      expect(keyPair.privateKey.length).toBe(DILITHIUM5_SECRET_KEY_SIZE);
    });

    it('should generate different key pairs each time', () => {
      const keyPair1 = PQKeyPair.generateDilithium();
      const keyPair2 = PQKeyPair.generateDilithium();

      expect(constantTimeCompare(keyPair1.publicKey, keyPair2.publicKey)).toBe(false);
    });

    it('property: keys should be non-zero', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 50 }), () => {
          const keyPair = PQKeyPair.generateDilithium();
          return keyPair.publicKey.some(b => b !== 0) && keyPair.privateKey.some(b => b !== 0);
        })
      );
    });
  });

  describe('generateX25519', () => {
    it('should generate a valid X25519 key pair', () => {
      const keyPair = PQKeyPair.generateX25519();

      expect(keyPair.algorithm).toBe('X25519');
      expect(keyPair.publicKey.length).toBe(X25519_PUBLIC_KEY_SIZE);
      expect(keyPair.privateKey.length).toBe(X25519_SECRET_KEY_SIZE);
    });

    it('should generate properly clamped private keys', () => {
      const keyPair = PQKeyPair.generateX25519();
      const privateKey = keyPair.privateKey;

      // X25519 key clamping:
      // - First byte: lowest 3 bits cleared (AND with 248)
      // - Last byte: highest bit cleared, second highest set (AND with 127, OR with 64)
      expect(privateKey[0]! & 7).toBe(0);
      expect(privateKey[31]! & 128).toBe(0);
      expect(privateKey[31]! & 64).toBe(64);
    });

    it('property: should generate valid key pairs', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100 }), () => {
          const keyPair = PQKeyPair.generateX25519();
          return (
            keyPair.publicKey.length === X25519_PUBLIC_KEY_SIZE &&
            keyPair.privateKey.length === X25519_SECRET_KEY_SIZE
          );
        })
      );
    });
  });

  describe('generateHybrid', () => {
    it('should generate both Kyber and X25519 key pairs', () => {
      const hybrid = PQKeyPair.generateHybrid();

      expect(hybrid.kyber.algorithm).toBe('KYBER-1024');
      expect(hybrid.x25519.algorithm).toBe('X25519');
      
      expect(hybrid.kyber.publicKey.length).toBe(KYBER_1024_PUBLIC_KEY_SIZE);
      expect(hybrid.x25519.publicKey.length).toBe(X25519_PUBLIC_KEY_SIZE);
    });

    it('should generate independent key pairs', () => {
      const hybrid1 = PQKeyPair.generateHybrid();
      const hybrid2 = PQKeyPair.generateHybrid();

      expect(constantTimeCompare(hybrid1.kyber.publicKey, hybrid2.kyber.publicKey)).toBe(false);
      expect(constantTimeCompare(hybrid1.x25519.publicKey, hybrid2.x25519.publicKey)).toBe(false);
    });
  });

  describe('serializePublicKey', () => {
    it('should serialize public key with algorithm identifier', () => {
      const keyPair = PQKeyPair.generateKyber();
      const serialized = PQKeyPair.serializePublicKey(keyPair.publicKey, keyPair.algorithm);

      expect(serialized.length).toBe(4 + keyPair.publicKey.length);
      expect(serialized[0]).toBe(0x00);
      expect(serialized[1]).toBe(0x01);
    });

    it('should serialize different algorithms with different identifiers', () => {
      const kyber = PQKeyPair.generateKyber();
      const x25519 = PQKeyPair.generateX25519();

      const kyberSerialized = PQKeyPair.serializePublicKey(kyber.publicKey, kyber.algorithm);
      const x25519Serialized = PQKeyPair.serializePublicKey(x25519.publicKey, x25519.algorithm);

      expect(kyberSerialized[0]).toBe(0x00);
      expect(kyberSerialized[1]).toBe(0x01);
      
      expect(x25519Serialized[0]).toBe(0x00);
      expect(x25519Serialized[1]).toBe(0x03);
    });
  });

  describe('deserializePublicKey', () => {
    it('should deserialize a serialized public key', () => {
      const keyPair = PQKeyPair.generateKyber();
      const serialized = PQKeyPair.serializePublicKey(keyPair.publicKey, keyPair.algorithm);
      
      const { key, algorithm } = PQKeyPair.deserializePublicKey(serialized);

      expect(algorithm).toBe('KYBER-1024');
      expect(constantTimeCompare(key, keyPair.publicKey)).toBe(true);
    });

    it('should throw on invalid data', () => {
      const shortData = new Uint8Array([0x00, 0x01]);
      
      expect(() => PQKeyPair.deserializePublicKey(shortData)).toThrow();
    });
  });

  describe('validatePublicKey', () => {
    it('should validate a correct public key', () => {
      const keyPair = PQKeyPair.generateKyber();
      const isValid = PQKeyPair.validatePublicKey(keyPair.publicKey, keyPair.algorithm);
      expect(isValid).toBe(true);
    });

    it('should reject a key with wrong size', () => {
      const keyPair = PQKeyPair.generateKyber();
      const wrongSizeKey = new Uint8Array(100);
      
      const isValid = PQKeyPair.validatePublicKey(wrongSizeKey, keyPair.algorithm);
      expect(isValid).toBe(false);
    });

    it('should reject an all-zero key', () => {
      const keyPair = PQKeyPair.generateKyber();
      const zeroKey = new Uint8Array(KYBER_1024_PUBLIC_KEY_SIZE);
      
      const isValid = PQKeyPair.validatePublicKey(zeroKey, keyPair.algorithm);
      expect(isValid).toBe(false);
    });
  });

  describe('destroyPrivateKey', () => {
    it('should zeroize the private key', () => {
      const keyPair = PQKeyPair.generateKyber();
      const originalKey = new Uint8Array(keyPair.privateKey);
      
      PQKeyPair.destroyPrivateKey(keyPair.privateKey);
      
      const allZero = keyPair.privateKey.every(b => b === 0);
      expect(allZero).toBe(true);
    });

    it('property: should always zeroize regardless of key content', () => {
      fc.assert(
        fc.property(fc.array(fc.integer({ min: 0, max: 255 }), { minLength: 32, maxLength: 100 }), (keyArray) => {
          const key = new Uint8Array(keyArray);
          PQKeyPair.destroyPrivateKey(key);
          return key.every(b => b === 0);
        })
      );
    });
  });
});

describe('Key Security', () => {
  describe('zeroize', () => {
    it('should zeroize any Uint8Array', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      zeroize(data);
      expect(data.every(b => b === 0)).toBe(true);
    });

    it('property: should zeroize arrays of any size', () => {
      fc.assert(
        fc.property(fc.array(fc.integer({ min: 0, max: 255 }), { minLength: 1, maxLength: 1000 }), (arr) => {
          const data = new Uint8Array(arr);
          zeroize(data);
          return data.every(b => b === 0);
        })
      );
    });
  });

  describe('constantTimeCompare', () => {
    it('should return true for equal arrays', () => {
      const a = new Uint8Array([1, 2, 3, 4, 5]);
      const b = new Uint8Array([1, 2, 3, 4, 5]);
      expect(constantTimeCompare(a, b)).toBe(true);
    });

    it('should return false for different arrays', () => {
      const a = new Uint8Array([1, 2, 3, 4, 5]);
      const b = new Uint8Array([1, 2, 3, 4, 6]);
      expect(constantTimeCompare(a, b)).toBe(false);
    });

    it('should return false for arrays of different lengths', () => {
      const a = new Uint8Array([1, 2, 3, 4, 5]);
      const b = new Uint8Array([1, 2, 3, 4]);
      expect(constantTimeCompare(a, b)).toBe(false);
    });

    it('property: should be reflexive', () => {
      fc.assert(
        fc.property(fc.array(fc.integer({ min: 0, max: 255 }), { minLength: 1, maxLength: 100 }), (arr) => {
          const a = new Uint8Array(arr);
          return constantTimeCompare(a, a);
        })
      );
    });

    it('property: should be symmetric', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 255 }), { minLength: 1, maxLength: 100 }),
          fc.array(fc.integer({ min: 0, max: 255 }), { minLength: 1, maxLength: 100 }),
          (arr1, arr2) => {
            const a = new Uint8Array(arr1);
            const b = new Uint8Array(arr2);
            return constantTimeCompare(a, b) === constantTimeCompare(b, a);
          }
        )
      );
    });
  });
});
