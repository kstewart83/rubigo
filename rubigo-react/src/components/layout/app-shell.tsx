"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { PersonaSwitcher } from "@/components/persona-switcher";
import { InitializationForm } from "@/components/initialization-form";
import { SecurityProvider } from "@/contexts/security-context";
import { SecurityBanner } from "@/components/ui/security-banner";
import { usePersona } from "@/contexts/persona-context";
import { useIsDesktop } from "@/hooks/use-mobile";
import type { Person } from "@/types/personnel";

interface AppShellProps {
    children: React.ReactNode;
    personnel: Person[];
    version?: string;
}

interface InitStatus {
    initialized: boolean;
    wordList: string[];
}

export function AppShell({ children, personnel, version = "0.1.0" }: AppShellProps) {
    const router = useRouter();
    const { currentPersona, isLoading, setPersona } = usePersona();
    const [showSignIn, setShowSignIn] = useState(false);
    const [initStatus, setInitStatus] = useState<InitStatus | null>(null);
    const [initLoading, setInitLoading] = useState(true);

    // Responsive breakpoint hook - must be called before any conditional returns
    const isDesktop = useIsDesktop();

    // Check initialization status on mount
    useEffect(() => {
        async function checkInit() {
            try {
                const res = await fetch("/api/init");
                const data = await res.json();
                setInitStatus(data);
            } catch (error) {
                console.error("Failed to check init status:", error);
                // Assume initialized on error to avoid blocking
                setInitStatus({ initialized: true, wordList: [] });
            } finally {
                setInitLoading(false);
            }
        }
        checkInit();
    }, []);

    const handleInitialize = async (words: string[]): Promise<boolean> => {
        try {
            const res = await fetch("/api/init", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ words }),
            });

            if (res.ok) {
                // Create Global Admin persona and set it
                const globalAdmin: Person = {
                    id: "global-admin",
                    name: "Global Administrator",
                    email: "admin@rubigo.local",
                    title: "System Administrator",
                    department: "Executive",
                    isGlobalAdmin: true,
                };
                setPersona(globalAdmin);

                // Navigate to dashboard
                router.push("/dashboard");
                return true;
            }
            return false;
        } catch (error) {
            console.error("Initialization failed:", error);
            return false;
        }
    };

    if (isLoading || initLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950">
                <div className="animate-pulse text-zinc-500">Loading...</div>
            </div>
        );
    }

    // Show initialization UI if system is not initialized
    if (initStatus && !initStatus.initialized) {
        return (
            <div className="min-h-screen bg-zinc-950 text-white flex flex-col relative">
                {/* Full-viewport background effects */}
                <div
                    className="absolute inset-0 opacity-30 pointer-events-none"
                    style={{
                        background: "radial-gradient(ellipse 80% 50% at 20% 40%, rgba(255, 138, 101, 0.15) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 70% 70%, rgba(191, 54, 12, 0.1) 0%, transparent 50%), radial-gradient(ellipse 50% 30% at 50% 20%, rgba(84, 110, 122, 0.2) 0%, transparent 50%)",
                    }}
                />
                <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                        backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                        backgroundSize: "60px 60px",
                    }}
                />

                {/* Main split layout - constrained on large screens */}
                <div className="flex-1 flex flex-col md:flex-row 4xl:max-w-[1600px] 4xl:mx-auto 4xl:w-full relative z-10">
                    {/* Left half - Design showcase */}
                    <div className="flex-1 relative overflow-hidden flex flex-col justify-center px-6 py-8 md:px-12 md:py-0 lg:px-20 5xl:px-32 6xl:px-48">

                        {/* Content */}
                        <div className="relative z-10 max-w-xl 5xl:max-w-2xl 6xl:max-w-3xl">
                            {/* Logo and branding */}
                            <div className="mb-12 relative">
                                <div
                                    className="absolute -inset-12 opacity-40 blur-3xl"
                                    style={{
                                        background: "radial-gradient(circle, rgba(255, 138, 101, 0.4) 0%, transparent 70%)",
                                    }}
                                />
                                <div className="flex items-center gap-4 md:gap-6">
                                    <Image
                                        src="/rubigo-logo.svg"
                                        alt="Rubigo"
                                        width={120}
                                        height={120}
                                        className="relative w-16 h-16 md:w-[120px] md:h-[120px] 5xl:w-[160px] 5xl:h-[160px] 6xl:w-[200px] 6xl:h-[200px]"
                                        style={{
                                            filter: "drop-shadow(0 0 40px rgba(255, 138, 101, 0.3))",
                                        }}
                                    />
                                    <h1
                                        className="text-4xl md:text-6xl lg:text-7xl 5xl:text-8xl 6xl:text-9xl font-semibold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent pb-2"
                                        style={{ fontFamily: "var(--font-outfit)" }}
                                    >
                                        Rubigo
                                    </h1>
                                </div>
                            </div>

                            {/* Tagline */}
                            <h2 className="text-2xl md:text-3xl lg:text-4xl 5xl:text-5xl 6xl:text-6xl font-bold tracking-tight mb-4 md:mb-6 5xl:mb-8 leading-[1.2]">
                                <span className="bg-gradient-to-r from-zinc-300 via-zinc-400 to-zinc-500 bg-clip-text text-transparent">
                                    Enterprise
                                </span>{" "}
                                <span className="bg-gradient-to-r from-orange-300 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                                    Resource
                                </span>{" "}
                                <span className="bg-gradient-to-r from-zinc-400 via-zinc-500 to-zinc-600 bg-clip-text text-transparent">
                                    Management
                                </span>
                            </h2>

                            <p className="text-base md:text-lg lg:text-xl 5xl:text-2xl 6xl:text-3xl text-zinc-400 leading-relaxed mb-6 md:mb-8 5xl:mb-10 max-w-md 5xl:max-w-lg 6xl:max-w-xl">
                                A unified platform for workforce, communications, security, and operations—designed for the modern enterprise.
                            </p>

                            {/* Feature pills */}
                            <div className="flex flex-wrap gap-3 5xl:gap-4 6xl:gap-5">
                                {["Personnel", "Calendar", "Security", "Logistics"].map((feature) => (
                                    <span
                                        key={feature}
                                        className="px-4 py-2 5xl:px-6 5xl:py-3 6xl:px-8 6xl:py-4 rounded-full text-sm 5xl:text-base 6xl:text-lg font-medium bg-white/5 border border-white/10 text-zinc-300 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all cursor-default"
                                    >
                                        {feature}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Decorative line */}
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
                    </div>

                    {/* Right half - Initialization form */}
                    <div className="flex-1 flex items-center justify-center relative px-6 py-8 md:px-8 md:py-0 min-h-[50vh] md:min-h-0">

                        <div className="relative z-10 w-full max-w-md">
                            <InitializationForm
                                wordList={initStatus.wordList}
                                onInitialize={handleInitialize}
                            />
                        </div>

                        {/* Decorative ring */}
                        <div
                            className="absolute w-96 h-96 rounded-full border border-zinc-800/50 pointer-events-none"
                            style={{
                                background: "radial-gradient(circle, transparent 40%, rgba(39, 39, 42, 0.1) 70%, transparent 100%)",
                            }}
                        />
                    </div>
                </div>

                {/* Footer */}
                <footer className="py-4 px-8 flex items-center justify-between text-xs text-zinc-600 border-t border-zinc-900">
                    <span>© {new Date().getFullYear()} Rubigo</span>
                    <span>v{version}</span>
                </footer>
            </div>
        );
    }

    // Premium landing page when no persona (but system IS initialized)
    if (!currentPersona) {
        return (
            <div className="min-h-screen bg-zinc-950 text-white flex flex-col relative">
                {/* Full-viewport background effects */}
                <div
                    className="absolute inset-0 opacity-30 pointer-events-none"
                    style={{
                        background: "radial-gradient(ellipse 80% 50% at 20% 40%, rgba(255, 138, 101, 0.15) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 70% 70%, rgba(191, 54, 12, 0.1) 0%, transparent 50%), radial-gradient(ellipse 50% 30% at 50% 20%, rgba(84, 110, 122, 0.2) 0%, transparent 50%)",
                    }}
                />
                <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                        backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                        backgroundSize: "60px 60px",
                    }}
                />

                {/* Main split layout - constrained on large screens */}
                <div className="flex-1 flex flex-col md:flex-row 4xl:max-w-[1600px] 4xl:mx-auto 4xl:w-full relative z-10">
                    {/* Left half - Design showcase */}
                    <div className="flex-1 relative overflow-hidden flex flex-col justify-center px-6 py-8 md:px-12 md:py-0 lg:px-20 5xl:px-32 6xl:px-48">

                        {/* Content */}
                        <div className="relative z-10 max-w-xl 5xl:max-w-2xl 6xl:max-w-3xl">
                            {/* Logo and branding */}
                            <div className="mb-12 relative">
                                <div
                                    className="absolute -inset-12 opacity-40 blur-3xl"
                                    style={{
                                        background: "radial-gradient(circle, rgba(255, 138, 101, 0.4) 0%, transparent 70%)",
                                    }}
                                />
                                <div className="flex items-center gap-4 md:gap-6">
                                    <Image
                                        src="/rubigo-logo.svg"
                                        alt="Rubigo"
                                        width={120}
                                        height={120}
                                        className="relative w-16 h-16 md:w-[120px] md:h-[120px] 5xl:w-[160px] 5xl:h-[160px] 6xl:w-[200px] 6xl:h-[200px]"
                                        style={{
                                            filter: "drop-shadow(0 0 40px rgba(255, 138, 101, 0.3))",
                                        }}
                                    />
                                    <h1
                                        className="text-4xl md:text-6xl lg:text-7xl 5xl:text-8xl 6xl:text-9xl font-semibold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent pb-2"
                                        style={{ fontFamily: "var(--font-outfit)" }}
                                    >
                                        Rubigo
                                    </h1>
                                </div>
                            </div>

                            {/* Tagline */}
                            <h2 className="text-2xl md:text-3xl lg:text-4xl 5xl:text-5xl 6xl:text-6xl font-bold tracking-tight mb-4 md:mb-6 5xl:mb-8 leading-[1.2]">
                                <span className="bg-gradient-to-r from-zinc-300 via-zinc-400 to-zinc-500 bg-clip-text text-transparent">
                                    Enterprise
                                </span>{" "}
                                <span className="bg-gradient-to-r from-orange-300 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                                    Resource
                                </span>{" "}
                                <span className="bg-gradient-to-r from-zinc-400 via-zinc-500 to-zinc-600 bg-clip-text text-transparent">
                                    Management
                                </span>
                            </h2>

                            <p className="text-base md:text-lg lg:text-xl 5xl:text-2xl 6xl:text-3xl text-zinc-400 leading-relaxed mb-6 md:mb-8 5xl:mb-10 max-w-md 5xl:max-w-lg 6xl:max-w-xl">
                                A unified platform for workforce, communications, security, and operations—designed for the modern enterprise.
                            </p>

                            {/* Feature pills */}
                            <div className="flex flex-wrap gap-3 5xl:gap-4 6xl:gap-5">
                                {["Personnel", "Calendar", "Security", "Logistics"].map((feature) => (
                                    <span
                                        key={feature}
                                        className="px-4 py-2 5xl:px-6 5xl:py-3 6xl:px-8 6xl:py-4 rounded-full text-sm 5xl:text-base 6xl:text-lg font-medium bg-white/5 border border-white/10 text-zinc-300 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all cursor-default"
                                    >
                                        {feature}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Decorative line */}
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
                    </div>

                    {/* Right half - Sign in */}
                    <div className="flex-1 flex items-center justify-center relative min-h-[40vh] md:min-h-0">

                        <button
                            onClick={() => setShowSignIn(true)}
                            className="group relative px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 active:scale-100"
                            style={{
                                background: "linear-gradient(135deg, rgba(255, 138, 101, 0.9) 0%, rgba(191, 54, 12, 0.9) 100%)",
                                boxShadow: "0 0 40px rgba(255, 138, 101, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
                            }}
                        >
                            <span className="relative z-10">Sign In</span>
                        </button>

                        {/* Decorative ring */}
                        <div
                            className="absolute w-96 h-96 rounded-full border border-zinc-800/50 pointer-events-none"
                            style={{
                                background: "radial-gradient(circle, transparent 40%, rgba(39, 39, 42, 0.1) 70%, transparent 100%)",
                            }}
                        />
                    </div>
                </div>

                {/* Footer */}
                <footer className="py-4 px-8 flex items-center justify-between text-xs text-zinc-600 border-t border-zinc-900">
                    <span>© {new Date().getFullYear()} Rubigo</span>
                    <span>v{version}</span>
                </footer>

                <PersonaSwitcher
                    personnel={personnel}
                    open={showSignIn}
                    onOpenChange={setShowSignIn}
                />
            </div >
        );
    }

    // Main application layout with new ShadCN sidebar
    // Sidebar is expanded on desktop (lg+), collapsed (icon-only) on tablet (md-lg)
    return (
        <SecurityProvider persona={currentPersona}>
            <div className="flex flex-col h-screen">
                <SecurityBanner />
                <SidebarProvider defaultOpen={isDesktop} className="flex-1 min-h-0 flex">
                    <AppSidebar personnel={personnel} version={version} />
                    <SidebarInset>
                        <main className="flex-1 h-full p-6 pb-24 md:pb-6 overflow-hidden flex flex-col">
                            {children}
                        </main>
                    </SidebarInset>
                    <MobileNav personnel={personnel} />
                </SidebarProvider>
            </div>
        </SecurityProvider>
    );
}