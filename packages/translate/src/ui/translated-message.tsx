/**
 * Translated Message Component
 * 
 * Displays message with auto-translation support.
 */

import React, { useState, useEffect } from 'react';
import type { LanguageCode } from '../types.js';
import { MessageTranslator } from '../core/message-translator.js';

/**
 * TranslatedMessage props
 */
export interface TranslatedMessageProps {
  messageId: string;
  originalText: string;
  detectedLanguage?: LanguageCode;
  targetLanguage: LanguageCode;
  autoTranslate?: boolean;
  showOriginal?: boolean;
  onTranslate?: (translation: string) => void;
}

/**
 * TranslatedMessage - Message with translation
 */
export const TranslatedMessage: React.FC<TranslatedMessageProps> = ({
  messageId,
  originalText,
  detectedLanguage = 'auto',
  targetLanguage,
  autoTranslate = false,
  showOriginal = false,
  onTranslate,
}) => {
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [translator] = useState(() => new MessageTranslator());

  useEffect(() => {
    if (autoTranslate && targetLanguage !== detectedLanguage) {
      handleTranslate();
    }
  }, [originalText, targetLanguage, autoTranslate]);

  const handleTranslate = async () => {
    if (translatedText) return; // Already translated

    setIsTranslating(true);
    setError(null);

    try {
      const result = await translator.translate(originalText, {
        from: detectedLanguage,
        to: targetLanguage,
      });

      setTranslatedText(result.translated);
      onTranslate?.(result.translated);
    } catch (err) {
      setError('Translation failed');
      console.error('Translation error:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleShowOriginal = () => {
    setTranslatedText(null);
  };

  return (
    <div className="translated-message">
      {showOriginal && (
        <div className="original-text">
          {originalText}
          {detectedLanguage !== 'auto' && (
            <span className="language-badge">{detectedLanguage}</span>
          )}
        </div>
      )}

      {translatedText ? (
        <div className="translated-text">
          {translatedText}
          <div className="translation-actions">
            <button onClick={handleShowOriginal} className="action-button">
              Show original
            </button>
          </div>
        </div>
      ) : isTranslating ? (
        <div className="translating">
          <span className="spinner">⏳</span>
          Translating...
        </div>
      ) : error ? (
        <div className="translation-error">
          {error}
          <button onClick={handleTranslate} className="retry-button">
            Retry
          </button>
        </div>
      ) : autoTranslate ? (
        <div className="translation-prompt">
          <button onClick={handleTranslate} className="translate-button">
            🌐 Translate to {targetLanguage}
          </button>
        </div>
      ) : null}

      <style>{`
        .translated-message {
          margin: 8px 0;
        }
        .original-text {
          padding: 8px 12px;
          background: #f5f5f5;
          border-radius: 8px;
          margin-bottom: 8px;
          position: relative;
        }
        .language-badge {
          position: absolute;
          top: 4px;
          right: 8px;
          font-size: 10px;
          padding: 2px 6px;
          background: #e0e0e0;
          border-radius: 4px;
          color: #666;
          text-transform: uppercase;
        }
        .translated-text {
          padding: 8px 12px;
          background: #e3f2fd;
          border-radius: 8px;
        }
        .translation-actions {
          margin-top: 8px;
          display: flex;
          gap: 8px;
        }
        .action-button {
          font-size: 12px;
          padding: 4px 8px;
          border: 1px solid #90caf9;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          color: #1976d2;
        }
        .translating {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #666;
          padding: 8px 12px;
        }
        .translation-error {
          color: #d32f2f;
          padding: 8px 12px;
          background: #ffebee;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .retry-button {
          padding: 4px 12px;
          border: 1px solid #ef5350;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          color: #d32f2f;
        }
        .translation-prompt {
          padding: 8px 12px;
        }
        .translate-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border: 1px solid #2196f3;
          border-radius: 8px;
          background: #e3f2fd;
          cursor: pointer;
          color: #1976d2;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};
