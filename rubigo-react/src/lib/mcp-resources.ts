/**
 * MCP Resources
 * 
 * Resource definitions for all Rubigo ontology entities.
 * Resources provide read-only access to data.
 */

import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import type { ResourceTemplate, ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";

// ============================================================================
// Resource Templates (for listing available resources)
// ============================================================================

export const resourceTemplates: ResourceTemplate[] = [
    // Personnel
    {
        uriTemplate: "rubigo://personnel",
        name: "Personnel Directory",
        description: "All personnel records in the Rubigo system",
        mimeType: "application/json",
    },
    {
        uriTemplate: "rubigo://personnel/{id}",
        name: "Personnel Record",
        description: "A single personnel record by ID",
        mimeType: "application/json",
    },
    // Projects
    {
        uriTemplate: "rubigo://projects",
        name: "Projects",
        description: "All projects in the system",
        mimeType: "application/json",
    },
    {
        uriTemplate: "rubigo://projects/{id}",
        name: "Project",
        description: "A single project by ID",
        mimeType: "application/json",
    },
    // Solutions
    {
        uriTemplate: "rubigo://solutions",
        name: "Solutions",
        description: "All solutions (products and services) in the catalog",
        mimeType: "application/json",
    },
    // Objectives
    {
        uriTemplate: "rubigo://objectives",
        name: "Objectives",
        description: "All strategic objectives in hierarchy",
        mimeType: "application/json",
    },
    // Features
    {
        uriTemplate: "rubigo://features",
        name: "Features",
        description: "All feature definitions",
        mimeType: "application/json",
    },
    // Rules
    {
        uriTemplate: "rubigo://rules",
        name: "Rules (User Stories)",
        description: "All rules/user stories linked to features",
        mimeType: "application/json",
    },
    // Scenarios
    {
        uriTemplate: "rubigo://scenarios",
        name: "Scenarios",
        description: "All test scenarios linked to rules",
        mimeType: "application/json",
    },
    // Activities
    {
        uriTemplate: "rubigo://activities",
        name: "Activities",
        description: "All work activities",
        mimeType: "application/json",
    },
    // Initiatives
    {
        uriTemplate: "rubigo://initiatives",
        name: "Initiatives",
        description: "All strategic initiatives",
        mimeType: "application/json",
    },
    // Metrics
    {
        uriTemplate: "rubigo://metrics",
        name: "Metrics",
        description: "All operational metrics",
        mimeType: "application/json",
    },
    // KPIs
    {
        uriTemplate: "rubigo://kpis",
        name: "KPIs",
        description: "All key performance indicators",
        mimeType: "application/json",
    },
    // Roles
    {
        uriTemplate: "rubigo://roles",
        name: "Roles",
        description: "All job roles",
        mimeType: "application/json",
    },
    // Products
    {
        uriTemplate: "rubigo://products",
        name: "Products",
        description: "All products in the catalog",
        mimeType: "application/json",
    },
    // Services
    {
        uriTemplate: "rubigo://services",
        name: "Services",
        description: "All services in the catalog",
        mimeType: "application/json",
    },
    // Releases
    {
        uriTemplate: "rubigo://releases",
        name: "Releases",
        description: "All product releases",
        mimeType: "application/json",
    },
    // Assignments
    {
        uriTemplate: "rubigo://assignments",
        name: "Assignments",
        description: "All resource assignments",
        mimeType: "application/json",
    },
    // Allocations
    {
        uriTemplate: "rubigo://allocations",
        name: "Allocations",
        description: "All resource allocations",
        mimeType: "application/json",
    },
    // Specifications
    {
        uriTemplate: "rubigo://specifications",
        name: "Specifications",
        description: "All non-functional requirements",
        mimeType: "application/json",
    },
];

// ============================================================================
// Resource Handlers
// ============================================================================

type ResourceHandler = () => Promise<ReadResourceResult>;
type ParameterizedResourceHandler = (id: string) => Promise<ReadResourceResult>;

// Personnel
async function getPersonnelList(): Promise<ReadResourceResult> {
    const data = await db.select().from(schema.personnel);
    return {
        contents: [{
            uri: "rubigo://personnel",
            mimeType: "application/json",
            text: JSON.stringify(data, null, 2),
        }],
    };
}

async function getPersonnelById(id: string): Promise<ReadResourceResult> {
    const data = await db.select().from(schema.personnel).where(eq(schema.personnel.id, id));
    if (data.length === 0) {
        throw new Error(`Personnel not found: ${id}`);
    }
    return {
        contents: [{
            uri: `rubigo://personnel/${id}`,
            mimeType: "application/json",
            text: JSON.stringify(data[0], null, 2),
        }],
    };
}

// Projects
async function getProjectsList(): Promise<ReadResourceResult> {
    const data = await db.select().from(schema.projects);
    return {
        contents: [{
            uri: "rubigo://projects",
            mimeType: "application/json",
            text: JSON.stringify(data, null, 2),
        }],
    };
}

async function getProjectById(id: string): Promise<ReadResourceResult> {
    const data = await db.select().from(schema.projects).where(eq(schema.projects.id, id));
    if (data.length === 0) {
        throw new Error(`Project not found: ${id}`);
    }
    return {
        contents: [{
            uri: `rubigo://projects/${id}`,
            mimeType: "application/json",
            text: JSON.stringify(data[0], null, 2),
        }],
    };
}

// Generic list handlers for other entities
async function getSolutionsList(): Promise<ReadResourceResult> {
    const data = await db.select().from(schema.solutions);
    return {
        contents: [{
            uri: "rubigo://solutions",
            mimeType: "application/json",
            text: JSON.stringify(data, null, 2),
        }],
    };
}

async function getObjectivesList(): Promise<ReadResourceResult> {
    const data = await db.select().from(schema.objectives);
    return {
        contents: [{
            uri: "rubigo://objectives",
            mimeType: "application/json",
            text: JSON.stringify(data, null, 2),
        }],
    };
}

async function getFeaturesList(): Promise<ReadResourceResult> {
    const data = await db.select().from(schema.features);
    return {
        contents: [{
            uri: "rubigo://features",
            mimeType: "application/json",
            text: JSON.stringify(data, null, 2),
        }],
    };
}

async function getRulesList(): Promise<ReadResourceResult> {
    const data = await db.select().from(schema.rules);
    return {
        contents: [{
            uri: "rubigo://rules",
            mimeType: "application/json",
            text: JSON.stringify(data, null, 2),
        }],
    };
}

async function getScenariosList(): Promise<ReadResourceResult> {
    const data = await db.select().from(schema.scenarios);
    return {
        contents: [{
            uri: "rubigo://scenarios",
            mimeType: "application/json",
            text: JSON.stringify(data, null, 2),
        }],
    };
}

async function getActivitiesList(): Promise<ReadResourceResult> {
    const data = await db.select().from(schema.activities);
    return {
        contents: [{
            uri: "rubigo://activities",
            mimeType: "application/json",
            text: JSON.stringify(data, null, 2),
        }],
    };
}

async function getInitiativesList(): Promise<ReadResourceResult> {
    const data = await db.select().from(schema.initiatives);
    return {
        contents: [{
            uri: "rubigo://initiatives",
            mimeType: "application/json",
            text: JSON.stringify(data, null, 2),
        }],
    };
}

async function getMetricsList(): Promise<ReadResourceResult> {
    const data = await db.select().from(schema.metrics);
    return {
        contents: [{
            uri: "rubigo://metrics",
            mimeType: "application/json",
            text: JSON.stringify(data, null, 2),
        }],
    };
}

async function getKpisList(): Promise<ReadResourceResult> {
    const data = await db.select().from(schema.kpis);
    return {
        contents: [{
            uri: "rubigo://kpis",
            mimeType: "application/json",
            text: JSON.stringify(data, null, 2),
        }],
    };
}

async function getRolesList(): Promise<ReadResourceResult> {
    const data = await db.select().from(schema.roles);
    return {
        contents: [{
            uri: "rubigo://roles",
            mimeType: "application/json",
            text: JSON.stringify(data, null, 2),
        }],
    };
}

async function getProductsList(): Promise<ReadResourceResult> {
    const data = await db.select().from(schema.products);
    return {
        contents: [{
            uri: "rubigo://products",
            mimeType: "application/json",
            text: JSON.stringify(data, null, 2),
        }],
    };
}

async function getServicesList(): Promise<ReadResourceResult> {
    const data = await db.select().from(schema.services);
    return {
        contents: [{
            uri: "rubigo://services",
            mimeType: "application/json",
            text: JSON.stringify(data, null, 2),
        }],
    };
}

async function getReleasesList(): Promise<ReadResourceResult> {
    const data = await db.select().from(schema.releases);
    return {
        contents: [{
            uri: "rubigo://releases",
            mimeType: "application/json",
            text: JSON.stringify(data, null, 2),
        }],
    };
}

async function getAssignmentsList(): Promise<ReadResourceResult> {
    const data = await db.select().from(schema.assignments);
    return {
        contents: [{
            uri: "rubigo://assignments",
            mimeType: "application/json",
            text: JSON.stringify(data, null, 2),
        }],
    };
}

async function getAllocationsList(): Promise<ReadResourceResult> {
    const data = await db.select().from(schema.allocations);
    return {
        contents: [{
            uri: "rubigo://allocations",
            mimeType: "application/json",
            text: JSON.stringify(data, null, 2),
        }],
    };
}

async function getSpecificationsList(): Promise<ReadResourceResult> {
    const data = await db.select().from(schema.specifications);
    return {
        contents: [{
            uri: "rubigo://specifications",
            mimeType: "application/json",
            text: JSON.stringify(data, null, 2),
        }],
    };
}

// ============================================================================
// Resource Router
// ============================================================================

const listHandlers: Record<string, ResourceHandler> = {
    "rubigo://personnel": getPersonnelList,
    "rubigo://projects": getProjectsList,
    "rubigo://solutions": getSolutionsList,
    "rubigo://objectives": getObjectivesList,
    "rubigo://features": getFeaturesList,
    "rubigo://rules": getRulesList,
    "rubigo://scenarios": getScenariosList,
    "rubigo://activities": getActivitiesList,
    "rubigo://initiatives": getInitiativesList,
    "rubigo://metrics": getMetricsList,
    "rubigo://kpis": getKpisList,
    "rubigo://roles": getRolesList,
    "rubigo://products": getProductsList,
    "rubigo://services": getServicesList,
    "rubigo://releases": getReleasesList,
    "rubigo://assignments": getAssignmentsList,
    "rubigo://allocations": getAllocationsList,
    "rubigo://specifications": getSpecificationsList,
};

const parameterizedHandlers: Record<string, ParameterizedResourceHandler> = {
    "rubigo://personnel/": getPersonnelById,
    "rubigo://projects/": getProjectById,
};

export async function handleResourceRead(uri: string): Promise<ReadResourceResult> {
    // Check for exact match (list resources)
    if (listHandlers[uri]) {
        return listHandlers[uri]();
    }

    // Check for parameterized resources
    for (const [prefix, handler] of Object.entries(parameterizedHandlers)) {
        if (uri.startsWith(prefix)) {
            const id = uri.slice(prefix.length);
            return handler(id);
        }
    }

    throw new Error(`Unknown resource: ${uri}`);
}
