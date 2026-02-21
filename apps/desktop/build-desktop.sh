#!/bin/bash

# Liberty Reach - Desktop App Builder
# Builds Windows MSI, macOS DMG, and Linux AppImage

set -e

echo "🚀 Liberty Reach Desktop Builder"
echo "================================"
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

# Check prerequisites
check_prereqs() {
    log_info "Checking prerequisites..."
    
    # Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    log_info "Node.js: $(node -v)"
    
    # npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    log_info "npm: $(npm -v)"
    
    # Rust
    if ! command -v cargo &> /dev/null; then
        log_error "Rust/Cargo is not installed"
        exit 1
    fi
    log_info "Rust: $(cargo --version)"
    
    log_info "Prerequisites check passed"
}

# Install dependencies
install_deps() {
    log_info "Installing dependencies..."
    npm install --legacy-peer-deps
}

# Build for current platform
build() {
    log_info "Building for current platform..."
    
    cd apps/desktop
    
    # Build frontend
    npm run build
    
    # Build Tauri app
    npm run tauri build
    
    cd ../..
    
    log_info "Build completed!"
    
    # Show output location
    echo ""
    echo "📦 Build outputs:"
    echo "================"
    
    if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        echo "Windows MSI: apps/desktop/src-tauri/target/release/bundle/msi/*.msi"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macOS DMG: apps/desktop/src-tauri/target/release/bundle/dmg/*.dmg"
    else
        echo "Linux AppImage: apps/desktop/src-tauri/target/release/bundle/appimage/*.AppImage"
    fi
    
    echo ""
}

# Main
main() {
    echo ""
    log_info "Build target: $(uname -s)"
    echo ""
    
    check_prereqs
    install_deps
    build
    
    echo "=============================="
    log_info "Build completed!"
    echo ""
    echo "Next steps:"
    echo "1. Test the application"
    echo "2. Sign the binary (for production)"
    echo "3. Create GitHub release"
    echo ""
}

main
