"use client";

import { useState, useLayoutEffect, useRef, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTableMeasurement, UseTableMeasurementOptions } from "./use-table-measurement";

const PAGE_SIZE_OPTIONS = ["auto", 10, 25, 50, 100] as const;

export interface UseServerPaginationOptions extends UseTableMeasurementOptions {
    /** Base path for the URL (e.g., "/personnel") */
    basePath: string;
    /** Default page size when not in auto mode */
    defaultPageSize?: number;
    /** Current page from server props */
    initialPage?: number;
    /** Current page size from server props */
    initialPageSize?: number;
}

export interface UseServerPaginationReturn {
    /** Ref to attach to the main container div */
    containerRef: React.RefObject<HTMLDivElement | null>;
    /** Ref to attach to the table body element */
    tableBodyRef: React.RefObject<HTMLTableSectionElement | null>;
    /** Ref to attach to the header element (breadcrumbs, toolbar, etc.) */
    headerRef: React.RefObject<HTMLDivElement | null>;
    /** Ref to attach to the pagination footer element */
    paginationRef: React.RefObject<HTMLDivElement | null>;
    /** Current page number (1-indexed) */
    currentPage: number;
    /** Current page size (number of rows) */
    pageSize: number;
    /** Whether auto mode is enabled */
    isAutoMode: boolean;
    /** Navigate to a specific page */
    goToPage: (page: number) => void;
    /** Handle page size selection change */
    handlePageSizeChange: (value: string) => void;
    /** Available page size options */
    pageSizeOptions: readonly (string | number)[];
}

/**
 * Hook for server-side pagination with URL synchronization and dynamic row measurement.
 * Updates URL params to trigger server-side refetch when page size or page changes.
 * 
 * Usage:
 * 1. Attach containerRef to the main scrollable container
 * 2. Attach tableBodyRef to the <tbody> or TableBody element
 * 3. Attach headerRef to the header/toolbar area
 * 4. Attach paginationRef to the pagination footer
 * 5. Pass basePath for URL construction and initial values from server props
 */
export function useServerPagination(options: UseServerPaginationOptions): UseServerPaginationReturn {
    const {
        basePath,
        defaultPageSize = 25,
        initialPage = 1,
        initialPageSize = 25,
        ...measurementOptions
    } = options;

    const router = useRouter();
    const searchParams = useSearchParams();

    // Use shared measurement hook
    const {
        containerRef,
        tableBodyRef,
        headerRef,
        paginationRef,
        calculateOptimalRows,
    } = useTableMeasurement(measurementOptions);

    // Read auto mode from URL - default to auto if no pageSize specified
    const [isAutoMode, setIsAutoMode] = useState(() => {
        const autoSize = searchParams.get("autoSize");
        const explicitPageSize = searchParams.get("pageSize");
        // Auto mode is ON by default, OR if explicitly set to true
        // It's OFF only if autoSize is explicitly "false" OR a pageSize is set without autoSize
        return autoSize === "true" || (autoSize === null && explicitPageSize === null);
    });

    // Current values come from URL/server props
    const currentPage = initialPage;
    const pageSize = initialPageSize;

    // Track last calculated size to avoid unnecessary URL updates
    const lastCalculatedSize = useRef<number>(pageSize);

    // Build URL with all existing params plus new values
    const buildUrl = useCallback((params: Record<string, string>) => {
        const newParams = new URLSearchParams(searchParams.toString());
        Object.entries(params).forEach(([key, value]) => {
            newParams.set(key, value);
        });
        return `${basePath}?${newParams.toString()}`;
    }, [basePath, searchParams]);

    // Navigate to a specific page
    const goToPage = useCallback((page: number) => {
        router.push(buildUrl({ page: String(page) }));
    }, [router, buildUrl]);

    // Setup ResizeObserver for auto mode
    useLayoutEffect(() => {
        if (!isAutoMode || !containerRef.current) return;

        const updatePageSize = () => {
            const newSize = calculateOptimalRows();
            if (newSize !== lastCalculatedSize.current && newSize > 0) {
                lastCalculatedSize.current = newSize;
                // Update URL to trigger server-side refetch
                router.push(buildUrl({
                    pageSize: String(newSize),
                    autoSize: "true",
                    page: "1", // Reset to first page
                }));
            }
        };

        const observer = new ResizeObserver(() => {
            updatePageSize();
        });

        observer.observe(containerRef.current);
        // Initial calculation (delayed to let layout settle)
        const timer = setTimeout(updatePageSize, 100);

        return () => {
            observer.disconnect();
            clearTimeout(timer);
        };
    }, [isAutoMode, calculateOptimalRows, containerRef, router, buildUrl]);

    // Handle page size change from user selection
    const handlePageSizeChange = useCallback((value: string) => {
        if (value === "auto") {
            setIsAutoMode(true);
            const autoSize = calculateOptimalRows();
            lastCalculatedSize.current = autoSize;
            router.push(buildUrl({
                pageSize: String(autoSize),
                autoSize: "true",
                page: "1",
            }));
        } else {
            setIsAutoMode(false);
            router.push(buildUrl({
                pageSize: value,
                autoSize: "false",
                page: "1",
            }));
        }
    }, [calculateOptimalRows, router, buildUrl]);

    return {
        containerRef,
        tableBodyRef,
        headerRef,
        paginationRef,
        currentPage,
        pageSize,
        isAutoMode,
        goToPage,
        handlePageSizeChange,
        pageSizeOptions: PAGE_SIZE_OPTIONS,
    };
}
