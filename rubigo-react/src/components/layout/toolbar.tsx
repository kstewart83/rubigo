"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { usePersona } from "@/contexts/persona-context";
import { PersonaSwitcher } from "@/components/persona-switcher";
import type { Person } from "@/types/personnel";

interface ToolbarProps {
    personnel: Person[];
}

export function Toolbar({ personnel }: ToolbarProps) {
    const { currentPersona, signOut } = usePersona();
    const [showSwitcher, setShowSwitcher] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }

        if (showDropdown) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [showDropdown]);

    if (!currentPersona) return null;

    return (
        <>
            <header className="h-16 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6">
                {/* Left side - breadcrumb or empty */}
                <div />

                {/* Right side - controls */}
                <div className="flex items-center gap-4">
                    <ThemeToggle />

                    {/* User dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center gap-2 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            {currentPersona.photo ? (
                                <Image
                                    src={currentPersona.photo}
                                    alt={currentPersona.name}
                                    width={32}
                                    height={32}
                                    className="rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-sm font-medium">
                                    {currentPersona.name.split(" ").map((n) => n[0]).join("")}
                                </div>
                            )}
                            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 hidden sm:block">
                                {currentPersona.name}
                            </span>
                            <svg
                                className={`w-4 h-4 text-zinc-500 transition-transform ${showDropdown ? "rotate-180" : ""}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Dropdown menu */}
                        {showDropdown && (
                            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 py-2 z-50">
                                <div className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-800">
                                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                        {currentPersona.name}
                                    </p>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                        {currentPersona.title}
                                    </p>
                                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                                        {currentPersona.department}
                                    </p>
                                </div>
                                <div className="py-1">
                                    <button
                                        onClick={() => {
                                            setShowDropdown(false);
                                            setShowSwitcher(true);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                    >
                                        Switch Persona
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowDropdown(false);
                                            signOut();
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <PersonaSwitcher
                personnel={personnel}
                open={showSwitcher}
                onOpenChange={setShowSwitcher}
            />
        </>
    );
}
