/**
 * Message Translator
 * 
 * Async translation service with support for 50+ languages including Bulgarian.
 * Features:
 * - Auto language detection
 * - Multiple translation providers
 * - Translation caching
 * - Real-time translation
 * - Batch translation
 */

import type { LanguageCode, TranslationOptions, TranslationResult } from '../types.js';
import { TranslationCache } from './translation-cache.js';
import { LanguageDetector } from './language-detector.js';
import { TranslationProvider } from '../providers/translation-provider.js';

/**
 * Translator configuration
 */
export interface TranslatorConfig {
  /** Default target language */
  defaultLanguage: LanguageCode;
  /** Auto-detect source language */
  autoDetect: boolean;
  /** Cache translations */
  enableCache: boolean;
  /** Cache TTL in seconds */
  cacheTTL: number;
  /** Translation provider */
  provider: 'libre' | 'google' | 'deepl' | 'auto';
  /** API keys */
  apiKeys: {
    libre?: string;
    google?: string;
    deepl?: string;
  };
  /** API endpoints */
  endpoints: {
    libre?: string;
  };
  /** Timeout in ms */
  timeout: number;
  /** Max concurrent translations */
  maxConcurrent: number;
}

/**
 * MessageTranslator - Async translation service
 */
export class MessageTranslator {
  private config: TranslatorConfig;
  private cache: TranslationCache;
  private detector: LanguageDetector;
  private provider: TranslationProvider;
  private queue: Array<{
    text: string;
    options: TranslationOptions;
    resolve: (result: TranslationResult) => void;
    reject: (error: Error) => void;
  }> = [];
  private processing = false;

  constructor(config: Partial<TranslatorConfig> = {}) {
    this.config = {
      defaultLanguage: 'en',
      autoDetect: true,
      enableCache: true,
      cacheTTL: 3600, // 1 hour
      provider: 'auto',
      apiKeys: {},
      endpoints: {
        libre: 'https://libretranslate.com',
      },
      timeout: 10000,
      maxConcurrent: 5,
      ...config,
    };

    this.cache = new TranslationCache(this.config.cacheTTL);
    this.detector = new LanguageDetector();
    this.provider = this.createProvider();
  }

  /**
   * Translate text to target language
   */
  async translate(
    text: string,
    options: TranslationOptions
  ): Promise<TranslationResult> {
    const startTime = Date.now();

    // Check cache first
    if (this.config.enableCache && options.cache !== false) {
      const cached = this.cache.get(text, options.to);
      if (cached) {
        return {
          ...cached,
          fromCache: true,
          translationTime: 0,
        };
      }
    }

    // Auto-detect language
    let fromLanguage = options.from || 'auto';
    if (fromLanguage === 'auto' && this.config.autoDetect) {
      fromLanguage = await this.detector.detect(text);
    }

    // Skip translation if same language
    if (fromLanguage === options.to) {
      return {
        original: text,
        translated: text,
        detectedLanguage: fromLanguage,
        targetLanguage: options.to,
        confidence: 1,
        translationTime: 0,
        provider: 'none',
        fromCache: false,
      };
    }

    // Translate
    const result = await this.provider.translate(text, {
      from: fromLanguage,
      to: options.to,
      quality: options.quality || 'balanced',
      timeout: options.timeout || this.config.timeout,
    });

    // Cache result
    if (this.config.enableCache && options.cache !== false) {
      this.cache.set(text, options.to, result);
    }

    return {
      ...result,
      translationTime: Date.now() - startTime,
      fromCache: false,
    };
  }

  /**
   * Batch translate multiple texts
   */
  async translateBatch(
    texts: string[],
    options: TranslationOptions
  ): Promise<TranslationResult[]> {
    const results: TranslationResult[] = [];

    // Process in parallel (up to maxConcurrent)
    const batchSize = this.config.maxConcurrent;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(text => this.translate(text, options))
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Translate message with queue
   */
  async translateQueued(
    text: string,
    options: TranslationOptions
  ): Promise<TranslationResult> {
    return new Promise((resolve, reject) => {
      this.queue.push({ text, options, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * Get supported languages
   */
  async getSupportedLanguages(): Promise<Array<{
    code: LanguageCode;
    name: string;
    nativeName: string;
  }>> {
    return await this.provider.getSupportedLanguages();
  }

  /**
   * Detect language
   */
  async detectLanguage(text: string): Promise<LanguageCode> {
    return await this.detector.detect(text);
  }

  /**
   * Clear translation cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
  } {
    return this.cache.getStats();
  }

  // ============================================================================
  // Private methods
  // ============================================================================

  private createProvider(): TranslationProvider {
    // Auto-select best provider
    if (this.config.provider === 'auto') {
      if (this.config.apiKeys.deepl) {
        return new (await import('../providers/deepl.js')).DeepLProvider({
          apiKey: this.config.apiKeys.deepl,
        });
      }
      if (this.config.apiKeys.google) {
        return new (await import('../providers/google-translate.js')).GoogleTranslateProvider({
          apiKey: this.config.apiKeys.google,
        });
      }
      // Default to LibreTranslate (free, self-hostable)
      return new LibreTranslateProvider({
        endpoint: this.config.endpoints.libre,
      });
    }

    // Specific provider
    switch (this.config.provider) {
      case 'deepl':
        return new (await import('../providers/deepl.js')).DeepLProvider({
          apiKey: this.config.apiKeys.deepl || '',
        });
      case 'google':
        return new (await import('../providers/google-translate.js')).GoogleTranslateProvider({
          apiKey: this.config.apiKeys.google || '',
        });
      case 'libre':
      default:
        return new LibreTranslateProvider({
          endpoint: this.config.endpoints.libre,
        });
    }
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const { text, options, resolve, reject } = this.queue.shift()!;

      try {
        const result = await this.translate(text, options);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    this.processing = false;
  }
}

/**
 * LibreTranslate Provider (Free, Self-hostable)
 */
export class LibreTranslateProvider extends TranslationProvider {
  private endpoint: string;

  constructor(config: { endpoint?: string } = {}) {
    super();
    this.endpoint = config.endpoint || 'https://libretranslate.com';
  }

  async translate(
    text: string,
    options: {
      from: LanguageCode | 'auto';
      to: LanguageCode;
      quality?: string;
      timeout?: number;
    }
  ): Promise<TranslationResult> {
    const url = `${this.endpoint}/translate`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: options.from === 'auto' ? 'auto' : options.from,
        target: options.to,
        format: 'text',
      }),
      signal: AbortSignal.timeout(options.timeout || 10000),
    });

    if (!response.ok) {
      throw new Error(`Translation failed: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      original: text,
      translated: data.translatedText,
      detectedLanguage: options.from as LanguageCode,
      targetLanguage: options.to,
      confidence: 0.9,
      translationTime: 0,
      provider: 'libre',
      fromCache: false,
    };
  }

  async getSupportedLanguages(): Promise<Array<{
    code: LanguageCode;
    name: string;
    nativeName: string;
  }>> {
    const response = await fetch(`${this.endpoint}/languages`);
    const data = await response.json();
    return data.map((lang: any) => ({
      code: lang.code,
      name: lang.name,
      nativeName: lang.name,
    }));
  }
}
