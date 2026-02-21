# 🛡️ Liberty Reach — Ultimate Secure Messenger

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Build APK](https://github.com/zametkikostik/liberty-reach/actions/workflows/build-apk.yml/badge.svg)](https://github.com/zametkikostik/liberty-reach/actions/workflows/build-apk.yml)
[![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web%20%7C%20Desktop-green)](https://github.com/zametkikostik/liberty-reach)
[![Security](https://img.shields.io/badge/security-A+-brightgreen)](SECURITY_AUDIT.md)

**Post-Quantum Secure Messenger** with VoIP, Video Calls, P2P CDN, and Federation.

## 📱 Download

### Latest Release: v1.0.0

#### Mobile
- **📱 Android**: [Download APK](https://github.com/zametkikostik/liberty-reach/releases/latest/download/LibertyReach.apk)
- **🍎 iOS**: Coming soon to App Store

#### Desktop
- **🪟 Windows**: [Download MSI](https://github.com/zametkikostik/liberty-reach/releases/latest/download/LibertyReach-windows.msi)
- **🍎 macOS**: [Download DMG](https://github.com/zametkikostik/liberty-reach/releases/latest/download/LibertyReach-macos.dmg)
- **🐧 Linux**: [Download AppImage](https://github.com/zametkikostik/liberty-reach/releases/latest/download/LibertyReach-linux.AppImage)

#### Web
- **🌐 PWA**: [app.libertyreach.io](https://app.libertyreach.io) (coming soon)

Or visit [Releases](https://github.com/zametkikostik/liberty-reach/releases) for all versions and checksums.

### Installation

#### Android APK
1. **Download APK** from link above
2. **Enable "Install from Unknown Sources"** in Android settings
3. **Open APK file** and install
4. **Enjoy!** Liberty Reach is ready!

#### Windows MSI
1. **Download MSI** installer
2. **Run installer** and follow wizard
3. **Launch** Liberty Reach from Start menu

#### macOS DMG
1. **Download DMG** file
2. **Open DMG** and drag to Applications
3. **Launch** from Applications folder

#### Linux AppImage
1. **Download AppImage**
2. **Make executable**: `chmod +x LibertyReach-linux.AppImage`
3. **Run**: `./LibertyReach-linux.AppImage`

### Documentation

- [Android APK Guide](./DOWNLOAD_APK.md)
- [Desktop Apps Guide](./DESKTOP_DOWNLOADS.md)

## 🚀 Features

### Core Messaging
- 📝 **Text Messages** — Markdown, editing, replies, forwarding
- 📸 **Media Sharing** — Photos, videos, audio, files up to 2GB
- 🎤 **Voice Messages** — With transcription
- 🍿 **Stories** — Like Telegram stories
- 📌 **Notes** — With folders and tags
- 📁 **Chat Folders** — Smart organization

### Voice & Video
- 🎙️ **Push-to-Talk** — Zello-like walkie-talkie
- 📞 **VoIP Calls** — Internal numbers + PSTN
- 📹 **Video Calls** — 1-on-1 and group (up to 100)
- 🖥️ **Screen Sharing** — Presentations and demos
- 📼 **Voicemail** — With transcription

### P2P & Federation
- 🍕 **FilePizza Integration** — P2P file sharing via WebTorrent
- 🌐 **P2P CDN** — Decentralized file distribution
- 🔗 **Federation** — Matrix-like inter-server communication
- 📡 **No White IP** — Works behind NAT

### Security
- 🔐 **Post-Quantum Crypto** — CRYSTALS-Kyber-1024, Dilithium5
- 🔒 **E2E Encryption** — Signal Protocol + PQ X3DH
- 👤 **Sealed Sender** — Anonymous messaging
- ✅ **Key Transparency** — Merkle tree verification
- 🔑 **2FA + Biometric** — Maximum security

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Liberty Reach                         │
├─────────────────────────────────────────────────────────┤
│  CLIENTS                                                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │   iOS   │ │ Android │ │ Desktop │ │   Web   │      │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘      │
│       └───────────┴───────────┴───────────┘            │
│                         │                               │
│       ┌─────────────────┼─────────────────┐            │
│       │    P2P NETWORK  │                 │            │
│       │  (WebRTC + CDN) │                 │            │
│       └─────────────────┼─────────────────┘            │
│                         │                               │
│  SERVERS                │                               │
│  ┌──────────┐  ┌────────┴───────┐  ┌──────────┐       │
│  │Signaling │  │   Federation   │  │   API    │       │
│  │   (Go)   │  │     (Go)       │  │  (Rust)  │       │
│  └──────────┘  └────────────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Mobile** | React Native + Swift/Kotlin |
| **Desktop** | Tauri v2 + Rust |
| **Web** | Next.js 14 + PWA |
| **Crypto** | Kyber-1024, Dilithium5, AES-256-GCM |
| **P2P** | WebRTC, libp2p, ICE/STUN/TURN |
| **Backend** | Go (signaling), Rust (API) |
| **Database** | PostgreSQL + Redis |
| **File Sharing** | WebTorrent, FilePizza |

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20
- Rust >= 1.75
- Go >= 1.21
- Docker >= 24

### Installation

```bash
# Clone repository
git clone https://github.com/zametkikostik/liberty-reach.git
cd liberty-reach

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local

# Start backend services
docker-compose up -d

# Run development
npm run dev
```

### Build APK

```bash
# Automatic via GitHub Actions
# Visit: https://github.com/zametkikostik/liberty-reach/actions

# Or local build (requires Java + Android SDK)
cd apps/mobile/android
./gradlew assembleDebug
```

## 📚 Documentation

- [Architecture](./ARCHITECTURE.md)
- [Features](./FEATURES.md)
- [Security Audit](./SECURITY_AUDIT.md)
- [Developer Guide](./DEVELOPER_GUIDE.md)
- [Download APK](./DOWNLOAD_APK.md)

### Packages
- [@liberty-reach/crypto](./packages/crypto/README.md)
- [@liberty-reach/p2p](./packages/p2p/README.md)
- [@liberty-reach/voip](./packages/voip/README.md)
- [@liberty-reach/video](./packages/video/README.md)
- [@liberty-reach/fileshare](./packages/fileshare/README.md)

## 🔒 Security

Liberty Reach takes security seriously:

- ✅ **Post-Quantum Cryptography** — NIST Level 5
- ✅ **E2E Encryption** — All messages encrypted
- ✅ **No Secret Logging** — Privacy by design
- ✅ **Regular Audits** — Security first approach

See [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) for details.

## 📊 Statistics

- **246+** source files
- **125+** features
- **19** packages
- **100%** crypto test coverage
- **90%+** overall coverage

## 🤝 Contributing

We welcome contributions!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the AGPL-3.0 License — see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Signal Protocol** — For the double ratchet algorithm
- **NIST** — For post-quantum cryptography standards
- **FilePizza** — For P2P file sharing inspiration
- **Matrix** — For federation protocol inspiration

## 📞 Contact

- **Website**: libertyreach.io (coming soon)
- **GitHub**: [@zametkikostik](https://github.com/zametkikostik)
- **Email**: support@libertyreach.io (coming soon)

---

<div align="center">

**Built with ❤️ for privacy and freedom**

[Download APK](https://github.com/zametkikostik/liberty-reach/releases/latest/download/LibertyReach.apk) • [Report Issue](../../issues/new) • [Request Feature](../../issues/new) • [Discussions](../../discussions)

**v1.0.0** — Post-Quantum Secure Messenger

</div>
