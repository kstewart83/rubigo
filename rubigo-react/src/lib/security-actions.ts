"use server";

import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import matter from "gray-matter";

// ============================================================================
// Types
// ============================================================================

export interface ClassificationGuide {
    id: string;
    slug: string;
    title: string;
    type: "sensitivity" | "compartment";
    level: string;
    icon?: string;
    color?: string;
    content: string;
    excerpt: string;
    // ACO fields
    sensitivity: "public" | "low" | "moderate" | "high";
    compartments?: string[];
}

interface GuideFrontmatter {
    id: string;
    title: string;
    type: "sensitivity" | "compartment";
    level: string;
    icon?: string;
    color?: string;
    // ACO fields
    sensitivity?: "public" | "low" | "moderate" | "high";
    compartments?: string[];
}

// ============================================================================
// Path Resolution
// ============================================================================

function getGuidesBasePath(): string {
    // Navigate from rubigo-react to common/seed/profiles/mmc/classification-guides
    return join(process.cwd(), "..", "common", "seed", "profiles", "mmc", "classification-guides");
}

// ============================================================================
// Guide Loading
// ============================================================================

function loadGuideFromFile(filePath: string, slug: string): ClassificationGuide | null {
    try {
        const fileContent = readFileSync(filePath, "utf-8");
        const { data, content } = matter(fileContent);
        const frontmatter = data as GuideFrontmatter;

        // Create excerpt from first non-heading paragraph
        const lines = content.split("\n");
        let excerpt = "";
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith("#") && !trimmed.startsWith("---")) {
                excerpt = trimmed.slice(0, 200);
                if (trimmed.length > 200) excerpt += "...";
                break;
            }
        }

        // Default sensitivity based on guide type
        const defaultSensitivity = frontmatter.type === "sensitivity"
            ? (frontmatter.level as "public" | "low" | "moderate" | "high")
            : "moderate";

        return {
            id: frontmatter.id,
            slug,
            title: frontmatter.title,
            type: frontmatter.type,
            level: frontmatter.level,
            icon: frontmatter.icon,
            color: frontmatter.color,
            content,
            excerpt,
            // ACO fields
            sensitivity: frontmatter.sensitivity || defaultSensitivity,
            compartments: frontmatter.compartments,
        };
    } catch (error) {
        console.error(`Error loading guide from ${filePath}:`, error);
        return null;
    }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Get all classification guides
 */
export async function getClassificationGuides(): Promise<ClassificationGuide[]> {
    const basePath = getGuidesBasePath();
    const guides: ClassificationGuide[] = [];

    // Load sensitivity guides
    const sensitivityPath = join(basePath, "sensitivity");
    if (existsSync(sensitivityPath)) {
        const sensitivityFiles = readdirSync(sensitivityPath).filter(f => f.endsWith(".md"));
        for (const file of sensitivityFiles) {
            const slug = `sensitivity-${file.replace(".md", "")}`;
            const guide = loadGuideFromFile(join(sensitivityPath, file), slug);
            if (guide) guides.push(guide);
        }
    }

    // Load compartment guides
    const compartmentsPath = join(basePath, "compartments");
    if (existsSync(compartmentsPath)) {
        const compartmentFiles = readdirSync(compartmentsPath).filter(f => f.endsWith(".md"));
        for (const file of compartmentFiles) {
            const slug = `compartment-${file.replace(".md", "")}`;
            const guide = loadGuideFromFile(join(compartmentsPath, file), slug);
            if (guide) guides.push(guide);
        }
    }

    // Sort: sensitivity first (by level order), then compartments
    const sensitivityOrder = ["public", "low", "moderate", "high"];
    return guides.sort((a, b) => {
        if (a.type !== b.type) {
            return a.type === "sensitivity" ? -1 : 1;
        }
        if (a.type === "sensitivity") {
            return sensitivityOrder.indexOf(a.level) - sensitivityOrder.indexOf(b.level);
        }
        return a.title.localeCompare(b.title);
    });
}

/**
 * Get a single guide by slug
 */
export async function getGuide(slug: string): Promise<ClassificationGuide | null> {
    const basePath = getGuidesBasePath();

    // Parse slug to determine type and filename
    const match = slug.match(/^(sensitivity|compartment)-(.+)$/);
    if (!match) return null;

    const [, type, filename] = match;
    const filePath = join(basePath, type === "sensitivity" ? "sensitivity" : "compartments", `${filename}.md`);

    if (!existsSync(filePath)) return null;

    return loadGuideFromFile(filePath, slug);
}

/**
 * Get guides by type
 */
export async function getGuidesByType(type: "sensitivity" | "compartment"): Promise<ClassificationGuide[]> {
    const allGuides = await getClassificationGuides();
    return allGuides.filter(g => g.type === type);
}
