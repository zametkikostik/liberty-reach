#!/bin/bash

# Liberty Reach - Simple APK Builder
# This script creates a debug APK for testing

set -e

echo "🚀 Liberty Reach APK Builder"
echo "============================"
echo ""

cd "$(dirname "$0")"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }

# Check if Gradle wrapper exists
if [ ! -f "gradlew" ]; then
    log_warn "Gradle wrapper not found. Creating..."
    
    # Create minimal gradle wrapper
    mkdir -p gradle/wrapper
    
    cat > gradle/wrapper/gradle-wrapper.properties << EOF
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.2.1-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
EOF

fi

# Check for Java
if ! command -v java &> /dev/null; then
    log_error "Java is not installed. Please install Java 17 or higher."
    exit 1
fi

log_info "Java version:"
java -version 2>&1 | head -1

# Create debug keystore if not exists
if [ ! -f "app/debug.keystore" ]; then
    log_info "Creating debug keystore..."
    keytool -genkey -v \
        -keystore app/debug.keystore \
        -storepass android \
        -alias androiddebugkey \
        -keypass android \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -dname "CN=Android Debug,O=Android,C=US" 2>/dev/null
fi

# Build APK
log_info "Building debug APK..."

if command -v ./gradlew &> /dev/null; then
    ./gradlew assembleDebug
else
    # Try system gradle
    if command -v gradle &> /dev/null; then
        gradle assembleDebug
    else
        log_error "Gradle not found. Please install Gradle or use gradlew."
        exit 1
    fi
fi

# Check if APK was built
APK_PATH="app/build/outputs/apk/debug/app-debug.apk"

if [ -f "$APK_PATH" ]; then
    echo ""
    log_info "APK built successfully!"
    echo ""
    echo "📦 APK location: $APK_PATH"
    echo "📦 APK size: $(du -h "$APK_PATH" | cut -f1)"
    echo ""
    echo "To install on device:"
    echo "  adb install $APK_PATH"
    echo ""
    echo "To install and start:"
    echo "  adb install $APK_PATH && adb shell am start -n io.libertyreach.app/.MainActivity"
    echo ""
else
    log_error "APK build failed!"
    exit 1
fi
