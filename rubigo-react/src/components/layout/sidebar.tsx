"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

interface SidebarItem {
    id: string;
    label: string;
    href: string;
    icon: string;
}

const sidebarItems: SidebarItem[] = [
    { id: "home", label: "Home", href: "/dashboard", icon: "🏠" },
    { id: "personnel", label: "Personnel", href: "/personnel", icon: "👥" },
    // Future modules
    // { id: "calendar", label: "Calendar", href: "/calendar", icon: "📅" },
    // { id: "chat", label: "Chat", href: "/chat", icon: "💬" },
    // { id: "security", label: "Security", href: "/security", icon: "🔐" },
    // { id: "logistics", label: "Logistics", href: "/logistics", icon: "📦" },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 h-screen bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
            {/* Logo */}
            <div className="h-16 flex items-center px-4 border-b border-zinc-200 dark:border-zinc-800">
                <Link href="/dashboard" className="flex items-center gap-3">
                    <Image
                        src="/rubigo-logo.svg"
                        alt="Rubigo"
                        width={32}
                        height={32}
                        className="dark:invert"
                    />
                    <span
                        className="text-xl font-semibold text-zinc-900 dark:text-zinc-100"
                        style={{ fontFamily: "var(--font-outfit)" }}
                    >
                        Rubigo
                    </span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-2">
                <ul className="space-y-1">
                    {sidebarItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== "/dashboard" && pathname.startsWith(item.href));

                        return (
                            <li key={item.id}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive
                                            ? "bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50"
                                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                                        }`}
                                >
                                    <span className="text-xl">{item.icon}</span>
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                <p className="text-xs text-zinc-400">
                    Enterprise Resource Management
                </p>
            </div>
        </aside>
    );
}
