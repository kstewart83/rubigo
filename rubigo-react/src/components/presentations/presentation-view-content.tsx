"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

// ============================================================================
// Types
// ============================================================================

interface Slide {
    slideId: number;
    title: string | null;
    layout: string | null;
    content: Record<string, unknown>;
    contentJson: string;
    notes: string | null;
    position: number;
    verticalPosition: number | null;
}

interface Presentation {
    id: number;
    title: string;
    theme: string | null;
    transition: string | null;
}

interface Props {
    presentationId: string;
}

// ============================================================================
// Main Component
// ============================================================================

export function PresentationViewContent({ presentationId }: Props) {
    const router = useRouter();
    const [presentation, setPresentation] = useState<Presentation | null>(null);
    const [slides, setSlides] = useState<Slide[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showOverview, setShowOverview] = useState(false);

    // Fetch presentation data
    useEffect(() => {
        fetchPresentation();
    }, [presentationId]);

    const fetchPresentation = async () => {
        try {
            const res = await fetch(`/api/presentations/${presentationId}`);
            if (res.ok) {
                const data = await res.json();
                setPresentation(data.presentation);
                setSlides(data.slides || []);
            }
        } catch (err) {
            console.error("Failed to fetch presentation:", err);
        } finally {
            setLoading(false);
        }
    };

    // Keyboard navigation
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            switch (e.key) {
                case "ArrowRight":
                case " ":
                case "Enter":
                    setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
                    break;
                case "ArrowLeft":
                case "Backspace":
                    setCurrentSlide((prev) => Math.max(prev - 1, 0));
                    break;
                case "ArrowDown":
                    // For vertical sub-slides (future)
                    setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
                    break;
                case "ArrowUp":
                    setCurrentSlide((prev) => Math.max(prev - 1, 0));
                    break;
                case "Escape":
                    if (showOverview) {
                        setShowOverview(false);
                    } else {
                        router.push(`/presentations/${presentationId}`);
                    }
                    break;
                case "o":
                case "O":
                    setShowOverview((prev) => !prev);
                    break;
                case "Home":
                    setCurrentSlide(0);
                    break;
                case "End":
                    setCurrentSlide(slides.length - 1);
                    break;
            }
        },
        [slides.length, showOverview, presentationId, router]
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // Request fullscreen on mount
    useEffect(() => {
        const requestFullscreen = async () => {
            try {
                if (document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen();
                }
            } catch (err) {
                // User may have denied fullscreen
                console.log("Fullscreen request was denied or failed");
            }
        };
        // Small delay to avoid immediate triggering
        const timer = setTimeout(requestFullscreen, 500);
        return () => clearTimeout(timer);
    }, []);

    const slide = slides[currentSlide];

    if (loading) {
        return (
            <div
                data-testid="presentation-view"
                className="fixed inset-0 bg-black flex items-center justify-center"
            >
                <p className="text-white text-2xl">Loading...</p>
            </div>
        );
    }

    // Overview grid mode
    if (showOverview) {
        return (
            <div
                data-testid="presentation-view"
                className="fixed inset-0 bg-black p-8 overflow-auto"
            >
                <div
                    data-testid="overview-grid"
                    className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-7xl mx-auto"
                >
                    {slides.map((s, index) => (
                        <div
                            key={s.slideId}
                            data-testid="overview-slide"
                            className={`cursor-pointer rounded-lg overflow-hidden border-4 transition-all ${index === currentSlide
                                ? "border-blue-500 scale-105"
                                : "border-transparent hover:border-gray-600"
                                }`}
                            onClick={() => {
                                setCurrentSlide(index);
                                setShowOverview(false);
                            }}
                        >
                            <div className="aspect-video bg-gray-900 p-4 flex flex-col items-center justify-center">
                                <span className="text-white text-xs mb-2">
                                    {index + 1}
                                </span>
                                <span className="text-white text-sm text-center truncate w-full">
                                    {s.title || "Untitled"}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="text-center text-gray-400 mt-8">
                    Press <kbd className="px-2 py-1 bg-gray-800 rounded">O</kbd> to
                    close overview or <kbd className="px-2 py-1 bg-gray-800 rounded">Esc</kbd> to exit
                </div>
            </div>
        );
    }

    // Main presentation view
    return (
        <div
            data-testid="presentation-view"
            className="fixed inset-0 bg-black flex flex-col"
        >
            {/* Slide Content */}
            <div
                data-testid="current-slide"
                className="flex-1 flex items-center justify-center p-4"
            >
                {slide ? (
                    <div
                        className={`w-full h-full max-w-[95vw] max-h-[85vh] rounded-lg shadow-2xl p-12 flex flex-col ${presentation?.theme === "light"
                            ? "bg-white text-gray-900"
                            : "bg-gray-900 text-white"
                            }`}
                    >
                        {/* Title Layout */}
                        {slide.layout === "title" && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                <h1 className="text-6xl font-bold mb-6">
                                    {(slide.content?.title as string) || slide.title || ""}
                                </h1>
                                {Boolean(slide.content?.body || slide.content?.subtitle) && (
                                    <p className="text-3xl text-gray-400">
                                        {String(slide.content?.body || slide.content?.subtitle || "")}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Content Layout */}
                        {slide.layout === "content" && (
                            <>
                                <h1 className="text-5xl font-bold mb-8">
                                    {(slide.content?.title as string) || slide.title || ""}
                                </h1>
                                {slide.content?.body && (
                                    <div className="text-2xl whitespace-pre-wrap leading-relaxed flex-1">
                                        {slide.content.body as string}
                                    </div>
                                )}
                            </>
                        )}

                        {/* Two-Column Layout */}
                        {slide.layout === "two-column" && (
                            <>
                                <h1 className="text-4xl font-bold mb-6">
                                    {(slide.content?.title as string) || slide.title || ""}
                                </h1>
                                <div className="flex-1 grid grid-cols-2 gap-8">
                                    <div className="text-xl whitespace-pre-wrap">
                                        {slide.content?.body as string}
                                    </div>
                                    <div className="text-xl whitespace-pre-wrap text-gray-400">
                                        {slide.notes || ""}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Code Layout */}
                        {slide.layout === "code" && (
                            <>
                                <h1 className="text-3xl font-bold mb-4">
                                    {(slide.content?.title as string) || slide.title || ""}
                                </h1>
                                <div className="flex-1 bg-black rounded-lg p-6 overflow-auto">
                                    <pre className="font-mono text-lg text-green-400 whitespace-pre-wrap">
                                        {slide.content?.body as string}
                                    </pre>
                                </div>
                            </>
                        )}

                        {/* Image Layout */}
                        {slide.layout === "image" && (
                            <div className="flex-1 flex flex-col items-center justify-center">
                                {Boolean(slide.content?.body) && (
                                    <img
                                        src={String(slide.content.body)}
                                        alt={slide.title || "Slide image"}
                                        className="max-h-full max-w-full object-contain rounded-lg"
                                    />
                                )}
                                {Boolean(slide.content?.title) && (
                                    <p className="text-2xl mt-4 text-center">
                                        {String(slide.content.title)}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Blank Layout */}
                        {slide.layout === "blank" && (
                            <div className="flex-1 flex items-center justify-center text-2xl whitespace-pre-wrap">
                                {slide.content?.body as string}
                            </div>
                        )}

                        {/* Fallback for unknown layouts */}
                        {!["title", "content", "two-column", "code", "image", "blank"].includes(slide.layout || "") && (
                            <>
                                <h1 className="text-5xl font-bold mb-8">
                                    {(slide.content?.title as string) || slide.title || ""}
                                </h1>
                                {slide.content?.subtitle && (
                                    <p className="text-3xl text-gray-400 mb-4">
                                        {slide.content.subtitle as string}
                                    </p>
                                )}
                                {slide.content?.body && (
                                    <div className="text-2xl whitespace-pre-wrap leading-relaxed">
                                        {slide.content.body as string}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    <div className="text-white text-2xl">No slides</div>
                )}
            </div>

            {/* Progress indicator */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-4 text-white/60">
                <span data-testid="slide-counter" className="text-lg">
                    {currentSlide + 1} / {slides.length}
                </span>
            </div>

            {/* Navigation hints (fade out after a few seconds) */}
            <div className="absolute bottom-4 right-4 text-white/40 text-sm">
                ← → navigate • O overview • Esc exit
            </div>

            {/* Click zones for navigation */}
            <div
                className="absolute left-0 top-0 bottom-0 w-1/4 cursor-pointer"
                onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 0))}
            />
            <div
                className="absolute right-0 top-0 bottom-0 w-1/4 cursor-pointer"
                onClick={() =>
                    setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1))
                }
            />
        </div>
    );
}
