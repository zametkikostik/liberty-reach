/**
 * Language Selector UI Component
 */

import React, { useState } from 'react';
import type { LanguageCode, SupportedLanguage } from '../types.js';

/**
 * Language Selector props
 */
export interface LanguageSelectorProps {
  selectedLanguage: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
  showAuto?: boolean;
  compact?: boolean;
}

/**
 * Supported languages list
 */
const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'auto', name: 'Auto Detect', nativeName: 'Auto', flag: '🌐' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', flag: '🇧🇬' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', flag: '🇸🇰' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', flag: '🇭🇷' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски', flag: '🇷🇸' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', flag: '🇸🇮' },
  { code: 'mk', name: 'Macedonian', nativeName: 'Македонски', flag: '🇲🇰' },
  { code: 'sq', name: 'Albanian', nativeName: 'Shqip', flag: '🇦🇱' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti', flag: '🇪🇪' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', flag: '🇱🇻' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', flag: '🇱🇹' },
];

/**
 * LanguageSelector - Dropdown for language selection
 */
export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onLanguageChange,
  showAuto = true,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const languages = showAuto
    ? SUPPORTED_LANGUAGES
    : SUPPORTED_LANGUAGES.filter(l => l.code !== 'auto');

  const selectedLang = languages.find(l => l.code === selectedLanguage);

  return (
    <div className={`language-selector ${compact ? 'compact' : ''} ${isOpen ? 'open' : ''}`}>
      <button
        className="language-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span className="language-flag">{selectedLang?.flag}</span>
        {!compact && (
          <span className="language-name">
            {selectedLang?.name || selectedLang?.nativeName}
          </span>
        )}
        <span className="language-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="language-dropdown">
          <div className="language-search">
            <input
              type="text"
              placeholder="Search language..."
              onChange={(e) => {
                const search = e.target.value.toLowerCase();
                const filtered = languages.filter(
                  l => l.name.toLowerCase().includes(search) ||
                       l.nativeName.toLowerCase().includes(search)
                );
                // Update dropdown items (simplified)
              }}
            />
          </div>

          <div className="language-list">
            {languages.map(lang => (
              <button
                key={lang.code}
                className={`language-item ${selectedLanguage === lang.code ? 'selected' : ''}`}
                onClick={() => {
                  onLanguageChange(lang.code);
                  setIsOpen(false);
                }}
                type="button"
              >
                <span className="language-flag">{lang.flag}</span>
                <span className="language-name">{lang.name}</span>
                <span className="language-native">{lang.nativeName}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .language-selector {
          position: relative;
          display: inline-block;
        }
        .language-selector-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-size: 14px;
        }
        .language-flag {
          font-size: 20px;
        }
        .language-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          margin-top: 4px;
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          max-height: 300px;
          overflow-y: auto;
          z-index: 1000;
          min-width: 200px;
        }
        .language-search {
          padding: 8px;
          border-bottom: 1px solid #eee;
        }
        .language-search input {
          width: 100%;
          padding: 6px 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        .language-list {
          max-height: 240px;
          overflow-y: auto;
        }
        .language-item {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 8px 12px;
          border: none;
          background: transparent;
          cursor: pointer;
          text-align: left;
        }
        .language-item:hover {
          background: #f5f5f5;
        }
        .language-item.selected {
          background: #e3f2fd;
        }
        .language-name {
          flex: 1;
        }
        .language-native {
          color: #666;
          font-size: 12px;
        }
        .compact .language-name {
          display: none;
        }
      `}</style>
    </div>
  );
};
