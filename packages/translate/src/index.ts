/**
 * Async Translation for Liberty Reach
 * 
 * Real-time message translation with support for 50+ languages including Bulgarian.
 * 
 * @module @liberty-reach/translate
 */

// Core
export { MessageTranslator, type TranslatorConfig, type TranslationResult } from './core/message-translator.js';
export { TranslationCache } from './core/translation-cache.js';
export { LanguageDetector } from './core/language-detector.js';

// Providers
export { TranslationProvider, type ProviderConfig } from './providers/translation-provider.js';
export { LibreTranslateProvider } from './providers/libre-translate.js';
export { GoogleTranslateProvider } from './providers/google-translate.js';
export { DeepLProvider } from './providers/deepl.js';

// UI
export { TranslationButton } from './ui/translation-button.js';
export { LanguageSelector } from './ui/language-selector.js';
export { TranslatedMessage } from './ui/translated-message.js';

// Types
export type {
  SupportedLanguage,
  LanguageCode,
  TranslationOptions,
  TranslationQuality,
} from './types.js';
