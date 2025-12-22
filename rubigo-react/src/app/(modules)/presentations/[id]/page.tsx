/**
 * Presentation Editor Page
 * Edit and manage individual presentations
 */

import { AppShell } from "@/components/layout/app-shell";
import { PersonaProvider } from "@/contexts/persona-context";
import { getAllPersonnel } from "@/lib/personnel";
import { getVersion } from "@/lib/config";
import { PresentationEditorContent } from "@/components/presentations/presentation-editor-content";

// Force dynamic rendering
export const dynamic = "force-dynamic";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function PresentationEditorPage({ params }: Props) {
    const { id } = await params;
    const allPersonnel = getAllPersonnel();
    const version = getVersion();

    return (
        <PersonaProvider>
            <AppShell personnel={allPersonnel} version={version}>
                <PresentationEditorContent presentationId={id} />
            </AppShell>
        </PersonaProvider>
    );
}
