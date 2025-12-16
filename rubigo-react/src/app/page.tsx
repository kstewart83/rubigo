import { AppShell } from "@/components/layout/app-shell";
import { PersonaProvider } from "@/contexts/persona-context";
import { getAllPersonnel } from "@/lib/personnel";
import { getVersion } from "@/lib/config";

/**
 * Root page - Landing/Sign In
 * 
 * When no persona is set, shows the landing page with sign in option.
 * The AppShell handles determining what to display based on auth state.
 */

// Force dynamic rendering - personnel data must be fetched at request time
// because auto-init creates Global Admin at server startup (after build)
export const dynamic = "force-dynamic";

export default async function HomePage() {
    // Get personnel data at request time (not build time)
    const personnel = getAllPersonnel();
    const version = getVersion();

    return (
        <PersonaProvider>
            <AppShell personnel={personnel} version={version}>
                {/* Empty - landing page is shown by AppShell when no persona */}
                <div />
            </AppShell>
        </PersonaProvider>
    );
}
