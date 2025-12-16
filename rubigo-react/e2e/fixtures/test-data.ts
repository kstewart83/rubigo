/**
 * Test Data Loader
 * 
 * Load and parse TOML seed data for E2E test verification
 */

import { parse } from "@iarna/toml";
import { readFileSync } from "fs";
import { join } from "path";

export interface TestData {
    solutions: Array<{
        id: string;
        name: string;
        description?: string;
        status?: string;
    }>;
    products: Array<{
        id: string;
        solution_id: string;
        version?: string;
        release_type?: string;
    }>;
    services: Array<{
        id: string;
        solution_id: string;
        service_level?: string;
    }>;
    projects: Array<{
        id: string;
        name: string;
        description?: string;
        solution_id?: string;
        status?: string;
    }>;
    objectives: Array<{
        id: string;
        title: string;
        description?: string;
        project_id?: string;
        parent_id?: string;
        status?: string;
    }>;
    features: Array<{
        id: string;
        name: string;
        description?: string;
        objective_id?: string;
        status?: string;
    }>;
    rules: Array<{
        id: string;
        feature_id: string;
        role: string;
        requirement: string;
        reason: string;
        status?: string;
    }>;
    scenarios: Array<{
        id: string;
        rule_id: string;
        name: string;
        narrative: string;
        status?: string;
    }>;
    specifications: Array<{
        id: string;
        feature_id: string;
        name: string;
        narrative: string;
        category: string;
        status?: string;
    }>;
    metrics: Array<{
        id: string;
        name: string;
        unit: string;
    }>;
    kpis: Array<{
        id: string;
        name: string;
        metric_id: string;
        objective_id?: string;
    }>;
    initiatives: Array<{
        id: string;
        name: string;
        kpi_id?: string;
    }>;
    activities: Array<{
        id: string;
        name: string;
        initiative_id?: string;
    }>;
    roles: Array<{
        id: string;
        name: string;
    }>;
    assignments: Array<{
        id: string;
        activity_id: string;
        role_id: string;
        quantity: number;
    }>;
    allocations: Array<{
        id: string;
        assignment_id: string;
        person_id: string;
        quantity_contributed: number;
    }>;
}

/**
 * Load test data from TOML file
 */
export function loadTestData(): TestData {
    const dataPath = join(process.cwd(), "src/data/projects.toml");
    const content = readFileSync(dataPath, "utf-8");
    const raw = parse(content) as unknown as TestData;
    return raw;
}

/**
 * Get expected entity counts for verification
 */
export function getExpectedCounts(data: TestData) {
    return {
        solutions: data.solutions?.length ?? 0,
        products: data.products?.length ?? 0,
        services: data.services?.length ?? 0,
        projects: data.projects?.length ?? 0,
        objectives: data.objectives?.length ?? 0,
        features: data.features?.length ?? 0,
        rules: data.rules?.length ?? 0,
        scenarios: data.scenarios?.length ?? 0,
        specifications: data.specifications?.length ?? 0,
        metrics: data.metrics?.length ?? 0,
        kpis: data.kpis?.length ?? 0,
        initiatives: data.initiatives?.length ?? 0,
        activities: data.activities?.length ?? 0,
        roles: data.roles?.length ?? 0,
        assignments: data.assignments?.length ?? 0,
        allocations: data.allocations?.length ?? 0,
    };
}
