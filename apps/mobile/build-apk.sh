#!/bin/bash

# Liberty Reach Android APK Build Script
# Usage: ./build-apk.sh [debug|release]

set -e

echo "🚀 Liberty Reach APK Builder"
echo "============================"

# Configuration
BUILD_TYPE=${1:-release}
APP_NAME="LibertyReach"
OUTPUT_DIR="./android/app/build/outputs/apk"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    # Check Java
    if ! command -v java &> /dev/null; then
        log_error "Java is not installed"
        exit 1
    fi
    
    # Check Android SDK
    if [ -z "$ANDROID_HOME" ]; then
        log_warn "ANDROID_HOME not set, using default"
        export ANDROID_HOME=$HOME/Android/Sdk
    fi
    
    log_info "Prerequisites check passed"
}

# Install dependencies
install_deps() {
    log_info "Installing dependencies..."
    npm install
    cd android && ./gradlew dependencies && cd ..
}

# Generate keystore (if not exists)
generate_keystore() {
    if [ "$BUILD_TYPE" = "release" ]; then
        KEYSTORE_PATH="./android/keystore/liberty-reach-release.keystore"
        
        if [ ! -f "$KEYSTORE_PATH" ]; then
            log_warn "Keystore not found. Generating new one..."
            mkdir -p ./android/keystore
            
            # Generate keystore (in production, use secure passwords)
            keytool -genkey -v \
                -keystore "$KEYSTORE_PATH" \
                -alias liberty-reach \
                -keyalg RSA \
                -keysize 2048 \
                -validity 10000 \
                -storepass liberty123 \
                -keypass liberty123 \
                -dname "CN=Liberty Reach, OU=Development, O=Liberty Reach, L=Unknown, ST=Unknown, C=US"
            
            log_info "Keystore generated at $KEYSTORE_PATH"
            log_warn "IMPORTANT: Backup your keystore and passwords!"
        fi
    fi
}

# Build APK
build_apk() {
    log_info "Building $BUILD_TYPE APK..."
    
    cd android
    
    if [ "$BUILD_TYPE" = "debug" ]; then
        ./gradlew assembleDebug
        APK_PATH="$OUTPUT_DIR/debug/app-debug.apk"
    else
        ./gradlew assembleRelease
        APK_PATH="$OUTPUT_DIR/release/app-release.apk"
    fi
    
    cd ..
    
    if [ -f "$APK_PATH" ]; then
        log_info "APK built successfully!"
        echo "📦 APK location: $APK_PATH"
        echo "📦 APK size: $(du -h "$APK_PATH" | cut -f1)"
    else
        log_error "APK build failed!"
        exit 1
    fi
}

# Run security scan
security_scan() {
    log_info "Running security scan..."
    
    # Check for hardcoded secrets
    if grep -r "JWT_SECRET=" --include="*.ts" --include="*.tsx" --include="*.js" src/ 2>/dev/null; then
        log_error "Found hardcoded JWT_SECRET in source code!"
        exit 1
    fi
    
    if grep -r "API_KEY=" --include="*.ts" --include="*.tsx" --include="*.js" src/ 2>/dev/null; then
        log_warn "Found potential API_KEY in source code. Please review."
    fi
    
    # Check permissions
    log_info "Checking Android permissions..."
    if [ -f "android/app/src/main/AndroidManifest.xml" ]; then
        DANGEROUS_PERMISSIONS=(
            "android.permission.READ_SMS"
            "android.permission.WRITE_SMS"
            "android.permission.READ_CALL_LOG"
            "android.permission.WRITE_CALL_LOG"
        )
        
        for perm in "${DANGEROUS_PERMISSIONS[@]}"; do
            if grep -q "$perm" android/app/src/main/AndroidManifest.xml; then
                log_warn "Dangerous permission found: $perm"
            fi
        done
    fi
    
    log_info "Security scan completed"
}

# Main
main() {
    echo ""
    log_info "Build type: $BUILD_TYPE"
    echo ""
    
    check_prerequisites
    install_deps
    generate_keystore
    build_apk
    security_scan
    
    echo ""
    echo "============================"
    log_info "Build completed!"
    echo ""
    echo "To install on device:"
    echo "  adb install $APK_PATH"
    echo ""
    echo "To test:"
    echo "  npm run test"
    echo ""
}

# Run
main
