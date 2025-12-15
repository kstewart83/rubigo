#!/bin/bash
# Pre-push validation script for Rubigo
# Run before pushing to main to catch common issues

set -e

echo "🔍 Running pre-push checks..."
echo ""

ERRORS=0

# Check for local/absolute paths
echo "Checking for local paths..."
if grep -rn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" \
    -E "(/Users/|/home/|C:\\\\|D:\\\\)" src/ 2>/dev/null; then
    echo "❌ ERROR: Found local/absolute paths in source files"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ No local paths found"
fi
echo ""

# Check for common secret patterns
echo "Checking for potential secrets..."
if grep -rn --include="*.ts" --include="*.tsx" --include="*.js" \
    -iE "(api_key|apikey|secret_key|secretkey|password|passwd|private_key|auth_token|bearer)\s*[:=]\s*['\"][^'\"]+['\"]" src/ 2>/dev/null; then
    echo "❌ ERROR: Found potential secrets in source files"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ No obvious secrets found"
fi
echo ""

# Check for large files (> 1MB)
echo "Checking for large files (> 1MB)..."
LARGE_FILES=$(find . -type f -size +1M -not -path "./node_modules/*" -not -path "./.next/*" -not -path "./.git/*" 2>/dev/null)
if [ -n "$LARGE_FILES" ]; then
    echo "⚠️  WARNING: Found large files (> 1MB):"
    echo "$LARGE_FILES"
    echo "   Please get approval before committing large files."
    ERRORS=$((ERRORS + 1))
else
    echo "✅ No large files found"
fi
echo ""

# Check for .env files that shouldn't be committed
echo "Checking for .env files..."
if find . -name ".env*" -not -name ".env.example" -not -path "./node_modules/*" 2>/dev/null | grep -q .; then
    echo "⚠️  WARNING: Found .env files that may contain secrets"
    find . -name ".env*" -not -name ".env.example" -not -path "./node_modules/*" 2>/dev/null
    ERRORS=$((ERRORS + 1))
else
    echo "✅ No .env files found"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
    echo "✅ All pre-push checks passed!"
    exit 0
else
    echo "❌ Found $ERRORS issue(s). Please fix before pushing."
    exit 1
fi
