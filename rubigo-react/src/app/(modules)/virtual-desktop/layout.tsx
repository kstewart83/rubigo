/**
 * Virtual Desktop Module Layout
 * 
 * Provides PersonaProvider context for all virtual desktop pages.
 */

import { PersonaProvider } from "@/contexts/persona-context";

export default function VirtualDesktopLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <PersonaProvider>{children}</PersonaProvider>;
}
