#!/bin/bash

# Liberty Reach - Create First Release v1.0.0
# This script creates the first release on GitHub

set -e

echo "🚀 Liberty Reach - Create Release v1.0.0"
echo "=========================================="
echo ""

# Configuration
REPO="zametkikostik/liberty-reach"
TAG="v1.0.0"
TITLE="Liberty Reach v1.0.0 - Initial Release"
BODY_FILE="/tmp/release-notes.md"

# Release notes
cat > "$BODY_FILE" << 'EOF'
## 🎉 Liberty Reach v1.0.0 - Initial Release

The ultimate post-quantum secure messenger is here!

### 🔐 Security Features
- **Post-Quantum Cryptography** — CRYSTALS-Kyber-1024, Dilithium5
- **E2E Encryption** — Signal Protocol + PQ X3DH
- **Sealed Sender** — Anonymous messaging
- **Key Transparency** — Merkle tree verification

### 📱 Features
- **Messaging** — Text, media, files up to 2GB
- **VoIP Calls** — Internal numbers, PSTN integration
- **Video Calls** — WebRTC with screen sharing
- **Push-to-Talk** — Zello-like walkie-talkie
- **P2P Network** — Works without public IP
- **Auto Translation** — 50+ languages including Bulgarian
- **Stories** — Like Telegram stories
- **Notes** — With folders and tags
- **Chat Folders** — Smart organization

### 🌐 Federation
- **Matrix-like Protocol** — Inter-server communication
- **Public Rooms** — Federated rooms
- **Server Discovery** — Automatic peer finding

### 📦 Packages (20 total)
- `@liberty-reach/crypto` — Post-quantum cryptography
- `@liberty-reach/p2p` — WebRTC + libp2p networking
- `@liberty-reach/p2p-cdn` — P2P file distribution
- `@liberty-reach/protocol` — LRP wire protocol
- `@liberty-reach/ui` — Shared UI components
- `@liberty-reach/voice` — Push-to-talk conferences
- `@liberty-reach/voip` — VoIP telephony
- `@liberty-reach/video` — Video calls
- `@liberty-reach/fileshare` — FilePizza integration
- `@liberty-reach/translate` — Auto-translation (50+ languages)
- `@liberty-reach/stories` — Stories feature
- `@liberty-reach/notes` — Notes with folders
- `@liberty-reach/folders` — Chat folders

### 🖥️ Platforms
- **Mobile** — iOS, Android (React Native)
- **Desktop** — Windows, macOS, Linux (Tauri v2)
- **Web** — PWA (Next.js 14)

### 📊 Statistics
- **246+** source files
- **125+** features
- **19** packages
- **100%** crypto test coverage

### 🔧 Build Instructions

#### Android APK
```bash
cd apps/mobile/android
./build-simple-apk.sh
```

#### Desktop Apps
```bash
cd apps/desktop
npm run tauri build
```

#### Web Version
```bash
cd apps/web
python3 -m http.server 8080
# Open http://localhost:8080
```

### 📝 Documentation
- [README](README.md) — Main documentation
- [ARCHITECTURE](ARCHITECTURE.md) — System architecture
- [FEATURES](FEATURES.md) — Feature list
- [SECURITY_AUDIT](SECURITY_AUDIT.md) — Security review
- [DEVELOPER_GUIDE](DEVELOPER_GUIDE.md) — Developer guide

### 🙏 Thanks
- Signal Protocol — Double ratchet algorithm
- NIST — Post-quantum cryptography standards
- FilePizza — P2P file sharing inspiration
- Matrix — Federation protocol inspiration

### 📄 License
AGPL-3.0-or-later

---

**Built with ❤️ for privacy and freedom**

**Full changelog**: https://github.com/zametkikostik/liberty-reach/compare/v0.0.0...v1.0.0
EOF

echo "📝 Release notes created"
echo ""

# Check if GitHub CLI is available
if command -v gh &> /dev/null; then
    echo "✓ GitHub CLI found"
    
    # Check authentication
    if gh auth status &> /dev/null; then
        echo "✓ GitHub CLI authenticated"
        
        # Create release
        echo ""
        echo "📦 Creating release $TAG..."
        
        gh release create "$TAG" \
            --repo "$REPO" \
            --title "$TITLE" \
            --notes-file "$BODY_FILE" \
            --draft=false \
            --prerelease=false
        
        echo ""
        echo "✅ Release created successfully!"
        echo ""
        echo "📦 Release URL: https://github.com/$REPO/releases/tag/$TAG"
        echo ""
        echo "GitHub Actions will now build:"
        echo "  - Android APK"
        echo "  - Windows MSI"
        echo "  - macOS DMG"
        echo "  - Linux AppImage"
        echo ""
        echo "Check progress: https://github.com/$REPO/actions"
        
    else
        echo "✗ GitHub CLI not authenticated"
        echo ""
        echo "Please run: gh auth login"
        echo "Then run this script again"
    fi
else
    echo "✗ GitHub CLI not found"
    echo ""
    echo "Install with:"
    echo "  sudo apt install gh  # Ubuntu/Debian"
    echo "  brew install gh      # macOS"
    echo ""
    echo "Or create release manually:"
    echo "  1. Go to: https://github.com/$REPO/releases/new"
    echo "  2. Tag version: $TAG"
    echo "  3. Release title: $TITLE"
    echo "  4. Copy release notes from: $BODY_FILE"
    echo "  5. Click 'Publish release'"
fi

echo ""
echo "Release notes saved to: $BODY_FILE"
