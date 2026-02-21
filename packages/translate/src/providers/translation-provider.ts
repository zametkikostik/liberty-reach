/**
 * Translation Provider Base Class
 */

import type { LanguageCode, TranslationResult, TranslationOptions } from '../types.js';

export abstract class TranslationProvider {
  /**
   * Translate text
   */
  abstract translate(
    text: string,
    options: {
      from: LanguageCode | 'auto';
      to: LanguageCode;
      quality?: string;
      timeout?: number;
    }
  ): Promise<TranslationResult>;

  /**
   * Get supported languages
   */
  abstract getSupportedLanguages(): Promise<Array<{
    code: LanguageCode;
    name: string;
    nativeName: string;
  }>>;
}

export interface ProviderConfig {
  apiKey?: string;
  endpoint?: string;
  timeout?: number;
}
