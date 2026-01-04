/**
 * Individual Classification Guide Detail Page
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PersonaProvider } from "@/contexts/persona-context";
import { getAllPersonnel } from "@/lib/personnel";
import { getVersion } from "@/lib/config";
import { getGuide, getClassificationGuides } from "@/lib/security-actions";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { SecurePanelWrapper } from "@/components/ui/secure-panel-wrapper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Shield, Eye, Lock, AlertTriangle } from "lucide-react";

// Force dynamic rendering
export const dynamic = "force-dynamic";

// Generate static params for all guides
export async function generateStaticParams() {
    const guides = await getClassificationGuides();
    return guides.map((guide) => ({
        slug: guide.slug,
    }));
}

// Generate metadata
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const guide = await getGuide(slug);
    if (!guide) {
        return { title: "Guide Not Found | Rubigo" };
    }
    return {
        title: `${guide.title} | Classification Guides | Rubigo`,
        description: guide.excerpt,
    };
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    eye: Eye,
    shield: Shield,
    lock: Lock,
    "alert-triangle": AlertTriangle,
};

const colorMap: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    red: "bg-red-500/10 text-red-600 dark:text-red-400",
    yellow: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    pink: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
};

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const allPersonnel = getAllPersonnel();
    const version = getVersion();
    const guide = await getGuide(slug);

    if (!guide) {
        notFound();
    }

    const Icon = guide.icon ? iconMap[guide.icon] : Shield;
    const colorClass = guide.color ? colorMap[guide.color] : colorMap.blue;

    return (
        <PersonaProvider>
            <AppShell personnel={allPersonnel} version={version}>
                <div className="h-full overflow-y-auto">
                    <div className="container py-8 max-w-4xl mx-auto">
                        {/* Back Button */}
                        <div className="mb-6">
                            <Link href="/security/guides">
                                <Button variant="ghost" size="sm" className="gap-2">
                                    <ArrowLeft className="size-4" />
                                    Back to Guides
                                </Button>
                            </Link>
                        </div>

                        {/* Header */}
                        <div className="mb-8 flex items-center gap-4">
                            {guide.type === "compartment" ? (
                                <span className="text-5xl">{guide.level}</span>
                            ) : Icon ? (
                                <div className={`p-4 rounded-xl ${colorClass}`}>
                                    <Icon className="size-8" />
                                </div>
                            ) : null}
                            <div>
                                <Badge variant="outline" className="mb-2">
                                    {guide.type === "sensitivity" ? "Sensitivity Level" : "Compartment"}
                                </Badge>
                                <h1 className="text-3xl font-bold tracking-tight">{guide.title}</h1>
                            </div>
                        </div>

                        {/* Content wrapped with security banners */}
                        <SecurePanelWrapper
                            level={guide.sensitivity}
                            compartments={guide.compartments}
                            className="rounded-lg overflow-hidden"
                        >
                            <div className="bg-card p-8">
                                <MarkdownRenderer content={guide.content} />
                            </div>
                        </SecurePanelWrapper>
                    </div>
                </div>
            </AppShell>
        </PersonaProvider>
    );
}
