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

export function PresenterViewContent({ presentationId }: Props) {
    const router = useRouter();
    const [presentation, setPresentation] = useState<Presentation | null>(null);
    const [slides, setSlides] = useState<Slide[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [elapsedTime, setElapsedTime] = useState(0);
    const [startTime] = useState(Date.now());

    // Fetch presentation data
    useEffect(() => {
        fetchPresentation();
    }, [presentationId]);

    // Update clock every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
            setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);
        return () => clearInterval(timer);
    }, [startTime]);

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
                case "Escape":
                    router.push(`/presentations/${presentationId}`);
                    break;
                case "Home":
                    setCurrentSlide(0);
                    break;
                case "End":
                    setCurrentSlide(slides.length - 1);
                    break;
            }
        },
        [slides.length, presentationId, router]
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const formatElapsed = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const slide = slides[currentSlide];
    const nextSlide = slides[currentSlide + 1];

    if (loading) {
        return (
            <div
                data-testid="presenter-view"
                className="fixed inset-0 bg-gray-900 flex items-center justify-center"
            >
                <p className="text-white text-2xl">Loading...</p>
            </div>
        );
    }

    return (
        <div
            data-testid="presenter-view"
            className="fixed inset-0 bg-gray-900 flex flex-col p-4 text-white"
        >
            {/* Top bar with clock */}
            <div className="flex justify-between items-center mb-4 px-4">
                <div>
                    <span className="text-2xl font-mono" data-testid="current-time">
                        {formatTime(currentTime)}
                    </span>
                    <span className="text-gray-400 ml-4">
                        Elapsed: {formatElapsed(elapsedTime)}
                    </span>
                </div>
                <div className="text-xl">
                    {presentation?.title}
                </div>
                <div data-testid="slide-counter" className="text-xl">
                    Slide {currentSlide + 1} / {slides.length}
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex gap-4 min-h-0">
                {/* Current slide (large) */}
                <div className="flex-1 flex flex-col">
                    <h3 className="text-sm text-gray-400 mb-2">Current Slide</h3>
                    <div
                        data-testid="current-slide"
                        className={`flex-1 rounded-lg p-8 flex flex-col justify-center ${presentation?.theme === "light"
                                ? "bg-white text-gray-900"
                                : "bg-gray-800 text-white"
                            }`}
                    >
                        {slide ? (
                            <>
                                <h1 className="text-4xl font-bold mb-4">
                                    {(slide.content?.title as string) || slide.title || ""}
                                </h1>
                                {slide.content?.subtitle && (
                                    <p className="text-2xl text-gray-400">
                                        {slide.content.subtitle as string}
                                    </p>
                                )}
                                {slide.content?.body && (
                                    <div className="text-xl whitespace-pre-wrap">
                                        {slide.content.body as string}
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="text-gray-400">No slides</p>
                        )}
                    </div>
                </div>

                {/* Right panel: Next slide + Notes */}
                <div className="w-80 flex flex-col gap-4">
                    {/* Next slide preview */}
                    <div className="flex-shrink-0">
                        <h3 className="text-sm text-gray-400 mb-2">Next Slide</h3>
                        <div
                            data-testid="next-slide"
                            className={`aspect-video rounded-lg p-4 flex flex-col justify-center ${presentation?.theme === "light"
                                    ? "bg-white text-gray-900"
                                    : "bg-gray-800 text-white"
                                }`}
                        >
                            {nextSlide ? (
                                <>
                                    <h2 className="text-lg font-bold mb-2">
                                        {(nextSlide.content?.title as string) || nextSlide.title || ""}
                                    </h2>
                                    {nextSlide.content?.body && (
                                        <p className="text-sm text-gray-400 line-clamp-3">
                                            {nextSlide.content.body as string}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p className="text-gray-500 text-center">End of presentation</p>
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="flex-1 min-h-0">
                        <h3 className="text-sm text-gray-400 mb-2">Notes</h3>
                        <div
                            data-testid="presenter-notes"
                            className="h-full bg-gray-800 rounded-lg p-4 overflow-y-auto"
                        >
                            {slide?.notes ? (
                                <p className="whitespace-pre-wrap">{slide.notes}</p>
                            ) : (
                                <p className="text-gray-500 italic">No notes for this slide</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom navigation */}
            <div className="mt-4 flex justify-center items-center gap-4">
                <button
                    className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg disabled:opacity-50"
                    disabled={currentSlide === 0}
                    onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 0))}
                >
                    ← Previous
                </button>
                <div className="text-gray-400">
                    ← → to navigate • Esc to exit
                </div>
                <button
                    className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg disabled:opacity-50"
                    disabled={currentSlide >= slides.length - 1}
                    onClick={() =>
                        setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1))
                    }
                >
                    Next →
                </button>
            </div>
        </div>
    );
}
