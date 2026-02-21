# Liberty Reach Web

Next.js 14 PWA (Progressive Web App).

## Features

- **PWA** - Installable, offline support, push notifications
- **WASM Crypto** - Post-quantum crypto via WebAssembly
- **IndexedDB** - Encrypted local storage
- **Server-Side Rendering** - Next.js 14 App Router
- **Responsive** - Works on desktop and mobile browsers

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

## Project Structure

```
apps/web/
├── src/
│   ├── app/            # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   └── sw.ts       # Service Worker
│   ├── components/     # React components
│   ├── store/          # Zustand stores
│   └── utils/          # Utilities
├── public/
│   └── manifest.json   # PWA manifest
├── next.config.js
└── package.json
```

## PWA Features

### Offline Support

The service worker caches:
- App shell (HTML, CSS, JS)
- Images (30 days)
- Fonts (1 year)
- API responses (5 minutes)

### Push Notifications

```typescript
// Request permission
const permission = await Notification.requestPermission();

// Subscribe to push
const subscription = await pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: VAPID_PUBLIC_KEY
});
```

### Install Prompt

```typescript
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  // Show install button
});
```

## Security

- **HTTPS Only** - Required for PWA features
- **Content Security Policy** - Strict CSP headers
- **Subresource Integrity** - Verify external scripts
- **IndexedDB Encryption** - Encrypt local data

## Performance

| Metric | Target |
|--------|--------|
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |
| Bundle Size | < 200KB |

## Building

```bash
# Analyze bundle
npm run build:analyze

# Generate static site
npm run build
```

## Deployment

### Vercel (Recommended)

```bash
vercel deploy
```

### Docker

```bash
docker build -t liberty-reach-web .
docker run -p 3000:3000 liberty-reach-web
```

## License

AGPL-3.0-or-later
