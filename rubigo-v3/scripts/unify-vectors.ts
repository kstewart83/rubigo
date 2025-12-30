#!/usr/bin/env bun
/**
 * Unified Test Vector Generator
 * 
 * Converts:
 * - YAML vectors (hand-written) from specifications
 * - ITF traces (quint-generated) from model checker
 * 
 * Into a unified JSON format for parity testing.
 */

import { parse as parseYaml } from 'yaml';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, basename } from 'path';

// Types
interface Context {
    checked: boolean;
    disabled: boolean;
    readOnly: boolean;
    focused: boolean;
}

interface YamlVector {
    scenario: string;
    given: {
        context: Context;
        state: string;
    };
    when: string;
    then: {
        context: Context;
        state: string;
    };
}

interface Step {
    event: string;
    before: { context: Context; state: string };
    after: { context: Context; state: string };
}

interface Scenario {
    name: string;
    source: 'yaml' | 'itf';
    steps: Step[];
}

interface UnifiedVectors {
    component: string;
    generated: string;
    sources: { yaml: number; itf: number };
    scenarios: Scenario[];
}

// Parse YAML test vectors
function parseYamlVectors(yamlPath: string): Scenario[] {
    if (!existsSync(yamlPath)) {
        console.log(`  No YAML vectors at ${yamlPath}`);
        return [];
    }

    const content = readFileSync(yamlPath, 'utf-8');
    // Remove comment lines and parse
    const cleanContent = content
        .split('\n')
        .filter(line => !line.trim().startsWith('#'))
        .join('\n');

    const vectors: YamlVector[] = parseYaml(cleanContent) || [];

    return vectors.map(v => ({
        name: v.scenario,
        source: 'yaml' as const,
        steps: [{
            event: v.when,
            before: { context: v.given.context, state: v.given.state },
            after: { context: v.then.context, state: v.then.state }
        }]
    }));
}

// Parse ITF traces from Quint
function parseItfTraces(itfPath: string): Scenario[] {
    if (!existsSync(itfPath)) {
        console.log(`  No ITF traces at ${itfPath}`);
        return [];
    }

    const content = readFileSync(itfPath, 'utf-8');
    const itf = JSON.parse(content);

    if (!itf.states || itf.states.length < 2) {
        return [];
    }

    // Convert ITF states to steps
    const steps: Step[] = [];
    for (let i = 1; i < itf.states.length; i++) {
        const before = itf.states[i - 1];
        const after = itf.states[i];

        // Infer event from state change
        let event = 'UNKNOWN';
        if (before.checked !== after.checked) {
            event = 'TOGGLE';
        } else if (before.state !== after.state) {
            event = before.state === 'idle' ? 'FOCUS' : 'BLUR';
        }

        steps.push({
            event,
            before: {
                context: {
                    checked: before.checked,
                    disabled: before.disabled,
                    readOnly: before.readOnly,
                    focused: before.focused
                },
                state: before.state
            },
            after: {
                context: {
                    checked: after.checked,
                    disabled: after.disabled,
                    readOnly: after.readOnly,
                    focused: after.focused
                },
                state: after.state
            }
        });
    }

    return [{
        name: `itf-trace-${Date.now()}`,
        source: 'itf' as const,
        steps
    }];
}

// Main
function main() {
    const generatedDir = join(process.cwd(), 'generated');
    const vectorsDir = join(generatedDir, 'test-vectors');

    // Find all YAML vector files
    const yamlFiles = existsSync(vectorsDir)
        ? readdirSync(vectorsDir).filter(f => f.endsWith('.vectors.yaml'))
        : [];

    for (const yamlFile of yamlFiles) {
        const componentName = basename(yamlFile, '.vectors.yaml');
        console.log(`Processing ${componentName}...`);

        const yamlPath = join(vectorsDir, yamlFile);
        const itfPath = join(vectorsDir, `${componentName}.itf.json`);
        const outputPath = join(vectorsDir, `${componentName}.unified.json`);

        const yamlScenarios = parseYamlVectors(yamlPath);
        const itfScenarios = parseItfTraces(itfPath);

        const unified: UnifiedVectors = {
            component: componentName,
            generated: new Date().toISOString(),
            sources: {
                yaml: yamlScenarios.length,
                itf: itfScenarios.length
            },
            scenarios: [...yamlScenarios, ...itfScenarios]
        };

        writeFileSync(outputPath, JSON.stringify(unified, null, 2));
        console.log(`  Generated ${outputPath}`);
        console.log(`  Scenarios: ${yamlScenarios.length} YAML + ${itfScenarios.length} ITF = ${unified.scenarios.length} total`);
    }
}

main();
