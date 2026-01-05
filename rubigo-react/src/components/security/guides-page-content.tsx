"use client";

import Link from "next/link";
import { useState } from "react";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Shield,
    Eye,
    Lock,
    AlertTriangle,
    ChevronRight,
    Plus,
    Users,
    Boxes,
} from "lucide-react";
import type { ClassificationGuide, GuideType } from "@/lib/security-actions";

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
    users: Users,
    boxes: Boxes,
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
    slate: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800",
};

// Emoji map for compartments
const compartmentEmojis: Record<string, string> = {
    apple: "🍎",
    banana: "🍌",
    grape: "🍇",
    orange: "🍊",
    strawberry: "🍓",
    infrastructure: "🏗️",
};

// ============================================================================
// Components
// ============================================================================

function StatusBadge({ status }: { status: "draft" | "active" | "superseded" }) {
    if (status === "active") return null;

    return (
        <Badge variant={status === "draft" ? "secondary" : "outline"} className="ml-2 text-xs">
            {status}
        </Badge>
    );
}

function DraftIndicator({ draftBy, draftStartedAt }: { draftBy?: string | null; draftStartedAt?: string | null }) {
    if (!draftBy) return null;

    // Format relative time
    const formatRelativeTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    return (
        <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 mt-1">
            <AlertTriangle className="size-3" />
            <span>
                Draft in progress
                {draftStartedAt && ` • Started ${formatRelativeTime(draftStartedAt)}`}
            </span>
        </div>
    );
}

function GuideCard({ guide }: { guide: ClassificationGuide }) {
    const Icon = guide.icon ? iconMap[guide.icon] : Shield;
    const colorClass = guide.color ? colorMap[guide.color] : colorMap.blue;
    const emoji = guide.guideType === "compartment" ? compartmentEmojis[guide.level] : null;

    return (
        <Link href={`/security/guides/${guide.id}`} className="block">
            <Card className={`border hover:shadow-md transition-shadow cursor-pointer ${colorClass} ${guide.hasDraft ? "ring-1 ring-amber-400/50" : ""}`}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {emoji ? (
                                <span className="text-3xl">{emoji}</span>
                            ) : Icon ? (
                                <div className={`p-2 rounded-lg ${colorClass}`}>
                                    <Icon className="size-5" />
                                </div>
                            ) : null}
                            <div>
                                <div className="flex items-center">
                                    <CardTitle className="text-lg">{guide.title}</CardTitle>
                                    <StatusBadge status={guide.status} />
                                    {guide.hasDraft && (
                                        <Badge variant="outline" className="ml-2 text-xs bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700">
                                            Draft
                                        </Badge>
                                    )}
                                </div>
                                <CardDescription className="mt-1 line-clamp-2">
                                    {guide.excerpt}
                                </CardDescription>
                                {guide.hasDraft && (
                                    <DraftIndicator draftBy={guide.draftBy} draftStartedAt={guide.draftStartedAt} />
                                )}
                            </div>
                        </div>
                        <ChevronRight className="size-5 text-muted-foreground" />
                    </div>
                </CardHeader>
            </Card>
        </Link>
    );
}

function EmptyState({ type, onCreateClick }: { type: GuideType; onCreateClick: () => void }) {
    const messages: Record<GuideType, { title: string; description: string }> = {
        sensitivity: {
            title: "No sensitivity guides",
            description: "Create guides for your data sensitivity levels.",
        },
        compartment: {
            title: "No compartment guides",
            description: "Define compartments for information isolation.",
        },
        role: {
            title: "No role guides",
            description: "Create guides for organizational roles and their data access.",
        },
    };

    return (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
            <p className="text-muted-foreground mb-4">{messages[type].description}</p>
            <Button onClick={onCreateClick}>
                <Plus className="size-4 mr-2" />
                Create {type} guide
            </Button>
        </div>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export function GuidesPageContent({ guides }: GuidesPageContentProps) {
    const [activeTab, setActiveTab] = useState<GuideType>("sensitivity");

    const sensitivityGuides = guides.filter(g => g.guideType === "sensitivity");
    const compartmentGuides = guides.filter(g => g.guideType === "compartment");
    const roleGuides = guides.filter(g => g.guideType === "role");

    const handleCreateClick = () => {
        window.location.href = `/security/guides/new?type=${activeTab}`;
    };

    return (
        <div className="h-full overflow-y-auto">
            <div className="container py-8 max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Classification Guides</h1>
                        <p className="text-muted-foreground mt-2">
                            Reference documentation for data classification and access control.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={`/security/guides/new?type=${activeTab}`}>
                            <Plus className="size-4 mr-2" />
                            New Guide
                        </Link>
                    </Button>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as GuideType)}>
                    <TabsList className="mb-6">
                        <TabsTrigger value="sensitivity" className="gap-2">
                            <Shield className="size-4" />
                            Sensitivity
                            <Badge variant="secondary" className="ml-1">{sensitivityGuides.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="compartment" className="gap-2">
                            <Boxes className="size-4" />
                            Compartments
                            <Badge variant="secondary" className="ml-1">{compartmentGuides.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="role" className="gap-2">
                            <Users className="size-4" />
                            Roles
                            <Badge variant="secondary" className="ml-1">{roleGuides.length}</Badge>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="sensitivity">
                        <p className="text-muted-foreground mb-6">
                            All data is classified into one of four sensitivity levels. Higher levels require
                            greater clearance and impose stricter handling requirements.
                        </p>
                        {sensitivityGuides.length > 0 ? (
                            <div className="space-y-3">
                                {sensitivityGuides.map((guide) => (
                                    <GuideCard key={guide.id} guide={guide} />
                                ))}
                            </div>
                        ) : (
                            <EmptyState type="sensitivity" onCreateClick={handleCreateClick} />
                        )}
                    </TabsContent>

                    <TabsContent value="compartment">
                        <p className="text-muted-foreground mb-6">
                            Compartments provide additional access restrictions beyond sensitivity levels.
                            Users must have explicit compartment clearance to access compartmentalized data.
                        </p>
                        {compartmentGuides.length > 0 ? (
                            <div className="space-y-3">
                                {compartmentGuides.map((guide) => (
                                    <GuideCard key={guide.id} guide={guide} />
                                ))}
                            </div>
                        ) : (
                            <EmptyState type="compartment" onCreateClick={handleCreateClick} />
                        )}
                    </TabsContent>

                    <TabsContent value="role">
                        <p className="text-muted-foreground mb-6">
                            Role-based guides define data access patterns for different organizational roles.
                            Each role has specific clearance levels and compartment access.
                        </p>
                        {roleGuides.length > 0 ? (
                            <div className="space-y-3">
                                {roleGuides.map((guide) => (
                                    <GuideCard key={guide.id} guide={guide} />
                                ))}
                            </div>
                        ) : (
                            <EmptyState type="role" onCreateClick={handleCreateClick} />
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
