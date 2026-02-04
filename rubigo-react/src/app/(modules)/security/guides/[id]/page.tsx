/**
 * View single Classification Guide page
 */

import { AppShell } from "@/components/layout/app-shell";
import { PersonaProvider } from "@/contexts/persona-context";
import { getAllPersonnel } from "@/lib/personnel";
import { getVersion } from "@/lib/config";
import { getGuideById } from "@/lib/security-actions";
import { notFound } from "next/navigation";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Edit } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
    const resolvedParams = await params;
    const guide = await getGuideById(resolvedParams.id);
    return {
        title: guide ? `${guide.title} | Security | Rubigo` : "Guide Not Found",
    };
}

export default async function ViewGuidePage({ params }: Props) {
    const resolvedParams = await params;
    const allPersonnel = getAllPersonnel();
    const version = getVersion();
    const guide = await getGuideById(resolvedParams.id);

    if (!guide) {
        notFound();
    }

    return (
        <PersonaProvider>
            <AppShell personnel={allPersonnel} version={version}>
                <div className="h-full overflow-y-auto">
                    <div className="container py-8 max-w-4xl mx-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <Button variant="ghost" size="icon" asChild>
                                    <Link href="/security/guides">
                                        <ArrowLeft className="size-4" />
                                    </Link>
                                </Button>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-3xl font-bold">{guide.title}</h1>
                                        <Badge variant="outline">v{guide.version}</Badge>
                                        <Badge variant={guide.status === "active" ? "default" : "secondary"}>
                                            {guide.status}
                                        </Badge>
                                    </div>
                                    <p className="text-muted-foreground mt-1">
                                        {guide.guideType.charAt(0).toUpperCase() + guide.guideType.slice(1)} · {guide.level}
                                    </p>
                                </div>
                            </div>
                            <Button variant="outline" asChild>
                                <Link href={`/security/guides/${guide.id}/edit`}>
                                    <Edit className="size-4 mr-2" />
                                    Edit
                                </Link>
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="prose prose-lg dark:prose-invert max-w-none">
                            <MarkdownRenderer content={guide.contentMarkdown} />
                        </div>
                    </div>
                </div>
            </AppShell>
        </PersonaProvider>
    );
}
