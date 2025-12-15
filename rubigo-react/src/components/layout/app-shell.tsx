"use client";

import { useState } from "react";
import Image from "next/image";
import { Sidebar } from "./sidebar";
import { Toolbar } from "./toolbar";
import { PersonaSwitcher } from "@/components/persona-switcher";
import { usePersona } from "@/contexts/persona-context";
import type { Person } from "@/types/personnel";

interface AppShellProps {
    children: React.ReactNode;
    personnel: Person[];
    version?: string;
}

export function AppShell({ children, personnel, version = "0.1.0" }: AppShellProps) {
    const { currentPersona, isLoading } = usePersona();
    const [showSignIn, setShowSignIn] = useState(false);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950">
                <div className="animate-pulse text-zinc-500">Loading...</div>
            </div>
        );
    }

    // Premium landing page when no persona
    if (!currentPersona) {
        return (
            <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
                {/* Main split layout */}
                <div className="flex-1 flex">
                    {/* Left half - Design showcase */}
                    <div className="flex-1 relative overflow-hidden flex flex-col justify-center px-12 lg:px-20">
                        {/* Animated gradient background */}
                        <div
                            className="absolute inset-0 opacity-30"
                            style={{
                                background: "radial-gradient(ellipse 80% 50% at 20% 40%, rgba(255, 138, 101, 0.15) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 70% 70%, rgba(191, 54, 12, 0.1) 0%, transparent 50%), radial-gradient(ellipse 50% 30% at 50% 20%, rgba(84, 110, 122, 0.2) 0%, transparent 50%)",
                            }}
                        />

                        {/* Grid effect */}
                        <div
                            className="absolute inset-0 opacity-[0.03]"
                            style={{
                                backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                                backgroundSize: "60px 60px",
                            }}
                        />

                        {/* Content */}
                        <div className="relative z-10 max-w-xl">
                            {/* Logo and branding */}
                            <div className="mb-12 relative">
                                <div
                                    className="absolute -inset-12 opacity-40 blur-3xl"
                                    style={{
                                        background: "radial-gradient(circle, rgba(255, 138, 101, 0.4) 0%, transparent 70%)",
                                    }}
                                />
                                <div className="flex items-center gap-6">
                                    <Image
                                        src="/rubigo-logo.svg"
                                        alt="Rubigo"
                                        width={120}
                                        height={120}
                                        className="relative"
                                        style={{
                                            filter: "drop-shadow(0 0 40px rgba(255, 138, 101, 0.3))",
                                        }}
                                    />
                                    <h1
                                        className="text-6xl lg:text-7xl font-semibold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent pb-2"
                                        style={{ fontFamily: "var(--font-outfit)" }}
                                    >
                                        Rubigo
                                    </h1>
                                </div>
                            </div>

                            {/* Tagline */}
                            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-6 leading-[1.2]">
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

                            <p className="text-lg lg:text-xl text-zinc-400 leading-relaxed mb-8 max-w-md">
                                A unified platform for workforce, communications, security, and operations—designed for the modern enterprise.
                            </p>

                            {/* Feature pills */}
                            <div className="flex flex-wrap gap-3">
                                {["Personnel", "Calendar", "Security", "Logistics"].map((feature) => (
                                    <span
                                        key={feature}
                                        className="px-4 py-2 rounded-full text-sm font-medium bg-white/5 border border-white/10 text-zinc-300 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all cursor-default"
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
                    <div className="flex-1 flex items-center justify-center relative">
                        <div
                            className="absolute inset-0 opacity-50"
                            style={{
                                background: "radial-gradient(ellipse 100% 100% at 100% 50%, rgba(39, 39, 42, 0.5) 0%, transparent 70%)",
                            }}
                        />

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
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Toolbar personnel={personnel} />
                <main className="flex-1 p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
