#!/usr/bin/env bash
# Validate TypeScript Component API blocks from specs
set -euo pipefail

# cd to project root (parent of scripts/)
cd "$(dirname "$0")/.."

echo "🔍 Validating specs..."

# Create temp dir for TypeScript validation
ts_dir=$(mktemp -d)
trap "rm -rf $ts_dir" EXIT

# Create common types file
cat > "$ts_dir/common.d.ts" << 'TYPES'
// Common types for Component API validation
type Slot = unknown;  // Framework-agnostic slot type
TYPES

# Extract TypeScript blocks from specs
count=0
for spec in specifications/*/*.sudo.md; do
    [ -f "$spec" ] || continue
    name=$(basename "$spec" .sudo.md)
    
    # Extract TypeScript code block from Component API section
    awk '
    /^## Component API$/{in_api=1; next}
    in_api && /^## /{in_api=0}
    in_api && /^```typescript$/{in_ts=1; next}
    in_api && in_ts && /^```$/{in_ts=0; next}
    in_api && in_ts {print}
    ' "$spec" > "$ts_dir/$name.ts"
    
    # Only validate if we extracted content
    if [ -s "$ts_dir/$name.ts" ]; then
        echo "  ✓ Extracted $name.ts"
        ((count++)) || true
    fi
done

if [ "$count" -eq 0 ]; then
    echo "⚠️  No TypeScript blocks found"
    exit 0
fi

# Run TypeScript validation
echo "🔧 Running tsc validation on $count files..."
if npx -y --package typescript tsc --noEmit --strict "$ts_dir"/*.ts 2>&1; then
    echo "✅ All TypeScript interfaces valid"
else
    echo "❌ TypeScript validation failed"
    exit 1
fi

echo "✅ All specs valid"
