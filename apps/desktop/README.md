# Liberty Reach Desktop

Tauri v2 desktop application for Windows, macOS, and Linux.

## Features

- **Native Performance** - Rust backend + React frontend
- **Post-Quantum Crypto** - Native Rust crypto (pqcrypto, sodiumoxide)
- **System Integration** - Tray icon, notifications, autostart
- **Encrypted Storage** - SQLCipher for local database
- **Cross-Platform** - Single codebase for all desktop OS

## Quick Start

### Prerequisites

- Node.js >= 20
- Rust >= 1.75
- Platform-specific dependencies (see Tauri docs)

### Installation

```bash
# Install dependencies
npm install

# Start development
npm run dev
```

## Development

```bash
# Run in development mode
npm run tauri:dev

# Build for production
npm run tauri:build
```

## Project Structure

```
apps/desktop/
├── src/                # React frontend
│   ├── components/
│   ├── screens/
│   ├── store/
│   └── utils/
├── src-tauri/          # Rust backend
│   ├── src/
│   │   └── main.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
└── vite.config.ts
```

## Rust Commands

The app exposes Rust commands to the frontend:

```typescript
import {invoke} from '@tauri-apps/api/core';

// Encrypt a message
const encrypted = await invoke('encrypt_message', {
  message: 'Hello',
  key: 'secret-key'
});

// Decrypt a message
const decrypted = await invoke('decrypt_message', {
  ciphertext: encrypted,
  key: 'secret-key'
});
```

## Platform-Specific Builds

### Windows

- MSI installer
- Authenticode signing required
- WNS push notifications

### macOS

- DMG + App Bundle
- Notarization required
- APNs push notifications
- Hardened runtime

### Linux

- AppImage, .deb, .rpm
- Desktop entry file
- libnotify notifications

## Building

```bash
# Build for current platform
npm run build

# Build all platforms (requires cross-compilation setup)
npm run build:all
```

## Security

- **Code Signing** - All binaries are signed
- **Auto-updater** - Signed updates with verification
- **Sandbox** - Minimal permissions
- **Encrypted Storage** - SQLCipher with user key

## License

AGPL-3.0-or-later
