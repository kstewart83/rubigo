"use client";

import Link from "next/link";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SecurePanelWrapper } from "@/components/ui/secure-panel-wrapper";
import {
    Shield,
    Eye,
    Lock,
    AlertTriangle,
    ChevronRight,
} from "lucide-react";
import type { ClassificationGuide } from "@/lib/security-actions";

// ============================================================================
// Types
// ============================================================================

interface GuidesPageContentProps {
    guides: ClassificationGuide[];
}

// ============================================================================
// Icon Mapping
// ============================================================================

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    eye: Eye,
    shield: Shield,
    lock: Lock,
    "alert-triangle": AlertTriangle,
};

const colorMap: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    red: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
    yellow: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
    orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
    pink: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800",
};

// ============================================================================
// Components
// ============================================================================

function GuideCard({ guide }: { guide: ClassificationGuide }) {
    const Icon = guide.icon ? iconMap[guide.icon] : Shield;
    const colorClass = guide.color ? colorMap[guide.color] : colorMap.blue;

    return (
        <SecurePanelWrapper
            level={guide.sensitivity}
            compartments={guide.compartments}
            className="rounded-lg overflow-hidden"
        >
            <Link href={`/security/guides/${guide.slug}`} className="block">
                <Card className={`border-x hover:shadow-md transition-shadow cursor-pointer ${colorClass} rounded-none border-y-0`}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {guide.type === "compartment" ? (
                                    <span className="text-3xl">{guide.level}</span>
                                ) : Icon ? (
                                    <div className={`p-2 rounded-lg ${colorClass}`}>
                                        <Icon className="size-5" />
                                    </div>
                                ) : null}
                                <div>
                                    <CardTitle className="text-lg">{guide.title}</CardTitle>
                                    <CardDescription className="mt-1 line-clamp-2">
                                        {guide.excerpt}
                                    </CardDescription>
                                </div>
                            </div>
                            <ChevronRight className="size-5 text-muted-foreground" />
                        </div>
                    </CardHeader>
                </Card>
            </Link>
        </SecurePanelWrapper>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export function GuidesPageContent({ guides }: GuidesPageContentProps) {
    const sensitivityGuides = guides.filter(g => g.type === "sensitivity");
    const compartmentGuides = guides.filter(g => g.type === "compartment");

    return (
        <div className="h-full overflow-y-auto">
            <div className="container py-8 max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Classification Guides</h1>
                    <p className="text-muted-foreground mt-2">
                        Reference guides for data classification sensitivity levels and compartments.
                        Click any guide to view the full document.
                    </p>
                </div>

                {/* Sensitivity Levels Section */}
                <section className="mb-10">
                    <div className="flex items-center gap-2 mb-4">
                        <Shield className="size-5 text-muted-foreground" />
                        <h2 className="text-xl font-semibold">Sensitivity Levels</h2>
                    </div>
                    <p className="text-muted-foreground mb-6">
                        All data is classified into one of four sensitivity levels. Higher levels require
                        greater clearance and impose stricter handling requirements.
                    </p>
                    <div className="space-y-3">
                        {sensitivityGuides.map((guide) => (
                            <GuideCard key={guide.id} guide={guide} />
                        ))}
                    </div>
                </section>

                {/* Compartments Section */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Badge variant="outline" className="text-lg px-2">🍎</Badge>
                        <h2 className="text-xl font-semibold">Compartments</h2>
                    </div>
                    <p className="text-muted-foreground mb-6">
                        Compartments provide additional access restrictions beyond sensitivity levels.
                        Users must have explicit compartment clearance to access compartmentalized data.
                    </p>
                    <div className="space-y-3">
                        {compartmentGuides.map((guide) => (
                            <CompartmentCard key={guide.id} guide={guide} />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

function CompartmentCard({ guide }: { guide: ClassificationGuide }) {
    const colorClass = guide.color ? colorMap[guide.color] : "";

    return (
        <SecurePanelWrapper
            level={guide.sensitivity}
            compartments={guide.compartments}
            className="rounded-lg overflow-hidden"
        >
            <Link href={`/security/guides/${guide.slug}`} className="block">
                <Card className={`hover:shadow-md transition-shadow cursor-pointer rounded-none border-y-0 ${colorClass ? `border-x ${colorClass}` : "border-x"}`}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">{guide.level}</span>
                                <div>
                                    <CardTitle className="text-lg">{guide.title}</CardTitle>
                                    <CardDescription className="mt-1 line-clamp-2">
                                        {guide.excerpt}
                                    </CardDescription>
                                </div>
                            </div>
                            <ChevronRight className="size-5 text-muted-foreground" />
                        </div>
                    </CardHeader>
                </Card>
            </Link>
        </SecurePanelWrapper>
    );
}

