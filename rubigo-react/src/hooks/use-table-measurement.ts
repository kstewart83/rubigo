"use client";

import { useRef, useCallback } from "react";

// Default fallbacks if measurement not available
const DEFAULT_ROW_HEIGHT = 49;
const DEFAULT_OVERHEAD = 160;

export interface UseTableMeasurementOptions {
    /** Additional buffer to add to overhead calculation (accounts for padding, margins, borders) */
    additionalBuffer?: number;
    /** Minimum number of rows to calculate */
    minRows?: number;
}

export interface UseTableMeasurementReturn {
    /** Ref to attach to the main container div */
    containerRef: React.RefObject<HTMLDivElement | null>;
    /** Ref to attach to the table body element */
    tableBodyRef: React.RefObject<HTMLTableSectionElement | null>;
    /** Ref to attach to the header element (breadcrumbs, toolbar, etc.) */
    headerRef: React.RefObject<HTMLDivElement | null>;
    /** Ref to attach to the pagination footer element */
    paginationRef: React.RefObject<HTMLDivElement | null>;
    /** Measure the height of a table row */
    measureRowHeight: () => number;
    /** Measure total overhead (header + footer + table header + buffer) */
    measureOverhead: () => number;
    /** Calculate optimal number of rows that fit in the container */
    calculateOptimalRows: () => number;
}

/**
 * Shared utility hook for measuring table dimensions.
 * Provides refs and measurement functions for calculating optimal row counts.
 * 
 * Usage:
 * 1. Attach containerRef to the main scrollable container
 * 2. Attach tableBodyRef to the <tbody> or TableBody element
 * 3. Attach headerRef to the header/toolbar area
 * 4. Attach paginationRef to the pagination footer
 * 5. Call calculateOptimalRows() to get the number of rows that fit
 */
export function useTableMeasurement(options: UseTableMeasurementOptions = {}): UseTableMeasurementReturn {
    const {
        additionalBuffer = 70,
        minRows = 5,
    } = options;

    // Refs for measuring DOM elements
    const containerRef = useRef<HTMLDivElement>(null);
    const tableBodyRef = useRef<HTMLTableSectionElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const paginationRef = useRef<HTMLDivElement>(null);

    // Measure actual row height from rendered content
    const measureRowHeight = useCallback((): number => {
        const firstRow = tableBodyRef.current?.querySelector('tr');
        if (firstRow) {
            return firstRow.getBoundingClientRect().height;
        }
        return DEFAULT_ROW_HEIGHT;
    }, []);

    // Measure overhead (header + pagination footer + table header + buffer)
    const measureOverhead = useCallback((): number => {
        let overhead = 0;

        // Measure header area (breadcrumbs, search, buttons)
        if (headerRef.current) {
            overhead += headerRef.current.getBoundingClientRect().height;
        }

        // Measure pagination footer
        if (paginationRef.current) {
            overhead += paginationRef.current.getBoundingClientRect().height;
        }

        // Measure table header row (thead)
        const tableHeader = tableBodyRef.current?.parentElement?.querySelector('thead');
        if (tableHeader) {
            overhead += tableHeader.getBoundingClientRect().height;
        }

        // Add padding/margins buffer
        overhead += additionalBuffer;

        return overhead > 0 ? overhead : DEFAULT_OVERHEAD;
    }, [additionalBuffer]);

    // Calculate optimal number of rows that fit in the container
    const calculateOptimalRows = useCallback((): number => {
        if (!containerRef.current) return minRows;

        const containerHeight = containerRef.current.clientHeight;
        const overhead = measureOverhead();
        const rowHeight = measureRowHeight();
        const availableHeight = containerHeight - overhead;
        const fittingRows = Math.floor(availableHeight / rowHeight);

        return Math.max(minRows, fittingRows);
    }, [measureOverhead, measureRowHeight, minRows]);

    return {
        containerRef,
        tableBodyRef,
        headerRef,
        paginationRef,
        measureRowHeight,
        measureOverhead,
        calculateOptimalRows,
    };
}
