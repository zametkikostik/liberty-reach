# 🚀 Liberty Reach — GitHub Push Instructions

## ✅ Pre-Push Checklist

### 1. Security Files Created
- [x] `.env.local` — Your secrets (NOT committed)
- [x] `.gitignore` — Protects secrets
- [x] `.env.example` — Template for others
- [x] `SECURITY_AUDIT.md` — Security documentation

### 2. Security Check Passed
```bash
./prepare-push.sh
```
✅ All checks passed!

### 3. Files Ready
- [x] `LICENSE` — AGPL-3.0
- [x] `README.md` — Beautiful GitHub readme
- [x] `.github/workflows/ci-cd.yml` — CI/CD pipeline
- [x] `SECURITY_AUDIT.md` — Security audit report

## 📱 Build Android APK

### Option 1: Automated Script
```bash
cd apps/mobile
chmod +x build-apk.sh
./build-apk.sh release
```

APK will be at: `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`

### Option 2: Manual Build
```bash
cd apps/mobile/android
./gradlew assembleRelease
```

## 🔧 Push to GitHub

### Step 1: Initialize Git (if not done)
```bash
cd /home/kostik/liberty-reach
git init
git add .
```

### Step 2: Initial Commit
```bash
git commit -m "🎉 Initial commit: Liberty Reach v1.0.0

Features:
- Post-Quantum Cryptography (Kyber-1024, Dilithium5)
- VoIP Telephony with internal numbers
- Video Calls (WebRTC)
- P2P CDN + FilePizza integration
- Push-to-Talk conferences
- Federation (Matrix-like)
- Stories, Notes, Chat Folders
- 100% crypto test coverage

Security:
- .env.local protected
- No hardcoded secrets
- Security audit passed"
```

### Step 3: Add Remote
```bash
git remote add origin https://github.com/zametkikostik/liberty-reach.git
```

### Step 4: Push to GitHub
```bash
git branch -M main
git push -u origin main
```

## ⚠️ IMPORTANT: Before Pushing

### Verify .env.local is NOT committed
```bash
git status
```

Make sure `.env.local` is NOT in the list!

### Verify no secrets in code
```bash
# Check for JWT secrets
grep -r "JWT_SECRET=" --include="*.ts" --include="*.tsx" --include="*.js" . | grep -v ".env"

# Check for passwords
grep -r "PASSWORD=" --include="*.ts" --include="*.tsx" --include="*.js" . | grep -v ".env" | grep -v "example"
```

Should return NO results!

## 📊 After Push

### 1. Enable GitHub Actions
- Go to: https://github.com/zametkikostik/liberty-reach/actions
- Enable workflows if needed

### 2. Add Secrets to GitHub
Go to: Settings → Secrets and variables → Actions

Add these secrets:
- `JWT_SECRET`
- `FEDERATION_KEY`
- `POSTGRES_PASSWORD`
- `TURN_PASSWORD`
- `FIREBASE_API_KEY`
- `APNS_KEY_ID`
- etc. (see `.env.example`)

### 3. Create First Release
1. Go to: https://github.com/zametkikostik/liberty-reach/releases
2. Click "Create a new release"
3. Tag version: `v1.0.0`
4. Upload APK from `apps/mobile/android/app/build/outputs/apk/release/`

### 4. Protect Main Branch
1. Go to: Settings → Branches
2. Add branch protection rule for `main`
3. Enable:
   - Require pull request reviews
   - Require status checks to pass
   - Include administrators

## 🎨 Customize Repository

### Update README
Edit these sections in `README.md`:
- Download links (when releases created)
- Contact information
- Website URLs

### Add Badges
Add to README.md:
```markdown
[![License](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)
[![CI/CD](https://github.com/zametkikostik/liberty-reach/actions/workflows/ci-cd.yml/badge.svg)](actions)
[![Release](https://img.shields.io/github/v/release/zametkikostik/liberty-reach)](releases)
```

### Add Screenshots
Create `docs/` folder and add:
- `banner.png` — Repository banner
- `screenshot-android.png` — Android app screenshot
- `screenshot-desktop.png` — Desktop app screenshot

## 🔒 Security Reminders

1. **NEVER commit `.env.local`**
2. **Rotate secrets regularly**
3. **Review PRs for hardcoded secrets**
4. **Run `./prepare-push.sh` before every push**
5. **Enable branch protection**

## 📞 Support

If you have issues:
- Check `SECURITY_AUDIT.md`
- Review `DEVELOPER_GUIDE.md`
- Open an issue on GitHub

---

**Ready to push!** 🚀

```bash
# Final check
./prepare-push.sh

# Then push
git add .
git commit -m "🎉 Initial commit: Liberty Reach"
git push -u origin main
```
