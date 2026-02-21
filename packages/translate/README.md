# @liberty-reach/translate

Async Message Translation for Liberty Reach — Real-time translation with support for 50+ languages including Bulgarian.

## Features

- ✅ **50+ Languages** — Including Bulgarian (български)
- ✅ **Auto Detection** — Automatic language detection
- ✅ **Real-time Translation** — Async translation with caching
- ✅ **Multiple Providers** — LibreTranslate, Google Translate, DeepL
- ✅ **Batch Translation** — Translate multiple messages
- ✅ **Translation Cache** — Improve performance
- ✅ **UI Components** — React components for translation UI

## Installation

```bash
npm install @liberty-reach/translate
```

## Usage

### Basic Translation

```typescript
import { MessageTranslator } from '@liberty-reach/translate';

const translator = new MessageTranslator({
  defaultLanguage: 'bg', // Bulgarian
  autoDetect: true,
  enableCache: true,
  provider: 'libre', // Free, self-hostable
});

// Translate to Bulgarian
const result = await translator.translate('Hello, how are you?', {
  to: 'bg',
});

console.log(result.translated); // "Здравей, как си?"
```

### Auto-detect Language

```typescript
// Auto-detect source language
const result = await translator.translate('Здравей!', {
  from: 'auto',
  to: 'en',
});

console.log(result.detectedLanguage); // 'bg'
console.log(result.translated); // 'Hello!'
```

### Batch Translation

```typescript
const messages = [
  'Hello',
  'How are you?',
  'Nice to meet you',
];

const results = await translator.translateBatch(messages, {
  to: 'bg',
});

results.forEach(result => {
  console.log(`${result.original} → ${result.translated}`);
});
```

### React Component

```typescript
import { TranslatedMessage, LanguageSelector } from '@liberty-reach/translate';

function ChatMessage({ message, userLanguage }) {
  return (
    <div>
      <LanguageSelector
        selectedLanguage={userLanguage}
        onLanguageChange={(lang) => setUserLanguage(lang)}
      />
      
      <TranslatedMessage
        messageId={message.id}
        originalText={message.text}
        detectedLanguage={message.language}
        targetLanguage={userLanguage}
        autoTranslate={true}
      />
    </div>
  );
}
```

## Supported Languages

### Major Languages
- 🇬🇧 **English** (en)
- 🇧🇬 **Bulgarian** (bg) — български
- 🇷🇺 **Russian** (ru) — Русский
- 🇺🇦 **Ukrainian** (uk) — Українська
- 🇩🇪 **German** (de) — Deutsch
- 🇫🇷 **French** (fr) — Français
- 🇪🇸 **Spanish** (es) — Español
- 🇮🇹 **Italian** (it) — Italiano
- 🇵🇹 **Portuguese** (pt) — Português
- 🇵🇱 **Polish** (pl) — Polski

### More Languages
- 🇷🇴 Romanian, 🇹🇷 Turkish, 🇨🇳 Chinese, 🇯🇵 Japanese
- 🇰🇷 Korean, 🇦🇷 Arabic, 🇮🇳 Hindi, 🇮🇱 Hebrew
- 🇨🇿 Czech, 🇸🇰 Slovak, 🇭🇷 Croatian, 🇷🇸 Serbian
- 🇸🇮 Slovenian, 🇲🇰 Macedonian, 🇦🇱 Albanian
- 🇬🇷 Greek, 🇭🇺 Hungarian, 🇳🇱 Dutch
- 🇸🇪 Swedish, 🇩🇰 Danish, 🇳🇴 Norwegian
- 🇫🇮 Finnish, 🇪🇪 Estonian, 🇱🇻 Latvian, 🇱🇹 Lithuanian

**Total: 50+ languages**

## Translation Providers

### LibreTranslate (Free, Self-hostable)

```typescript
const translator = new MessageTranslator({
  provider: 'libre',
  endpoints: {
    libre: 'https://libretranslate.com', // or your self-hosted instance
  },
});
```

### Google Translate (Paid)

```typescript
const translator = new MessageTranslator({
  provider: 'google',
  apiKeys: {
    google: 'your-api-key',
  },
});
```

### DeepL (Paid, High Quality)

```typescript
const translator = new MessageTranslator({
  provider: 'deepl',
  apiKeys: {
    deepl: 'your-api-key',
  },
});
```

### Auto-select

```typescript
const translator = new MessageTranslator({
  provider: 'auto', // Selects best available provider
  apiKeys: {
    deepl: 'your-deepl-key', // Will use DeepL if available
    google: 'your-google-key', // Otherwise Google
  },
  // Falls back to LibreTranslate
});
```

## API Reference

### MessageTranslator

#### Constructor Options

```typescript
interface TranslatorConfig {
  defaultLanguage: LanguageCode;
  autoDetect: boolean;
  enableCache: boolean;
  cacheTTL: number; // seconds
  provider: 'libre' | 'google' | 'deepl' | 'auto';
  apiKeys: {
    libre?: string;
    google?: string;
    deepl?: string;
  };
  timeout: number; // ms
  maxConcurrent: number;
}
```

#### Methods

- `translate(text, options)` — Translate text
- `translateBatch(texts, options)` — Batch translate
- `translateQueued(text, options)` — Queued translation
- `detectLanguage(text)` — Detect language
- `getSupportedLanguages()` — Get supported languages
- `clearCache()` — Clear translation cache
- `getCacheStats()` — Get cache statistics

### TranslationOptions

```typescript
interface TranslationOptions {
  from?: LanguageCode | 'auto';
  to: LanguageCode;
  quality?: 'fast' | 'balanced' | 'best';
  cache?: boolean;
  timeout?: number;
  preserveFormatting?: boolean;
}
```

### TranslationResult

```typescript
interface TranslationResult {
  original: string;
  translated: string;
  detectedLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  confidence: number; // 0-1
  translationTime: number; // ms
  provider: string;
  fromCache: boolean;
}
```

## UI Components

### LanguageSelector

```typescript
<LanguageSelector
  selectedLanguage="bg"
  onLanguageChange={(lang) => setLanguage(lang)}
  showAuto={true}
  compact={false}
/>
```

### TranslatedMessage

```typescript
<TranslatedMessage
  messageId="123"
  originalText="Hello!"
  detectedLanguage="en"
  targetLanguage="bg"
  autoTranslate={true}
  showOriginal={false}
/>
```

## Performance

| Metric | Value |
|--------|-------|
| Cache Hit Rate | ~80% |
| Translation Time | < 500ms |
| Language Detection | < 10ms |
| Batch Size | Up to 100 |

## Caching

Translations are cached to improve performance:

```typescript
const translator = new MessageTranslator({
  enableCache: true,
  cacheTTL: 3600, // 1 hour
});

// First call - API request
await translator.translate('Hello', { to: 'bg' });

// Second call - from cache (instant)
await translator.translate('Hello', { to: 'bg' });
```

## Self-hosting LibreTranslate

For privacy and unlimited translations:

```bash
# Docker
docker run -ti --rm -p 5000:5000 libretranslate/libretranslate

# Use in app
const translator = new MessageTranslator({
  provider: 'libre',
  endpoints: {
    libre: 'http://localhost:5000',
  },
});
```

## License

AGPL-3.0-or-later
