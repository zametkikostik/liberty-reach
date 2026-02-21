# Liberty Reach Mobile

React Native mobile application for iOS and Android.

## Features

- **Native Performance** - React Native 0.73 + Hermes engine
- **Native Crypto** - Swift/Kotlin native modules for PQ cryptography
- **Biometric Auth** - Face ID / Touch ID / Fingerprint
- **CallKit Integration** - Native call interface
- **Secure Storage** - Keychain (iOS) / Keystore (Android)
- **Offline First** - MMKV for fast local storage

## Quick Start

### Prerequisites

- Node.js >= 20
- Xcode >= 15 (iOS)
- Android Studio >= 2023.1 (Android)
- CocoaPods

### Installation

```bash
# Install dependencies
npm install

# Install iOS pods
cd ios && pod install && cd ..

# Start development server
npm run start
```

### Run on iOS

```bash
# Simulator
npm run ios

# Specific device
npm run ios -- --device "iPhone 15 Pro"
```

### Run on Android

```bash
# Emulator
npm run android

# Specific device
npm run android -- --deviceId <device-id>
```

## Project Structure

```
apps/mobile/
├── src/
│   ├── screens/        # App screens
│   │   ├── AuthScreen.tsx
│   │   ├── ChatListScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   ├── CallScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── navigation/     # React Navigation
│   ├── store/          # Zustand stores
│   ├── services/       # External services
│   ├── hooks/          # Custom hooks
│   └── native/         # Native modules
├── ios/                # iOS native code
└── android/            # Android native code
```

## Native Modules

### Crypto Module (iOS)

```swift
// CryptoModule.swift
@objc(CryptoModule)
class CryptoModule: NSObject {
    @objc
    func generateKyberKeyPair(_ resolve: @escaping RCTPromiseResolveBlock,
                              rejecter reject: @escaping RCTPromiseRejectBlock) {
        // Native Kyber implementation
    }
}
```

### Crypto Module (Android)

```kotlin
// CryptoModule.kt
@ReactMethod
fun generateKyberKeyPair(promise: Promise) {
    // Native Kyber implementation
}
```

## Security Features

- **Root/Jailbreak Detection**
- **Screenshot Prevention** (Android FLAG_SECURE)
- **Biometric Lock** on app background
- **Certificate Pinning**
- **Encrypted Storage**

## Building for Production

### iOS

```bash
npm run ios:release
```

### Android

```bash
# APK
npm run android:release

# AAB (Play Store)
cd android && ./gradlew bundleRelease
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests (Detox)
npm run test:e2e
```

## License

AGPL-3.0-or-later
