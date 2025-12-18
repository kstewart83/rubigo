/**
 * Chat Module
 * Real-time messaging and team communication
 */

import { AppShell } from "@/components/layout/app-shell";
import { PersonaProvider } from "@/contexts/persona-context";
import { getAllPersonnel } from "@/lib/personnel";
import { getVersion } from "@/lib/config";
import { ChatPageContent } from "@/components/chat-page-content";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
    const allPersonnel = getAllPersonnel();
    const version = getVersion();

    return (
        <PersonaProvider>
            <AppShell personnel={allPersonnel} version={version}>
                <ChatPageContent />
            </AppShell>
        </PersonaProvider>
    );
}
