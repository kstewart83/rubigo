"use client";

import { useState, useMemo, useRef } from "react";

interface InitializationFormProps {
    wordList: string[];
    onInitialize: (words: string[]) => Promise<boolean>;
}

export function InitializationForm({ wordList, onInitialize }: InitializationFormProps) {
    const [words, setWords] = useState<string[]>(["", "", "", ""]);
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Filter word list based on current input
    const getFilteredWords = (index: number) => {
        const input = words[index].toLowerCase().trim();
        if (!input) return wordList.slice(0, 10); // Show first 10 when empty
        return wordList.filter((w) => w.startsWith(input)).slice(0, 10);
    };

    const updateWord = (index: number, value: string) => {
        const newWords = [...words];
        newWords[index] = value.toLowerCase().trim();
        setWords(newWords);
        setError(null);
    };

    const selectWord = (index: number, word: string) => {
        updateWord(index, word);
        setFocusedIndex(null);

        // Move to next input after a brief delay
        setTimeout(() => {
            if (index < 3) {
                inputRefs.current[index + 1]?.focus();
            }
        }, 50);
    };

    const handleInputFocus = (index: number) => {
        setFocusedIndex(index);
    };

    const handleInputBlur = (index: number) => {
        // Delay closing dropdown to allow click on dropdown item
        setTimeout(() => {
            setFocusedIndex((current) => (current === index ? null : current));
        }, 150);
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        const filtered = getFilteredWords(index);

        if (e.key === "Tab" && filtered.length > 0 && words[index]) {
            // Auto-complete with first match on Tab
            const firstMatch = filtered.find((w) => w.startsWith(words[index].toLowerCase()));
            if (firstMatch && firstMatch !== words[index]) {
                e.preventDefault();
                selectWord(index, firstMatch);
            }
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (filtered.length > 0 && words[index]) {
                const firstMatch = filtered.find((w) => w.startsWith(words[index].toLowerCase()));
                if (firstMatch) {
                    selectWord(index, firstMatch);
                }
            } else if (index === 3 && words.every((w) => w)) {
                handleSubmit();
            }
        } else if (e.key === "ArrowDown" && filtered.length > 0) {
            e.preventDefault();
            // Could implement dropdown navigation here
        }
    };

    const handleDropdownClick = (index: number, word: string) => {
        selectWord(index, word);
    };

    const handleSubmit = async () => {
        // Validate all words are filled
        const trimmedWords = words.map((w) => w.trim().toLowerCase());

        if (trimmedWords.some((w) => !w)) {
            setError("Please enter all four words");
            return;
        }

        // Validate all words are in the list
        const invalidWord = trimmedWords.find((w) => !wordList.includes(w));
        if (invalidWord) {
            setError(`"${invalidWord}" is not a valid word`);
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const success = await onInitialize(trimmedWords);

        if (success) {
            // Reload page to show authenticated state
            window.location.reload();
        } else {
            setError("Invalid initialization phrase. Please check the server logs for the correct words.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Instructions */}
            <div className="text-center space-y-2">
                <h2 className="text-lg md:text-xl font-semibold text-white">System Initialization</h2>
                <p className="text-zinc-400 text-sm max-w-sm mx-auto">
                    Enter the 4-word phrase from the server console log to initialize the system
                </p>
            </div>

            {/* Word inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {words.map((word, index) => {
                    const filtered = getFilteredWords(index);
                    const showDropdown = focusedIndex === index && filtered.length > 0;

                    return (
                        <div key={index} className="relative">
                            <label className="block text-xs text-zinc-500 mb-1 ml-1">
                                Word {index + 1}
                            </label>
                            <input
                                ref={(el) => { inputRefs.current[index] = el; }}
                                type="text"
                                value={word}
                                onChange={(e) => updateWord(index, e.target.value)}
                                onFocus={() => handleInputFocus(index)}
                                onBlur={() => handleInputBlur(index)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                placeholder="type to search..."
                                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck={false}
                            />

                            {/* Dropdown */}
                            {showDropdown && (
                                <div className="absolute z-20 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl max-h-48 overflow-auto">
                                    {filtered.map((w) => (
                                        <button
                                            key={w}
                                            type="button"
                                            onMouseDown={(e) => {
                                                e.preventDefault(); // Prevent blur
                                                handleDropdownClick(index, w);
                                            }}
                                            className="w-full px-4 py-2 text-left text-zinc-200 hover:bg-zinc-700 first:rounded-t-lg last:rounded-b-lg transition-colors"
                                        >
                                            {w}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Error message */}
            {error && (
                <div className="text-red-400 text-sm text-center bg-red-950/30 border border-red-900 rounded-lg py-2">
                    {error}
                </div>
            )}

            {/* Submit button */}
            <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-3 md:py-4 rounded-xl font-semibold text-base md:text-lg transition-all duration-300 hover:scale-[1.02] active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{
                    background: "linear-gradient(135deg, rgba(255, 138, 101, 0.9) 0%, rgba(191, 54, 12, 0.9) 100%)",
                    boxShadow: "0 0 40px rgba(255, 138, 101, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
                }}
            >
                {isSubmitting ? "Initializing..." : "Initialize System"}
            </button>

            {/* Hint */}
            <p className="text-xs text-zinc-600 text-center">
                The initialization phrase is displayed in the server logs on startup.
                <br />
                Look for: <code className="text-zinc-500">INIT TOKEN: word1 word2 word3 word4</code>
            </p>
        </div>
    );
}
