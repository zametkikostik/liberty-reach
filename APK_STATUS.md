# 📱 Liberty Reach — APK Build Instructions

## APK Status

**Current Status**: ⏳ Building on first release

The APK will be automatically generated when:
1. A release is created on GitHub
2. GitHub Actions workflow runs
3. APK is uploaded to releases

## How to Get APK Now

### Option 1: Build via GitHub Actions

1. Go to: https://github.com/zametkikostik/liberty-reach/actions
2. Click on "Build Android APK" workflow
3. Click "Run workflow" → "Run workflow" button
4. Wait for build to complete (~10-15 minutes)
5. Download APK from artifacts

### Option 2: Manual Build (Requires Java)

```bash
# Install Java 17
sudo apt update
sudo apt install openjdk-17-jdk

# Build APK
cd /home/kostik/liberty-reach/apps/mobile/android
chmod +x build-simple-apk.sh
./build-simple-apk.sh

# APK location:
# apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

### Option 3: Online Build Services

#### Using GitPod
```
1. Open: https://gitpod.io/#https://github.com/zametkikostik/liberty-reach
2. In terminal: cd apps/mobile/android && ./gradlew assembleDebug
3. Download APK from artifacts
```

## Create First Release

To trigger automatic APK build:

1. Go to: https://github.com/zametkikostik/liberty-reach/releases/new
2. Tag version: `v1.0.0`
3. Release title: `Liberty Reach v1.0.0`
4. Click "Publish release"
5. GitHub Actions will build APK automatically
6. APK will appear in release assets

## Current Download Links

**Note**: These links will work AFTER first release is created:

- **Android APK**: https://github.com/zametkikostik/liberty-reach/releases/latest/download/LibertyReach.apk
- **Windows MSI**: https://github.com/zametkikostik/liberty-reach/releases/latest/download/LibertyReach-windows.msi
- **macOS DMG**: https://github.com/zametkikostik/liberty-reach/releases/latest/download/LibertyReach-macos.dmg
- **Linux AppImage**: https://github.com/zametkikostik/liberty-reach/releases/latest/download/LibertyReach-linux.AppImage

## Quick Start (For Testing)

If you need APK immediately for testing:

### Minimal APK (Web-based)

A simple WebView-based APK can be created without React Native:

```bash
cd /home/kostik/liberty-reach/apps/mobile/android
# Use the minimal HTML/JS app included
./gradlew assembleDebug
```

This creates a basic APK with the Liberty Reach web interface.

### Full APK (React Native)

For the full-featured app with all features:

1. Wait for GitHub Actions build
2. OR build locally with full React Native setup

## Troubleshooting

### "Release not found"
- Create first release on GitHub
- Wait for Actions to complete

### "404 Not Found"
- Release exists but APK not uploaded yet
- Check Actions tab for build status

### "Artifact expired"
- Artifacts expire after 90 days
- Download from Releases instead

## Next Steps

1. **Create Release**: https://github.com/zametkikostik/liberty-reach/releases/new
2. **Tag**: v1.0.0
3. **Publish**: This triggers APK build
4. **Wait**: ~15 minutes for build
5. **Download**: APK appears in release assets

---

**Status**: Ready to build | **First Release**: Pending
