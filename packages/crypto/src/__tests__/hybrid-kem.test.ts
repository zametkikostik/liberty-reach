/**
 * HybridKEM Tests
 * 
 * Tests for hybrid key encapsulation mechanism.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { HybridKEM } from '../kem/hybrid-kem.js';
import { PQKeyPair } from '../kem/pq-keypair.js';
import { constantTimeCompare } from '../../utils/crypto-utils.js';

describe('HybridKEM', () => {
  describe('encapsulate/decapsulate', () => {
    it('should successfully encapsulate and decapsulate a shared secret', () => {
      // Generate recipient key pairs
      const recipientKyber = PQKeyPair.generateKyber();
      const recipientX25519 = PQKeyPair.generateX25519();

      // Encapsulate (sender side)
      const { encapsulatedKey, sharedSecret: senderSecret } = HybridKEM.encapsulate(
        recipientKyber.publicKey,
        recipientX25519.publicKey
      );

      // Decapsulate (recipient side)
      const recipientKem = HybridKEM.fromKeyPairs(recipientKyber, recipientX25519);
      const recipientSecret = recipientKem.decapsulate(encapsulatedKey);

      // Secrets should match
      expect(constantTimeCompare(senderSecret, recipientSecret)).toBe(true);
    });

    it('should generate different shared secrets for different encapsulations', () => {
      const recipientKyber = PQKeyPair.generateKyber();
      const recipientX25519 = PQKeyPair.generateX25519();

      const { sharedSecret: secret1 } = HybridKEM.encapsulate(
        recipientKyber.publicKey,
        recipientX25519.publicKey
      );

      const { sharedSecret: secret2 } = HybridKEM.encapsulate(
        recipientKyber.publicKey,
        recipientX25519.publicKey
      );

      expect(constantTimeCompare(secret1, secret2)).toBe(false);
    });

    it('property: encapsulate/decapsulate should always produce matching secrets', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }),
          (n) => {
            for (let i = 0; i < n; i++) {
              const recipientKyber = PQKeyPair.generateKyber();
              const recipientX25519 = PQKeyPair.generateX25519();

              const { encapsulatedKey, sharedSecret: senderSecret } = HybridKEM.encapsulate(
                recipientKyber.publicKey,
                recipientX25519.publicKey
              );

              const recipientKem = HybridKEM.fromKeyPairs(recipientKyber, recipientX25519);
              const recipientSecret = recipientKem.decapsulate(encapsulatedKey);

              if (!constantTimeCompare(senderSecret, recipientSecret)) {
                return false;
              }
            }
            return true;
          }
        ),
        { numRuns: 5 }
      );
    });
  });

  describe('public key bundle', () => {
    it('should serialize and deserialize public key bundle', () => {
      const kyber = PQKeyPair.generateKyber();
      const x25519 = PQKeyPair.generateX25519();
      const kem = HybridKEM.fromKeyPairs(kyber, x25519);

      const serialized = kem.serializePublicKeyBundle();
      const deserialized = HybridKEM.deserializePublicKeyBundle(serialized);

      expect(constantTimeCompare(deserialized.kyberPublicKey, kyber.publicKey)).toBe(true);
      expect(constantTimeCompare(deserialized.x25519PublicKey, x25519.publicKey)).toBe(true);
    });

    it('should get public key bundle', () => {
      const kyber = PQKeyPair.generateKyber();
      const x25519 = PQKeyPair.generateX25519();
      const kem = HybridKEM.fromKeyPairs(kyber, x25519);

      const bundle = kem.getPublicKeyBundle();

      expect(constantTimeCompare(bundle.kyberPublicKey, kyber.publicKey)).toBe(true);
      expect(constantTimeCompare(bundle.x25519PublicKey, x25519.publicKey)).toBe(true);
    });

    it('should throw on invalid serialized data', () => {
      const shortData = new Uint8Array([0x00, 0x00, 0x00, 0x08]);
      
      expect(() => HybridKEM.deserializePublicKeyBundle(shortData)).toThrow();
    });
  });

  describe('destroy', () => {
    it('should destroy private key material', () => {
      const kyber = PQKeyPair.generateKyber();
      const x25519 = PQKeyPair.generateX25519();
      const kem = HybridKEM.fromKeyPairs(kyber, x25519);

      const originalPrivateKey = new Uint8Array(kyber.privateKey);
      
      kem.destroy();
      
      // Private key should be zeroized
      const allZero = kyber.privateKey.every(b => b === 0);
      expect(allZero).toBe(true);
    });
  });

  describe('security properties', () => {
    it('should produce shared secrets with high entropy', () => {
      const recipientKyber = PQKeyPair.generateKyber();
      const recipientX25519 = PQKeyPair.generateX25519();

      const { sharedSecret } = HybridKEM.encapsulate(
        recipientKyber.publicKey,
        recipientX25519.publicKey
      );

      // Check that secret has non-zero bytes
      const nonZeroCount = sharedSecret.filter(b => b !== 0).length;
      expect(nonZeroCount).toBeGreaterThan(sharedSecret.length * 0.5);
    });

    it('property: shared secrets should be unique', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }),
          (n) => {
            const secrets: Uint8Array[] = [];
            
            for (let i = 0; i < n; i++) {
              const recipientKyber = PQKeyPair.generateKyber();
              const recipientX25519 = PQKeyPair.generateX25519();

              const { sharedSecret } = HybridKEM.encapsulate(
                recipientKyber.publicKey,
                recipientX25519.publicKey
              );
              
              secrets.push(sharedSecret);
            }

            // Check all secrets are unique
            for (let i = 0; i < secrets.length; i++) {
              for (let j = i + 1; j < secrets.length; j++) {
                if (constantTimeCompare(secrets[i]!, secrets[j]!)) {
                  return false;
                }
              }
            }
            return true;
          }
        ),
        { numRuns: 3 }
      );
    });
  });
});

describe('AsyncHybridKEM', () => {
  it('should create from key pairs', async () => {
    const kyber = PQKeyPair.generateKyber();
    const x25519 = PQKeyPair.generateX25519();

    const kem = await AsyncHybridKEM.fromKeyPairs(kyber, x25519);
    
    expect(kem.getPublicKeyBundle()).toBeTruthy();
    
    kem.destroy();
  });

  it('should encapsulate and decapsulate', async () => {
    const recipientKyber = PQKeyPair.generateKyber();
    const recipientX25519 = PQKeyPair.generateX25519();

    const { encapsulatedKey, sharedSecret: senderSecret } = await AsyncHybridKEM.encapsulate(
      recipientKyber.publicKey,
      recipientX25519.publicKey
    );

    const kem = await AsyncHybridKEM.fromKeyPairs(recipientKyber, recipientX25519);
    const recipientSecret = await kem.decapsulate(encapsulatedKey);

    expect(constantTimeCompare(senderSecret, recipientSecret)).toBe(true);
    
    kem.destroy();
  });
});

// Import AsyncHybridKEM for tests
import { AsyncHybridKEM } from '../kem/hybrid-kem.js';
