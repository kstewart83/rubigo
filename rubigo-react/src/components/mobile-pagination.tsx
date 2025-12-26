"use client";

/**
 * Mobile Pagination - Simplified pagination for narrow screens
 * 
 * Features:
 * - Compact layout for mobile widths
 * - Page size selector dropdown
 * - Previous/Next buttons with page indicator
 * - Can be placed at top and/or bottom of lists
 */

import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Fixed page size options for mobile (no auto)
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

interface MobilePaginationProps {
    page: number;
    totalPages: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    isPending?: boolean;
    showCount?: boolean;
    showPageSizeSelect?: boolean;
    total?: number;
    startIndex?: number;
    endIndex?: number;
}

export function MobilePagination({
    page,
    totalPages,
    pageSize,
    onPageChange,
    onPageSizeChange,
    isPending = false,
    showCount = false,
    showPageSizeSelect = false,
    total = 0,
    startIndex = 0,
    endIndex = 0,
}: MobilePaginationProps) {
    // Normalize pageSize to closest valid option (in case of auto-mode calculated values)
    const normalizedPageSize = PAGE_SIZE_OPTIONS.includes(pageSize)
        ? pageSize
        : PAGE_SIZE_OPTIONS.reduce((prev, curr) =>
            Math.abs(curr - pageSize) < Math.abs(prev - pageSize) ? curr : prev
        );

    return (
        <div className="flex items-center justify-between py-2 px-2">
            {/* Left - Record count */}
            <div className="flex-1">
                {showCount && total > 0 ? (
                    <span className="text-sm text-muted-foreground">
                        {startIndex}-{endIndex} of {total}
                    </span>
                ) : (
                    <span />
                )}
            </div>

            {/* Center - Page size selector */}
            <div className="flex-1 flex justify-center">
                {showPageSizeSelect && onPageSizeChange ? (
                    <Select
                        value={String(normalizedPageSize)}
                        onValueChange={(value) => onPageSizeChange(Number(value))}
                    >
                        <SelectTrigger className="h-7 w-[65px] text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {PAGE_SIZE_OPTIONS.map((size) => (
                                <SelectItem key={size} value={String(size)}>
                                    {size}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <span />
                )}
            </div>

            {/* Right - Page navigation */}
            <div className="flex-1 flex justify-end items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1 || isPending}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <span className="text-sm text-muted-foreground min-w-[50px] text-center">
                    {page} / {totalPages || 1}
                </span>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages || isPending}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
