# 📱 Liberty Reach — Android APK Build Instructions

## ⚡ Quick Start

### Option 1: Use Pre-built APK (Recommended for Testing)

Download pre-built APK from Releases:
https://github.com/zametkikostik/liberty-reach/releases

### Option 2: Build Locally

## 🔧 Prerequisites

### Install Java 17

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install openjdk-17-jdk
java -version
```

**macOS:**
```bash
brew install openjdk@17
```

**Windows:**
Download from: https://www.oracle.com/java/technologies/downloads/#java17

### Install Android Studio (Optional but Recommended)

1. Download from: https://developer.android.com/studio
2. Install Android Studio
3. Open SDK Manager and install:
   - Android SDK Platform 34
   - Android SDK Build-Tools 34.0.0
   - Android SDK Command-line Tools

### Set Environment Variables

Add to `~/.bashrc` or `~/.zshrc`:

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

## 🏗️ Build APK

### Method 1: Using Gradle Wrapper (Recommended)

```bash
cd apps/mobile/android

# Generate Gradle wrapper (if not exists)
gradle wrapper

# Build debug APK
./gradlew assembleDebug

# Build release APK (requires signing)
./gradlew assembleRelease
```

### Method 2: Using Build Script

```bash
cd apps/mobile/android
chmod +x build-simple-apk.sh
./build-simple-apk.sh
```

### Method 3: Using Android Studio

1. Open `apps/mobile/android` in Android Studio
2. Wait for Gradle sync
3. Build → Build Bundle(s) / APK(s) → Build APK(s)

## 📦 APK Location

After successful build:

**Debug APK:**
```
apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

**Release APK:**
```
apps/mobile/android/app/build/outputs/apk/release/app-release.apk
```

## 📲 Install on Device

### Enable USB Debugging

1. Go to Settings → About Phone
2. Tap "Build Number" 7 times
3. Go to Settings → Developer Options
4. Enable "USB Debugging"

### Install via ADB

```bash
# Connect device via USB
adb devices

# Install APK
adb install apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk

# Install and start
adb install -r apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk && \
adb shell am start -n io.libertyreach.app/.MainActivity
```

### Install Directly on Device

1. Copy APK to device
2. Open file manager
3. Tap APK file
4. Allow "Install from unknown sources"
5. Install

## 🔐 Signing Release APK

### Generate Keystore

```bash
keytool -genkey -v \
  -keystore liberty-reach.keystore \
  -alias liberty-reach \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

### Configure Signing

Edit `apps/mobile/android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile file("liberty-reach.keystore")
            storePassword "your-keystore-password"
            keyAlias "liberty-reach"
            keyPassword "your-key-password"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

### Build Signed APK

```bash
./gradlew assembleRelease
```

## 🐛 Troubleshooting

### "Java not found"
```bash
# Check Java installation
java -version

# If not installed, install Java 17 (see Prerequisites)
```

### "SDK not found"
```bash
# Set ANDROID_HOME
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### "Gradle build failed"
```bash
# Clean and rebuild
./gradlew clean
./gradlew assembleDebug
```

### "Insufficient permissions"
```bash
# Make gradlew executable
chmod +x gradlew
```

## 📊 Build Configuration

### Minimum Requirements

- **Android Version**: 7.0 (API 24) or higher
- **Architecture**: arm64-v8a, armeabi-v7a, x86, x86_64
- **Storage**: 100MB minimum

### Build Options

Edit `gradle.properties`:

```properties
# Enable Hermes engine (recommended)
hermesEnabled=true

# Enable ProGuard for release
enableProguardInReleaseBuilds=true

# New Architecture (experimental)
newArchEnabled=false
```

## 🎯 Build Size Optimization

### Enable R8/ProGuard

In `build.gradle`:
```gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

### Split APKs by ABI

```gradle
splits {
    abi {
        enable true
        reset()
        include 'armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'
        universalApk true
    }
}
```

## 📈 Build Performance

### Enable Build Cache

In `gradle.properties`:
```properties
org.gradle.caching=true
org.gradle.parallel=true
org.gradle.daemon=true
```

### Use Build Scan

```bash
./gradlew assembleDebug --scan
```

## 🔍 Verify APK

### Check APK Contents

```bash
# Unzip and inspect
unzip -l app-debug.apk
```

### Check Signatures

```bash
apksigner verify --verbose app-debug.apk
```

### Check Permissions

```bash
aapt dump permissions app-debug.apk
```

## 📱 Test on Emulator

### Create Emulator

```bash
# List available images
sdkmanager --list

# Create AVD
avdmanager create avd \
  -n liberty_test \
  -k "system-images;android-34;google_apis;x86_64"
```

### Run Emulator

```bash
emulator -avd liberty_test
```

### Install on Emulator

```bash
adb install app-debug.apk
```

## 🚀 Next Steps

After building APK:

1. **Test on device/emulator**
2. **Run automated tests**: `./gradlew test`
3. **Generate release APK**
4. **Sign release APK**
5. **Upload to Google Play** or distribute directly

## 📞 Support

If you encounter issues:

1. Check `build/outputs/logs/` for build logs
2. Run with `--stacktrace` for detailed errors
3. Check Android Studio Build tab
4. Open issue on GitHub

---

**Happy Building!** 🎉
