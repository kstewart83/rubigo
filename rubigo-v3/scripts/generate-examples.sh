#!/usr/bin/env bash
# Extract Example Usages from specs and generate TypeScript example files
set -euo pipefail

cd "$(dirname "$0")/.."

# Output to gallery src for proper module resolution
OUTPUT_DIR="gallery/frontend/src/generated-examples"
mkdir -p "$OUTPUT_DIR"

echo "📦 Generating example files from specs..."

# Component to import path mapping
declare -A COMPONENT_IMPORTS
COMPONENT_IMPORTS["button"]="import { Button } from '@rubigo/components/button';"
COMPONENT_IMPORTS["checkbox"]="import { Checkbox } from '@rubigo/components/checkbox';"
COMPONENT_IMPORTS["switch"]="import { Switch } from '@rubigo/components/switch';"
COMPONENT_IMPORTS["input"]="import { Input } from '@rubigo/components/input';"
COMPONENT_IMPORTS["tabs"]="import { Tabs } from '@rubigo/components/tabs';"
COMPONENT_IMPORTS["slider"]="import { Slider } from '@rubigo/components/slider';"
COMPONENT_IMPORTS["collapsible"]="import { Collapsible } from '@rubigo/components/collapsible';"
COMPONENT_IMPORTS["togglegroup"]="import { ToggleGroup } from '@rubigo/components/togglegroup';"
COMPONENT_IMPORTS["tooltip"]="import { Tooltip } from '@rubigo/components/tooltip';
import { Button } from '@rubigo/components/button';"
COMPONENT_IMPORTS["dialog"]="import { Dialog } from '@rubigo/components/dialog';
import { Button } from '@rubigo/components/button';"
COMPONENT_IMPORTS["select"]="import { Select } from '@rubigo/components/select';"

count=0
for spec in specifications/*/*.sudo.md; do
    [ -f "$spec" ] || continue
    name=$(basename "$spec" .sudo.md)
    
    # Skip template and non-component specs
    if [ "$name" = "TEMPLATE" ] || [ "$name" = "statechart" ]; then
        continue
    fi
    
    # Extract Example Usages section
    examples_section=$(awk '/^## Example Usages$/,/^## [^E]|^---$/' "$spec" 2>/dev/null || true)
    
    if [ -z "$examples_section" ]; then
        continue
    fi
    
    # Check if there are any tsx example blocks
    if ! echo "$examples_section" | grep -q '```tsx example='; then
        continue
    fi
    
    # Get component import
    imports="${COMPONENT_IMPORTS[$name]:-}"
    if [ -z "$imports" ]; then
        echo "  ⚠️  No import mapping for $name, skipping"
        continue
    fi
    
    # Start building the output file
    output="$OUTPUT_DIR/${name}.examples.tsx"
    
    cat > "$output" << HEADER
/**
 * ${name^} Component Examples
 * AUTO-GENERATED from specifications/primitives/${name}.sudo.md
 * DO NOT EDIT MANUALLY
 */
import { Component } from 'solid-js';
${imports}

export interface Example {
    name: string;
    description: string;
    component: Component;
    source: string;
}

HEADER

    # Extract each example block and store sources
    example_names=()
    declare -A example_sources
    
    while IFS= read -r line; do
        if [[ $line =~ \`\`\`tsx\ example=\"([^\"]+)\" ]]; then
            example_name="${BASH_REMATCH[1]}"
            example_names+=("$example_name")
            
            # Capitalize first letter for component name
            component_name="${example_name^}Example"
            
            # Read until closing ```
            tsx_content=""
            while IFS= read -r tsx_line; do
                if [[ $tsx_line == '```' ]]; then
                    break
                fi
                tsx_content+="$tsx_line"$'\n'
            done
            
            # Store source for later
            example_sources["$example_name"]="$tsx_content"
            
            # Write the component
            cat >> "$output" << COMPONENT
const ${component_name}: Component = () => (
${tsx_content});

COMPONENT
        fi
    done < <(echo "$examples_section")
    
    # Build the examples array with sources
    echo "export const ${name}Examples: Example[] = [" >> "$output"
    for ex_name in "${example_names[@]}"; do
        component_name="${ex_name^}Example"
        # Escape the source for JS string (backticks, backslashes, ${})
        source_content="${example_sources[$ex_name]}"
        # Remove trailing newline for cleaner output
        source_content="${source_content%$'\n'}"
        # Escape backticks and ${ for template literal
        source_escaped=$(echo "$source_content" | sed 's/\\/\\\\/g' | sed 's/`/\\`/g' | sed 's/\${/\\${/g')
        cat >> "$output" << ENTRY
    {
        name: '${ex_name}',
        description: '${ex_name} example',
        component: ${component_name},
        source: \`${source_escaped}\`,
    },
ENTRY
    done
    echo "];" >> "$output"
    
    echo "  ✅ ${OUTPUT_DIR}/${name}.examples.tsx"
    ((count++)) || true
done

echo "📦 Generated $count example files"
