'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const tabs = [
    { name: 'Overview', href: '/analytics/overview' },
    { name: 'Performance', href: '/analytics/performance' },
    { name: 'Usage', href: '/analytics/usage' },
];

export function AnalyticsTabs() {
    const pathname = usePathname();

    return (
        <div className="border-b border-zinc-200 dark:border-zinc-800 mb-6">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href;
                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className={cn(
                                'whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition-colors',
                                isActive
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                            )}
                        >
                            {tab.name}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
