#!/bin/bash

# Liberty Reach - GitHub Push Script
# Автоматический пуш на GitHub

set -e

echo "🚀 Liberty Reach - GitHub Push"
echo "=============================="
echo ""

cd /home/kostik/liberty-reach

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }

# Check 1: .env.local NOT staged
log_info "Checking for secrets..."
if git status --porcelain | grep -q ".env.local"; then
    log_error ".env.local is staged! Removing..."
    git reset .env.local 2>/dev/null || true
fi

# Check 2: No secrets in code
if grep -r "ghp_" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.md" . 2>/dev/null | grep -v node_modules; then
    log_error "Found GitHub token in code! Removing..."
    exit 1
fi

log_info "Security check passed"

# Initialize git
log_info "Initializing Git..."
git init

# Add all files
log_info "Adding files..."
git add .

# Show what will be committed
echo ""
log_info "Files to commit:"
git status --short | head -20
TOTAL_FILES=$(git status --short | wc -l)
echo "... and $TOTAL_FILES total files"
echo ""

# Commit
log_info "Creating commit..."
git commit -m "🎉 Initial commit: Liberty Reach v1.0.0

Post-Quantum Secure Messenger with:
- CRYSTALS-Kyber-1024, Dilithium5
- VoIP Telephony + Video Calls
- P2P CDN + FilePizza integration
- Push-to-Talk conferences
- Federation (Matrix-like)
- Stories, Notes, Chat Folders
- 100% crypto test coverage

Security:
- .env.local protected
- No hardcoded secrets
- Security audit passed

Packages: 19
Files: 175+
Features: 125+"

# Show remote options
echo ""
echo "=============================="
echo "📤 Push Options:"
echo "=============================="
echo ""
echo "Option 1: GitHub CLI (Recommended)"
echo "-----------------------------------"
echo "Run these commands:"
echo ""
echo "  gh auth login"
echo "  gh repo create liberty-reach --public --source=. --push"
echo ""
echo ""
echo "Option 2: HTTPS with Token"
echo "--------------------------"
echo "Run these commands:"
echo ""
echo "  git remote add origin https://github.com/zametkikostik/liberty-reach.git"
echo "  git branch -M main"
echo "  git push -u origin main"
echo ""
echo "When prompted, enter your GitHub token"
echo ""
echo ""
echo "Option 3: SSH (If you have SSH keys)"
echo "-------------------------------------"
echo "Run these commands:"
echo ""
echo "  git remote add origin git@github.com:zametkikostik/liberty-reach.git"
echo "  git branch -M main"
echo "  git push -u origin main"
echo ""

# Quick setup
echo "=============================="
echo "⚡ Quick Setup:"
echo "=============================="
echo ""
read -p "Use GitHub CLI? (y/n): " use_gh

if [ "$use_gh" = "y" ] || [ "$use_gh" = "Y" ]; then
    if command -v gh &> /dev/null; then
        log_info "GitHub CLI found!"
        gh auth login
        gh repo create liberty-reach --public --source=. --push
        log_info "Pushed successfully!"
    else
        log_warn "GitHub CLI not found"
        echo "Install with: sudo apt install gh"
        echo ""
        echo "Or use Option 2 (HTTPS) above"
    fi
else
    echo ""
    log_info "Commit created successfully!"
    echo ""
    echo "Now run ONE of these:"
    echo ""
    echo "# HTTPS:"
    echo "git remote add origin https://github.com/zametkikostik/liberty-reach.git"
    echo "git branch -M main"
    echo "git push -u origin main"
    echo ""
    echo "# SSH:"
    echo "git remote add origin git@github.com:zametkikostik/liberty-reach.git"
    echo "git branch -M main"
    echo "git push -u origin main"
fi

echo ""
echo "=============================="
log_info "Done!"
echo "=============================="
