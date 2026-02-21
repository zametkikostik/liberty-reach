#!/bin/bash

# Liberty Reach - Prepare for GitHub Push
# This script ensures security before pushing to GitHub

set -e

echo "🔒 Liberty Reach - Security Check Before Push"
echo "=============================================="
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }

# Check 1: .env.local exists
check_env_local() {
    if [ -f ".env.local" ]; then
        log_info ".env.local exists"
    else
        log_error ".env.local not found! Create it first."
        exit 1
    fi
}

# Check 2: .env.local in .gitignore
check_gitignore() {
    if grep -q "\.env\.local" .gitignore; then
        log_info ".env.local is in .gitignore"
    else
        log_error ".env.local NOT in .gitignore! Adding now..."
        echo ".env.local" >> .gitignore
    fi
}

# Check 3: No secrets in source code
check_secrets() {
    log_info "Scanning for hardcoded secrets..."
    
    SECRETS_FOUND=0
    
    # Check for common secret patterns
    if grep -r "JWT_SECRET=" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.go" . 2>/dev/null | grep -v ".env" | grep -v "node_modules"; then
        log_error "Found JWT_SECRET in source code!"
        SECRETS_FOUND=1
    fi
    
    if grep -r "PASSWORD=" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.go" . 2>/dev/null | grep -v ".env" | grep -v "node_modules" | grep -v "example"; then
        log_warn "Found potential PASSWORD in source code. Please review."
    fi
    
    if [ $SECRETS_FOUND -eq 1 ]; then
        log_error "Secrets found in source code! Fix before pushing."
        exit 1
    fi
    
    log_info "No hardcoded secrets found"
}

# Check 4: Security audit file exists
check_security_audit() {
    if [ -f "SECURITY_AUDIT.md" ]; then
        log_info "SECURITY_AUDIT.md exists"
    else
        log_warn "SECURITY_AUDIT.md not found. Consider creating one."
    fi
}

# Check 5: .gitignore exists
check_gitignore_exists() {
    if [ -f ".gitignore" ]; then
        log_info ".gitignore exists"
    else
        log_error ".gitignore not found!"
        exit 1
    fi
}

# Check 6: README exists
check_readme() {
    if [ -f "README.md" ]; then
        log_info "README.md exists"
    else
        log_warn "README.md not found"
    fi
}

# Check 7: License exists
check_license() {
    if [ -f "LICENSE" ] || grep -q "LICENSE" README.md 2>/dev/null; then
        log_info "LICENSE referenced"
    else
        log_warn "LICENSE file not found"
    fi
}

# Main checks
main() {
    check_env_local
    check_gitignore_exists
    check_gitignore
    check_secrets
    check_security_audit
    check_readme
    check_license
    
    echo ""
    echo "=============================================="
    log_info "All security checks passed!"
    echo ""
    echo "Ready to push to GitHub:"
    echo "  git add ."
    echo "  git commit -m 'Initial commit: Liberty Reach'"
    echo "  git remote add origin https://github.com/zametkikostik/liberty-reach.git"
    echo "  git push -u origin main"
    echo ""
    echo "⚠️  IMPORTANT: Make sure .env.local is NOT committed!"
    echo ""
}

main
