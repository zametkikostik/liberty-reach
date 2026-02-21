# 📦 How to Create Release v1.0.0

## Quick Guide

The error means you need to specify a **tag name** when creating the release.

### Option 1: Via GitHub Web Interface (Easiest)

1. **Go to**: https://github.com/zametkikostik/liberty-reach/releases/new

2. **Fill in the form**:
   ```
   Tag version: v1.0.0
   Release title: Liberty Reach v1.0.0 - Initial Release
   ```

3. **Click "Choose a tag"** → Type `v1.0.0` → Press Enter

4. **Add description** (optional):
   ```
   ## 🎉 Liberty Reach v1.0.0 - Initial Release
   
   Post-Quantum Secure Messenger
   
   ### Features
   - Post-Quantum Cryptography (Kyber-1024, Dilithium5)
   - VoIP Telephony + Video Calls
   - P2P CDN + FilePizza integration
   - Push-to-Talk conferences
   - Auto Translation (50+ languages)
   - Stories, Notes, Chat Folders
   
   ### Stats
   - 246+ source files
   - 125+ features
   - 20 packages
   - 100% crypto test coverage
   ```

5. **Click "Publish release"** (green button)

6. **GitHub Actions will automatically build**:
   - Android APK
   - Windows MSI
   - macOS DMG
   - Linux AppImage

### Option 2: Via GitHub CLI

```bash
# Install GitHub CLI
sudo apt install gh  # Ubuntu/Debian
brew install gh      # macOS

# Authenticate
gh auth login

# Create release
gh release create v1.0.0 \
  --repo zametkikostik/liberty-reach \
  --title "Liberty Reach v1.0.0 - Initial Release" \
  --notes "Initial release with all features" \
  --draft=false \
  --prerelease=false
```

### Option 3: Using the Script

```bash
cd /home/kostik/liberty-reach
chmod +x create-release.sh
./create-release.sh
```

## After Creating Release

1. **Wait for builds** (~10-15 minutes)
2. **Check Actions**: https://github.com/zametkikostik/liberty-reach/actions
3. **Download APK/MSI/DMG/AppImage** from release assets

## Common Issues

### "Tag name can't be blank"
→ Make sure to type `v1.0.0` in the "Tag version" field

### "Tag already exists"
→ Delete the old tag or use a different version (v1.0.1)

### "Permission denied"
→ Make sure you're the repository owner

### Build fails
→ Check Actions tab for error details

## Verify Release

After creation, your release should be at:
```
https://github.com/zametkikostik/liberty-reach/releases/tag/v1.0.0
```

Downloads will appear as assets once builds complete.

---

**Need help?** Open an issue: https://github.com/zametkikostik/liberty-reach/issues
