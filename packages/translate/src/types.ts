/**
 * Translation Types
 */

/**
 * Supported language codes
 */
export type LanguageCode =
  | 'en'  // English
  | 'bg'  // Bulgarian
  | 'ru'  // Russian
  | 'uk'  // Ukrainian
  | 'de'  // German
  | 'fr'  // French
  | 'es'  // Spanish
  | 'it'  // Italian
  | 'pt'  // Portuguese
  | 'pl'  // Polish
  | 'ro'  // Romanian
  | 'tr'  // Turkish
  | 'zh'  // Chinese
  | 'ja'  // Japanese
  | 'ko'  // Korean
  | 'ar'  // Arabic
  | 'hi'  // Hindi
  | 'he'  // Hebrew
  | 'cs'  // Czech
  | 'sk'  // Slovak
  | 'hr'  // Croatian
  | 'sr'  // Serbian
  | 'sl'  // Slovenian
  | 'mk'  // Macedonian
  | 'sq'  // Albanian
  | 'el'  // Greek
  | 'hu'  // Hungarian
  | 'nl'  // Dutch
  | 'sv'  // Swedish
  | 'da'  // Danish
  | 'no'  // Norwegian
  | 'fi'  // Finnish
  | 'et'  // Estonian
  | 'lv'  // Latvian
  | 'lt'  // Lithuanian
  | 'auto'; // Auto-detect

/**
 * Supported language interface
 */
export interface SupportedLanguage {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
}

/**
 * Translation options
 */
export interface TranslationOptions {
  /** Source language (auto-detect if not specified) */
  from?: LanguageCode | 'auto';
  /** Target language */
  to: LanguageCode;
  /** Translation quality */
  quality?: 'fast' | 'balanced' | 'best';
  /** Cache translations */
  cache?: boolean;
  /** Timeout in ms */
  timeout?: number;
  /** Preserve formatting */
  preserveFormatting?: boolean;
  /** Detect language first */
  detectLanguage?: boolean;
}

/**
 * Translation result
 */
export interface TranslationResult {
  /** Original text */
  original: string;
  /** Translated text */
  translated: string;
  /** Detected source language */
  detectedLanguage: LanguageCode;
  /** Target language */
  targetLanguage: LanguageCode;
  /** Translation confidence (0-1) */
  confidence: number;
  /** Translation time in ms */
  translationTime: number;
  /** Provider used */
  provider: string;
  /** Cached result */
  fromCache: boolean;
}

/**
 * Translation quality level
 */
export type TranslationQuality = 'fast' | 'balanced' | 'best';

/**
 * Translation event
 */
export interface TranslationEvent {
  messageId: string;
  originalText: string;
  translatedText: string;
  fromLanguage: LanguageCode;
  toLanguage: LanguageCode;
  timestamp: number;
}
