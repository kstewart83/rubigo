/**
 * Presenter View Page
 * Shows current slide, next slide preview, notes, and clock
 */

import { PersonaProvider } from "@/contexts/persona-context";
import { PresenterViewContent } from "@/components/presentations/presenter-view-content";

// Force dynamic rendering
export const dynamic = "force-dynamic";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function PresenterViewPage({ params }: Props) {
    const { id } = await params;

    return (
        <PersonaProvider>
            <PresenterViewContent presentationId={id} />
        </PersonaProvider>
    );
}
