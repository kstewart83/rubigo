/**
 * Presentation View Page (Fullscreen Mode)
 * Displays presentation in fullscreen for presenting
 */

import { AppShell } from "@/components/layout/app-shell";
import { PersonaProvider } from "@/contexts/persona-context";
import { getAllPersonnel } from "@/lib/personnel";
import { getVersion } from "@/lib/config";
import { PresentationViewContent } from "@/components/presentations/presentation-view-content";

// Force dynamic rendering
export const dynamic = "force-dynamic";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function PresentationViewPage({ params }: Props) {
    const { id } = await params;
    const allPersonnel = getAllPersonnel();
    const version = getVersion();

    return (
        <PersonaProvider>
            <PresentationViewContent presentationId={id} />
        </PersonaProvider>
    );
}
