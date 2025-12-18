/**
 * Chat Module - Coming Soon
 * Real-time messaging and team communication
 */

import { AppShell } from "@/components/layout/app-shell";
import { PersonaProvider } from "@/contexts/persona-context";
import { getAllPersonnel } from "@/lib/personnel";
import { getVersion } from "@/lib/config";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default async function ChatPage() {
    const allPersonnel = getAllPersonnel();
    const version = getVersion();

    return (
        <PersonaProvider>
            <AppShell personnel={allPersonnel} version={version}>
                <div className="container mx-auto py-8">
                    <h1 className="text-3xl font-bold mb-4">Chat</h1>
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="text-6xl mb-4">💬</div>
                        <h2 className="text-2xl font-semibold text-muted-foreground mb-2">
                            Coming Soon
                        </h2>
                        <p className="text-muted-foreground max-w-md">
                            Real-time team messaging with channels, direct messages,
                            reactions, and threaded conversations.
                        </p>
                    </div>
                </div>
            </AppShell>
        </PersonaProvider>
    );
}
