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

// Get personnel data at build time (server component)
const personnel = getAllPersonnel();
const version = getVersion();

export default function HomePage() {
    return (
        <PersonaProvider>
            <AppShell personnel={personnel} version={version}>
                {/* Empty - landing page is shown by AppShell when no persona */}
                <div />
            </AppShell>
        </PersonaProvider>
    );
}
