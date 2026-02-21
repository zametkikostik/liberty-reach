# 🖥️ Liberty Reach — Desktop Downloads

## Download Desktop Apps

### Latest Release: v1.0.0

#### Windows
- **Format**: MSI Installer
- **Download**: [LibertyReach-windows.msi](https://github.com/zametkikostik/liberty-reach/releases/latest/download/LibertyReach-windows.msi)
- **Size**: ~20-30 MB
- **Architecture**: x64

#### macOS
- **Format**: DMG
- **Download**: [LibertyReach-macos.dmg](https://github.com/zametkikostik/liberty-reach/releases/latest/download/LibertyReach-macos.dmg)
- **Size**: ~25-35 MB
- **Architecture**: Universal (Intel + Apple Silicon)
- **Requirements**: macOS 10.15+

#### Linux
- **Format**: AppImage
- **Download**: [LibertyReach-linux.AppImage](https://github.com/zametkikostik/liberty-reach/releases/latest/download/LibertyReach-linux.AppImage)
- **Size**: ~30-40 MB
- **Architecture**: x64
- **Requirements**: glibc 2.28+

## Installation

### Windows (MSI)

1. **Download** the MSI installer
2. **Run** the installer
3. **Follow** the installation wizard
4. **Launch** from Start menu or desktop shortcut

**System Requirements:**
- Windows 10/11 (64-bit)
- 4GB RAM minimum
- 100MB free disk space

### macOS (DMG)

1. **Download** the DMG file
2. **Open** the DMG
3. **Drag** Liberty Reach to Applications folder
4. **Launch** from Applications

**First launch on macOS:**
- If you see "App can't be opened", right-click → Open
- Or go to System Preferences → Security & Privacy → Open Anyway

**System Requirements:**
- macOS 10.15 (Catalina) or later
- Intel or Apple Silicon (M1/M2)
- 4GB RAM minimum

### Linux (AppImage)

1. **Download** the AppImage
2. **Make executable**:
   ```bash
   chmod +x LibertyReach-linux.AppImage
   ```
3. **Run**:
   ```bash
   ./LibertyReach-linux.AppImage
   ```

**Optional - Install desktop integration:**
```bash
# Install appimaged for automatic integration
sudo apt install appimaged

# Or manually create desktop entry
cp LibertyReach-linux.AppImage ~/.local/bin/liberty-reach
```

**System Requirements:**
- Linux with glibc 2.28+ (Ubuntu 18.04+, Fedora 28+, etc.)
- 64-bit architecture
- 4GB RAM minimum

## Build from Source

### Prerequisites

- Node.js >= 20
- Rust >= 1.75
- Git

### Build Commands

```bash
# Clone repository
git clone https://github.com/zametkikostik/liberty-reach.git
cd liberty-reach

# Install dependencies
npm install

# Build desktop app
cd apps/desktop
npm install
npm run tauri build
```

### Build Outputs

- **Windows**: `src-tauri/target/release/bundle/msi/*.msi`
- **macOS**: `src-tauri/target/release/bundle/dmg/*.dmg`
- **Linux**: `src-tauri/target/release/bundle/appimage/*.AppImage`

## Features

### Desktop Specific

- ✅ **Native Performance** — Rust backend
- ✅ **System Tray** — Quick access
- ✅ **Global Shortcuts** — Quick actions
- ✅ **Native Notifications** — OS integration
- ✅ **Auto-start** — Launch on boot
- ✅ **File System Access** — Native file picker
- ✅ **Offline Support** — Works without browser

### All Platforms

- 🔐 Post-Quantum Encryption
- 📞 VoIP Calls
- 📹 Video Calls
- 🎙️ Push-to-Talk
- 📁 File Sharing
- 🌐 P2P Network
- 📔 Stories
- 📝 Notes
- 📁 Chat Folders

## Troubleshooting

### Windows

**"SmartScreen blocked"**
- Click "More info" → "Run anyway"
- This is expected for new applications

**MSI won't install**
- Run as Administrator
- Check Windows Event Viewer for details

### macOS

**"App can't be opened"**
- Right-click → Open
- Or: System Preferences → Security & Privacy → Open Anyway

**DMG not mounting**
- Try: `hdiutil attach LibertyReach-macos.dmg`

### Linux

**"Permission denied"**
```bash
chmod +x LibertyReach-linux.AppImage
```

**"FUSE not found"**
```bash
# Install FUSE
sudo apt install libfuse2  # Ubuntu/Debian
sudo dnf install fuse      # Fedora/RHEL
```

**AppImage doesn't run**
```bash
# Check if AppImage is valid
./LibertyReach-linux.AppImage --appimage-extract
```

## Verify Downloads

### Checksums

After downloading, verify integrity:

```bash
# Windows (PowerShell)
Get-FileHash LibertyReach-windows.msi -Algorithm SHA256

# macOS/Linux
shasum -a 256 LibertyReach-macos.dmg
shasum -a 256 LibertyReach-linux.AppImage
```

Compare with checksums in [Releases](https://github.com/zametkikostik/liberty-reach/releases).

### Signature Verification

**Windows:**
```powershell
# Check digital signature
signtool verify /pa LibertyReach-windows.msi
```

**macOS:**
```bash
# Check code signature
codesign -verify --verbose LibertyReach.app
```

## Auto-Updates

Desktop apps support automatic updates:

- **Windows**: Built-in updater via MSI
- **macOS**: Sparkle framework
- **Linux**: AppImageUpdate (when available)

Updates are checked on app launch.

## Uninstall

### Windows
```
Settings → Apps → Liberty Reach → Uninstall
```

### macOS
```
Drag Liberty Reach.app from Applications to Trash
```

### Linux
```bash
# Remove AppImage
rm ~/.local/bin/liberty-reach
rm ~/LibertyReach-linux.AppImage
```

## Support

- **Issues**: https://github.com/zametkikostik/liberty-reach/issues
- **Discussions**: https://github.com/zametkikostik/liberty-reach/discussions
- **Documentation**: See project README

---

**Enjoy Liberty Reach on Desktop!** 🖥️
