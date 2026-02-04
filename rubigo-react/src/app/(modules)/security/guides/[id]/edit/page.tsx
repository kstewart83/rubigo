/**
 * Edit Classification Guide page
 */

import { AppShell } from "@/components/layout/app-shell";
import { PersonaProvider } from "@/contexts/persona-context";
import { getAllPersonnel } from "@/lib/personnel";
import { getVersion } from "@/lib/config";
import { GuideEditor } from "@/components/security/guide-editor";
import { getGuideById } from "@/lib/security-actions";
import { createDevSubject } from "@/lib/access-control/session-resolver";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
    const resolvedParams = await params;
    const guide = await getGuideById(resolvedParams.id);
    return {
        title: guide ? `Edit: ${guide.title} | Security | Rubigo` : "Guide Not Found",
    };
}

export default async function EditGuidePage({ params }: Props) {
    const resolvedParams = await params;
    const allPersonnel = getAllPersonnel();
    const version = getVersion();
    const subject = createDevSubject();
    const guide = await getGuideById(resolvedParams.id);

    if (!guide) {
        notFound();
    }

    return (
        <PersonaProvider>
            <AppShell personnel={allPersonnel} version={version}>
                <GuideEditor
                    mode="edit"
                    existingGuide={guide}
                    createdBy={subject.email}
                />
            </AppShell>
        </PersonaProvider>
    );
}
