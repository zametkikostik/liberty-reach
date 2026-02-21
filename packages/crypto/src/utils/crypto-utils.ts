/**
 * Cryptographic Utility Functions
 * 
 * Low-level crypto primitives and helper functions.
 */

import {
  SHA3_512_HASH_SIZE,
  HKDF_SALT_SIZE,
  X25519_PUBLIC_KEY_SIZE,
} from '../constants.js';
import type { CryptoError } from '../types.js';

/**
 * Creates a CryptoError with standardized format
 */
export function createCryptoError(
  code: string,
  message: string,
  cause?: unknown,
  context?: Record<string, unknown>
): CryptoError {
  const error = new Error(message) as CryptoError;
  error.name = 'CryptoError';
  (error as unknown as { code: string }).code = code as never;
  error.cause = cause;
  error.timestamp = new Date();
  error.context = context;
  return error;
}

/**
 * Generates cryptographically secure random bytes
 */
export function secureRandomBytes(length: number): Uint8Array {
  if (length <= 0) {
    throw createCryptoError('INVALID_ARGUMENT', 'Length must be positive');
  }
  
  const bytes = new Uint8Array(length);
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else if (typeof require !== 'undefined') {
    // Node.js environment
    const cryptoModule = require('crypto');
    cryptoModule.randomFillSync(bytes);
  } else {
    throw createCryptoError('INTERNAL_ERROR', 'No secure RNG available');
  }
  
  return bytes;
}

/**
 * Constant-time comparison of two Uint8Arrays
 * Prevents timing attacks
 */
export function constantTimeCompare(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i]! ^ b[i]!;
  }
  
  return result === 0;
}

/**
 * HKDF-Extract using SHA3-512
 * RFC 5869 compliant
 */
export function hkdfExtract(salt: Uint8Array, ikm: Uint8Array): Uint8Array {
  if (salt.length === 0) {
    salt = new Uint8Array(HKDF_SALT_SIZE);
  }
  
  // HMAC-SHA3-512(salt, ikm)
  return hmacSha3_512(salt, ikm);
}

/**
 * HKDF-Expand using SHA3-512
 * RFC 5869 compliant
 */
export function hkdfExpand(prk: Uint8Array, info: Uint8Array, length: number): Uint8Array {
  if (length > 255 * SHA3_512_HASH_SIZE) {
    throw createCryptoError('BUFFER_TOO_SMALL', 'Output length too large');
  }
  
  const okm = new Uint8Array(length);
  const iterations = Math.ceil(length / SHA3_512_HASH_SIZE);
  
  let t = new Uint8Array(0);
  
  for (let i = 1; i <= iterations; i++) {
    const infoWithCounter = new Uint8Array(info.length + 1);
    infoWithCounter.set(info);
    infoWithCounter[info.length] = i;
    
    const input = new Uint8Array(t.length + infoWithCounter.length);
    input.set(t);
    input.set(infoWithCounter, t.length);
    
    t = hmacSha3_512(prk, input);
    okm.set(t.slice(0, Math.min(SHA3_512_HASH_SIZE, length - (i - 1) * SHA3_512_HASH_SIZE)), (i - 1) * SHA3_512_HASH_SIZE);
  }
  
  return okm;
}

/**
 * HKDF using SHA3-512
 * Combines Extract and Expand
 */
export function deriveKey(
  ikm: Uint8Array,
  salt: Uint8Array,
  info: Uint8Array,
  length: number
): Uint8Array {
  const prk = hkdfExtract(salt, ikm);
  return hkdfExpand(prk, info, length);
}

/**
 * HMAC-SHA3-512 implementation
 */
function hmacSha3_512(key: Uint8Array, message: Uint8Array): Uint8Array {
  // Block size for SHA3-512
  const blockSize = 136; // 1088 bits / 8
  
  // Prepare key
  let preparedKey = key;
  if (key.length > blockSize) {
    preparedKey = sha3_512(key);
  }
  
  if (key.length < blockSize) {
    const paddedKey = new Uint8Array(blockSize);
    paddedKey.set(key);
    preparedKey = paddedKey;
  }
  
  // Inner and outer padding
  const oKeyPad = new Uint8Array(blockSize);
  const iKeyPad = new Uint8Array(blockSize);
  
  for (let i = 0; i < blockSize; i++) {
    oKeyPad[i] = preparedKey[i]! ^ 0x5c;
    iKeyPad[i] = preparedKey[i]! ^ 0x36;
  }
  
  // HMAC = H(o_key_pad || H(i_key_pad || message))
  const innerHash = sha3_512(concatUint8Arrays(iKeyPad, message));
  const result = sha3_512(concatUint8Arrays(oKeyPad, innerHash));
  
  return result;
}

/**
 * SHA3-512 hash function
 * Using stablelib implementation via @stablelib/sha3
 */
function sha3_512(data: Uint8Array): Uint8Array {
  // This is a placeholder - in production, use @stablelib/sha3
  // For now, implement basic SHA3-512 using Web Crypto API if available
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    throw new Error('SHA3 not available in Web Crypto API, use @stablelib/sha3');
  }
  
  // Fallback: use Node.js crypto
  if (typeof require !== 'undefined') {
    const cryptoModule = require('crypto');
    const hash = cryptoModule.createHash('sha3-512');
    hash.update(Buffer.from(data));
    return new Uint8Array(hash.digest());
  }
  
  throw createCryptoError('INTERNAL_ERROR', 'SHA3-512 implementation not available');
}

/**
 * Concatenates multiple Uint8Arrays
 */
export function concatUint8Arrays(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  
  return result;
}

/**
 * Converts Uint8Array to hex string
 */
export function toHexString(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Converts hex string to Uint8Array
 */
export function fromHexString(hex: string): Uint8Array {
  const cleaned = hex.replace(/^0x/, '').toLowerCase();
  
  if (cleaned.length % 2 !== 0) {
    throw createCryptoError('INVALID_ARGUMENT', 'Hex string must have even length');
  }
  
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes[i / 2] = parseInt(cleaned.substring(i, i + 2), 16);
  }
  
  return bytes;
}

/**
 * Zeroizes a Uint8Array (secure memory clearing)
 */
export function zeroize(array: Uint8Array): void {
  for (let i = 0; i < array.length; i++) {
    array[i] = 0;
  }
}

/**
 * Validates a public key format
 */
export function validatePublicKey(key: Uint8Array, expectedSize: number): boolean {
  if (key.length !== expectedSize) {
    return false;
  }
  
  // Check for all-zero key (invalid)
  for (let i = 0; i < key.length; i++) {
    if (key[i] !== 0) {
      return true;
    }
  }
  
  return false;
}

/**
 * Safe buffer for sensitive data
 * Automatically zeroizes on dispose
 */
export class SecureBuffer implements Disposable {
  private _data: Uint8Array;
  private _disposed = false;
  
  constructor(length: number) {
    this._data = new Uint8Array(length);
  }
  
  get data(): Uint8Array {
    if (this._disposed) {
      throw createCryptoError('INVALID_ARGUMENT', 'Buffer has been disposed');
    }
    return this._data;
  }
  
  set data(value: Uint8Array) {
    if (this._disposed) {
      throw createCryptoError('INVALID_ARGUMENT', 'Buffer has been disposed');
    }
    if (value.length !== this._data.length) {
      throw createCryptoError('INVALID_ARGUMENT', 'Length mismatch');
    }
    this._data.set(value);
  }
  
  [Symbol.dispose](): void {
    if (!this._disposed) {
      zeroize(this._data);
      this._disposed = true;
    }
  }
  
  dispose(): void {
    this[Symbol.dispose]();
  }
}
