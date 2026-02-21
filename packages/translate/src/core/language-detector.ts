/**
 * Language Detector
 * 
 * Detects the language of text using n-gram analysis.
 */

import type { LanguageCode } from '../types.js';

/**
 * Common language patterns for detection
 */
const LANGUAGE_PATTERNS: Record<string, {
  patterns: string[];
  name: string;
}> = {
  'bg': {
    patterns: ['ия', 'щи', 'що', 'тък', 'ово', 'ите', 'ата', 'ята', 'щеш', 'щеше'],
    name: 'Bulgarian',
  },
  'ru': {
    patterns: ['ого', 'его', 'ние', 'тие', 'сть', 'тся', 'ться', 'ый', 'ий', 'ая'],
    name: 'Russian',
  },
  'uk': {
    patterns: ['ого', 'ьо', 'ня', 'ти', 'ся', 'ий', 'ає', 'ує', 'ї'],
    name: 'Ukrainian',
  },
  'en': {
    patterns: ['the', 'and', 'ing', 'tion', 'ly', 'ed', 'es', 's ', ' a ', ' is '],
    name: 'English',
  },
  'de': {
    patterns: ['ung', 'lich', 'keit', 'heit', 'sch', 'cht', 'pf', 'tz', 'ß', 'ie '],
    name: 'German',
  },
  'fr': {
    patterns: ['tion', 'ment', 'que', 'les', 'des', 'est', 'ent', 'it ', 'on ', 're '],
    name: 'French',
  },
  'es': {
    patterns: ['ción', 'sión', 'mente', 'que', 'los', 'las', 'es ', ' de ', ' en '],
    name: 'Spanish',
  },
  'it': {
    patterns: ['zione', 'mente', 'che', 'gli', 'del', 'nel', 'one', 'tti', 'tti'],
    name: 'Italian',
  },
  'zh': {
    patterns: ['的', '了', '在', '是', '我', '有', '和', '不', '人', '中'],
    name: 'Chinese',
  },
  'ja': {
    patterns: ['の', 'に', 'は', 'を', 'が', 'た', 'て', 'す', 'ま', 'ん'],
    name: 'Japanese',
  },
};

/**
 * LanguageDetector - Detects text language
 */
export class LanguageDetector {
  /**
   * Detect language of text
   */
  async detect(text: string): Promise<LanguageCode> {
    const lowerText = text.toLowerCase();

    // Check patterns
    const scores: Record<string, number> = {};

    for (const [lang, { patterns }] of Object.entries(LANGUAGE_PATTERNS)) {
      scores[lang] = 0;
      for (const pattern of patterns) {
        const matches = lowerText.split(pattern).length - 1;
        scores[lang] += matches;
      }
    }

    // Find best match
    let bestLang: LanguageCode = 'en';
    let bestScore = 0;

    for (const [lang, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestLang = lang as LanguageCode;
      }
    }

    return bestLang;
  }

  /**
   * Detect multiple languages in text
   */
  async detectMultiple(text: string): Promise<Array<{
    language: LanguageCode;
    confidence: number;
    segments: Array<{ start: number; end: number }>;
  }>> {
    // Simple implementation - detect primary language
    const primary = await this.detect(text);
    return [{
      language: primary,
      confidence: 0.8,
      segments: [{ start: 0, end: text.length }],
    }];
  }
}
