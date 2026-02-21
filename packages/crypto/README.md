# @liberty-reach/crypto

Post-Quantum Cryptography Module for Liberty Reach Messenger.

## Features

- **CRYSTALS-Kyber-1024** (NIST FIPS 203) - Post-quantum KEM
- **CRYSTALS-Dilithium5** (NIST FIPS 204) - Post-quantum signatures
- **X25519** - Classical ECDH for hybrid mode
- **Double Ratchet** - Signal Protocol with PQ X3DH
- **AES-256-GCM / ChaCha20-Poly1305** - AEAD encryption
- **Sealed Sender** - Anonymous message transmission
- **Key Transparency** - Merkle tree key verification

## Installation

```bash
npm install @liberty-reach/crypto
```

## Usage

### Key Generation

```typescript
import { PQKeyPair, HybridKEM } from '@liberty-reach/crypto';

// Generate Kyber-1024 key pair (post-quantum)
const kyberKeys = PQKeyPair.generateKyber();

// Generate X25519 key pair (classical)
const x25519Keys = PQKeyPair.generateX25519();

// Generate hybrid key pair (both)
const hybrid = PQKeyPair.generateHybrid();
```

### Hybrid KEM

```typescript
import { HybridKEM } from '@liberty-reach/crypto';

// Recipient creates KEM instance
const recipientKem = HybridKEM.fromKeyPairs(kyberKeys, x25519Keys);

// Sender encapsulates shared secret
const { encapsulatedKey, sharedSecret } = HybridKEM.encapsulate(
  recipientKyberPublicKey,
  recipientX25519PublicKey
);

// Recipient decapsulates
const recipientSecret = recipientKem.decapsulate(encapsulatedKey);

// sharedSecret === recipientSecret
```

### Double Ratchet

```typescript
import { DoubleRatchet } from '@liberty-reach/crypto';

// Initialize with shared secret from X3DH
const ratchet = new DoubleRatchet(sharedSecret, theirRatchetPublicKey);

// Encrypt message
const encrypted = ratchet.encrypt(plaintext, associatedData);

// Decrypt message
const decrypted = ratchet.decrypt(encrypted, associatedData);
```

### Sealed Sender

```typescript
import { SealedSender } from '@liberty-reach/crypto';

// Sender seals message
const sender = new SealedSender(senderPrivateKey);
const sealed = sender.seal(plaintext, recipientPublicKey, recipientId);

// Recipient opens message
const { senderPublicKey, plaintext } = SealedSender.open(
  sealed,
  recipientPrivateKey
);
```

### Key Storage

```typescript
import { KeyStorage, MemoryStorage } from '@liberty-reach/crypto';

// Open encrypted storage
const storage = await KeyStorage.open(
  new MemoryStorage(),
  'master-password'
);

// Store key
await storage.storeKey('key-id', keyData, 'IDENTITY');

// Retrieve key
const key = await storage.retrieveKey('key-id');
```

### Key Transparency

```typescript
import { KeyTransparency } from '@liberty-reach/crypto';

// Create transparency tree
const tree = new KeyTransparency();

// Insert key
const proof = tree.insert(userId, publicKey, version);

// Verify proof
const isValid = KeyTransparency.verifyProof(proof, leafData);
```

## API Reference

### PQKeyPair

- `generateKyber(seed?)` - Generate Kyber-1024 key pair
- `generateDilithium(seed?)` - Generate Dilithium5 key pair
- `generateX25519(seed?)` - Generate X25519 key pair
- `generateHybrid(seed?)` - Generate both Kyber + X25519
- `serializePublicKey(key, algorithm)` - Serialize to SPKI format
- `deserializePublicKey(data)` - Deserialize from SPKI
- `validatePublicKey(key, algorithm)` - Validate key format
- `destroyPrivateKey(key)` - Securely zeroize private key

### HybridKEM

- `fromKeyPairs(kyber, x25519)` - Create from key pairs
- `encapsulate(kyberPub, x25519Pub)` - Encapsulate shared secret
- `decapsulate(encapsulatedKey)` - Decapsulate shared secret
- `getPublicKeyBundle()` - Get public keys
- `serializePublicKeyBundle()` - Serialize for transmission
- `destroy()` - Destroy private key material

### DoubleRatchet

- `constructor(sharedSecret, theirRatchetPublicKey)` - Initialize
- `encrypt(plaintext, associatedData?)` - Encrypt message
- `decrypt(encryptedMessage, associatedData?)` - Decrypt message
- `getState()` - Serialize state
- `fromState(state)` - Restore from state
- `destroy()` - Destroy all keys

### SealedSender

- `constructor(senderIdentityKey)` - Create sender
- `seal(plaintext, recipientPublicKey, recipientId)` - Seal message
- `static open(sealedMessage, recipientPrivateKey)` - Open message
- `getSenderPublicKey()` - Get sender's public key
- `destroy()` - Destroy sensitive data

### KeyStorage

- `static open(backend, masterPassword, create?)` - Open storage
- `storeKey(id, keyData, type, tags?)` - Store key
- `retrieveKey(id)` - Retrieve key
- `deleteKey(id)` - Delete key
- `listKeys(type?)` - List keys by type
- `changePassword(oldPassword, newPassword)` - Change password
- `export(exportPassword)` - Export for backup
- `import(exportData, importPassword)` - Import from backup

### KeyTransparency

- `insert(userId, publicKey, version)` - Insert key
- `get(userId)` - Get key data
- `getProof(userId)` - Get Merkle proof
- `static verifyProof(proof, leafData)` - Verify proof
- `getRootHash()` - Get current root hash
- `getState()` - Serialize state

## Security Considerations

1. **Always destroy keys** when done: `key.destroy()` or `PQKeyPair.destroyPrivateKey(key)`
2. **Use hybrid mode** for defense in depth during PQ transition
3. **Verify key transparency proofs** before trusting public keys
4. **Use Sealed Sender** for metadata protection
5. **Rotate keys regularly** - implement key expiration

## Performance

| Operation | Target | Typical |
|-----------|--------|---------|
| Kyber-1024 KeyGen | < 50ms | ~30ms |
| Kyber Encapsulate | < 20ms | ~15ms |
| X25519 DH | < 5ms | ~2ms |
| AES-256-GCM | < 1ms/KB | ~0.5ms/KB |
| Double Ratchet Step | < 10ms | ~5ms |

## Testing

```bash
npm run test          # Run tests
npm run test:coverage # Run with coverage (100% required)
npm run benchmark     # Run performance benchmarks
```

## License

AGPL-3.0-or-later
