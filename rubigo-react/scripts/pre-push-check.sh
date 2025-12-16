#!/bin/bash
# Pre-push validation script for Rubigo
# Run before pushing to main to catch common issues

set -e

echo "🔍 Running pre-push checks..."
echo ""

ERRORS=0
WARNINGS=0

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

# Check for debug statements
echo "Checking for debug statements..."
if grep -rn --include="*.ts" --include="*.tsx" -E "(console\.(log|debug|info)|debugger)" src/ 2>/dev/null; then
    echo "⚠️  WARNING: Found debug statements in source files"
    echo "   Remove console.log/debugger before pushing (unless intentional logging)"
    WARNINGS=$((WARNINGS + 1))
else
    echo "✅ No debug statements found"
fi
echo ""

# Check for test-only patterns (.only, .skip)
echo "Checking for test-only patterns..."
if grep -rn --include="*.spec.ts" --include="*.test.ts" -E "\.(only|skip)\(" e2e/ src/ 2>/dev/null; then
    echo "❌ ERROR: Found .only() or .skip() in test files"
    echo "   Remove these before pushing to avoid skipping tests"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ No .only()/.skip() patterns found"
fi
echo ""

# Check for localhost/hardcoded dev URLs
echo "Checking for localhost URLs..."
if grep -rn --include="*.ts" --include="*.tsx" -E "(localhost|127\.0\.0\.1)" src/ 2>/dev/null | grep -v "// allow-localhost" ; then
    echo "⚠️  WARNING: Found localhost URLs in source files"
    echo "   Use environment variables for URLs (add '// allow-localhost' to suppress)"
    WARNINGS=$((WARNINGS + 1))
else
    echo "✅ No localhost URLs found"
fi
echo ""

# Check for large files (> 1MB)
echo "Checking for large files (> 1MB)..."
LARGE_FILES=$(find . -type f -size +1M -not -path "./node_modules/*" -not -path "./.next/*" -not -path "./.git/*" 2>/dev/null)
if [ -n "$LARGE_FILES" ]; then
    echo "⚠️  WARNING: Found large files (> 1MB):"
    echo "$LARGE_FILES"
    echo "   Please get approval before committing large files."
    WARNINGS=$((WARNINGS + 1))
else
    echo "✅ No large files found"
fi
echo ""

# Check for .env files that shouldn't be committed
echo "Checking for .env files..."
if find . -name ".env*" -not -name ".env.example" -not -path "./node_modules/*" 2>/dev/null | grep -q .; then
    echo "⚠️  WARNING: Found .env files that may contain secrets"
    find . -name ".env*" -not -name ".env.example" -not -path "./node_modules/*" 2>/dev/null
    WARNINGS=$((WARNINGS + 1))
else
    echo "✅ No .env files found"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ All pre-push checks passed!"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  Found $WARNINGS warning(s). Review before pushing."
    exit 0
else
    echo "❌ Found $ERRORS error(s) and $WARNINGS warning(s). Please fix errors before pushing."
    exit 1
fi
