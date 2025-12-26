"use client";

import { useState, useLayoutEffect, useRef, useCallback } from "react";
import { useTableMeasurement, UseTableMeasurementOptions } from "./use-table-measurement";

const PAGE_SIZE_OPTIONS = ["auto", 10, 25, 50, 100] as const;

export interface UseAutoPaginationOptions extends UseTableMeasurementOptions {
    /** Default page size when not in auto mode */
    defaultPageSize?: number;
}

export interface UseAutoPaginationReturn {
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
    /** Set the current page */
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
    /** Current page size (number of rows) */
    pageSize: number;
    /** Whether auto mode is enabled */
    isAutoMode: boolean;
    /** Handle page size selection change */
    handlePageSizeChange: (value: string) => void;
    /** Available page size options */
    pageSizeOptions: readonly (string | number)[];
}

/**
 * Hook for client-side auto-pagination with dynamic row measurement.
 * Automatically calculates the optimal number of rows based on container height.
 * 
 * Usage:
 * 1. Attach containerRef to the main scrollable container
 * 2. Attach tableBodyRef to the <tbody> or TableBody element
 * 3. Attach headerRef to the header/toolbar area
 * 4. Attach paginationRef to the pagination footer
 */
export function useAutoPagination(options: UseAutoPaginationOptions = {}): UseAutoPaginationReturn {
    const {
        defaultPageSize = 25,
        ...measurementOptions
    } = options;

    // Use shared measurement hook
    const {
        containerRef,
        tableBodyRef,
        headerRef,
        paginationRef,
        calculateOptimalRows,
    } = useTableMeasurement(measurementOptions);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(defaultPageSize);
    const [isAutoMode, setIsAutoMode] = useState(true);

    // Track last calculated size to avoid unnecessary updates
    const lastCalculatedSize = useRef<number>(pageSize);

    // Setup ResizeObserver for auto mode
    useLayoutEffect(() => {
        if (!isAutoMode || !containerRef.current) return;

        const updatePageSize = () => {
            const newSize = calculateOptimalRows();
            if (newSize !== lastCalculatedSize.current && newSize > 0) {
                lastCalculatedSize.current = newSize;
                setPageSize(newSize);
                setCurrentPage(1); // Reset to first page on resize
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
    }, [isAutoMode, calculateOptimalRows, containerRef]);

    // Handle page size change from user selection
    const handlePageSizeChange = useCallback((value: string) => {
        if (value === "auto") {
            setIsAutoMode(true);
            const autoSize = calculateOptimalRows();
            setPageSize(autoSize);
            lastCalculatedSize.current = autoSize;
        } else {
            setIsAutoMode(false);
            setPageSize(Number(value));
        }
        setCurrentPage(1);
    }, [calculateOptimalRows]);

    return {
        containerRef,
        tableBodyRef,
        headerRef,
        paginationRef,
        currentPage,
        setCurrentPage,
        pageSize,
        isAutoMode,
        handlePageSizeChange,
        pageSizeOptions: PAGE_SIZE_OPTIONS,
    };
}
