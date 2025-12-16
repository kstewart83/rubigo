"use client";

import { useState, useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface EntityDetailPanelProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    onSave?: () => void;
    onDelete?: () => void;
    isEditing?: boolean;
    onEditToggle?: () => void;
}

export function EntityDetailPanel({
    isOpen,
    onClose,
    title,
    children,
    onSave,
    onDelete,
    isEditing = false,
    onEditToggle,
}: EntityDetailPanelProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Small delay for animation
            requestAnimationFrame(() => setIsVisible(true));
        } else {
            setIsVisible(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/30 z-40 transition-opacity ${isVisible ? "opacity-100" : "opacity-0"
                    }`}
                onClick={onClose}
            />

            {/* Panel */}
            <div
                className={`fixed right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 z-50 shadow-xl transition-transform duration-200 ${isVisible ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        {title}
                    </h2>
                    <div className="flex items-center gap-2">
                        {onEditToggle && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onEditToggle}
                            >
                                {isEditing ? "Cancel" : "Edit"}
                            </Button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                        >
                            <span className="text-xl">×</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto h-[calc(100%-8rem)]">
                    {children}
                </div>

                {/* Footer */}
                {(onSave || onDelete) && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex justify-between">
                        {onDelete && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={onDelete}
                            >
                                Delete
                            </Button>
                        )}
                        {onSave && isEditing && (
                            <Button
                                variant="default"
                                size="sm"
                                onClick={onSave}
                                className="ml-auto"
                            >
                                Save Changes
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

// ============================================================================
// Form Field Components
// ============================================================================

interface FormFieldProps {
    label: string;
    children: ReactNode;
}

export function FormField({ label, children }: FormFieldProps) {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {label}
            </label>
            {children}
        </div>
    );
}

interface TextInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export function TextInput({ value, onChange, placeholder, disabled }: TextInputProps) {
    return (
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
    );
}

interface TextAreaProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    rows?: number;
}

export function TextArea({ value, onChange, placeholder, disabled, rows = 3 }: TextAreaProps) {
    return (
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
        />
    );
}

interface SelectInputProps {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    disabled?: boolean;
}

export function SelectInput({ value, onChange, options, disabled }: SelectInputProps) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
}

interface NumberInputProps {
    value: number | undefined;
    onChange: (value: number | undefined) => void;
    placeholder?: string;
    disabled?: boolean;
    min?: number;
    max?: number;
    step?: number;
}

export function NumberInput({
    value,
    onChange,
    placeholder,
    disabled,
    min,
    max,
    step = 1,
}: NumberInputProps) {
    return (
        <input
            type="number"
            value={value ?? ""}
            onChange={(e) => {
                const val = e.target.value;
                onChange(val === "" ? undefined : Number(val));
            }}
            placeholder={placeholder}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
    );
}

// ============================================================================
// Display Components (Read-only view)
// ============================================================================

interface DisplayFieldProps {
    label: string;
    value: string | number | undefined;
}

export function DisplayField({ label, value }: DisplayFieldProps) {
    return (
        <div className="mb-3">
            <div className="text-xs text-zinc-500 uppercase tracking-wide mb-0.5">
                {label}
            </div>
            <div className="text-zinc-900 dark:text-zinc-100">
                {value ?? <span className="text-zinc-400 italic">Not set</span>}
            </div>
        </div>
    );
}
