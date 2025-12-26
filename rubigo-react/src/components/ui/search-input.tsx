"use client";

/**
 * Search Input - Input with inline clear button
 * 
 * A styled input with a small X icon on the right that appears when text is entered.
 * Clears the input when clicked. Works at all viewport sizes.
 */

import * as React from "react";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value: string;
    onChange: (value: string) => void;
    onClear?: () => void;
    className?: string;
    inputClassName?: string;
}

export function SearchInput({
    value,
    onChange,
    onClear,
    className,
    inputClassName,
    ...props
}: SearchInputProps) {
    const handleClear = () => {
        onChange("");
        onClear?.();
    };

    return (
        <div className={cn("relative", className)}>
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={cn("pr-8", inputClassName)}
                {...props}
            />
            {value && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    aria-label="Clear search"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}
