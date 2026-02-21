/**
 * Translation Cache
 * 
 * Caches translations to improve performance and reduce API calls.
 */

import type { LanguageCode, TranslationResult } from '../types.js';

interface CacheEntry {
  text: string;
  translated: string;
  targetLanguage: LanguageCode;
  timestamp: number;
  ttl: number;
}

export class TranslationCache {
  private cache: Map<string, CacheEntry> = new Map();
  private ttl: number; // seconds
  private hits: number = 0;
  private misses: number = 0;

  constructor(ttl: number = 3600) {
    this.ttl = ttl;
  }

  /**
   * Get cached translation
   */
  get(text: string, targetLanguage: LanguageCode): TranslationResult | null {
    const key = this.getKey(text, targetLanguage);
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check TTL
    if (Date.now() > entry.timestamp + entry.ttl * 1000) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return {
      original: text,
      translated: entry.translated,
      detectedLanguage: 'auto',
      targetLanguage: targetLanguage,
      confidence: 1,
      translationTime: 0,
      provider: 'cache',
      fromCache: true,
    };
  }

  /**
   * Cache translation
   */
  set(
    text: string,
    targetLanguage: LanguageCode,
    result: TranslationResult
  ): void {
    const key = this.getKey(text, targetLanguage);
    this.cache.set(key, {
      text,
      translated: result.translated,
      targetLanguage,
      timestamp: Date.now(),
      ttl: this.ttl,
    });
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
  } {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  /**
   * Remove expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl * 1000) {
        this.cache.delete(key);
      }
    }
  }

  private getKey(text: string, targetLanguage: LanguageCode): string {
    return `${targetLanguage}:${text.substring(0, 100)}`;
  }
}
