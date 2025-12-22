/**
 * PowerPoint Export Utility
 * Uses PptxGenJS to export presentations to .pptx format
 */

import PptxGenJS from "pptxgenjs";

interface SlideData {
    slideId: number;
    title: string | null;
    layout: string | null;
    content: Record<string, unknown>;
    notes: string | null;
}

interface PresentationData {
    id: number;
    title: string;
    description: string | null;
    theme: string | null;
}

export interface ExportOptions {
    presentation: PresentationData;
    slides: SlideData[];
}

/**
 * Export a presentation to PowerPoint format
 */
export async function exportToPptx(options: ExportOptions): Promise<Blob> {
    const { presentation, slides } = options;

    // Create new presentation
    const pptx = new PptxGenJS();

    // Set presentation properties
    pptx.title = presentation.title;
    pptx.subject = presentation.description || "";
    pptx.author = "Rubigo Platform";

    // Set default slide size (16:9)
    pptx.defineLayout({ name: "LAYOUT_16x9", width: 10, height: 5.625 });
    pptx.layout = "LAYOUT_16x9";

    // Process each slide
    for (const slideData of slides) {
        const slide = pptx.addSlide();

        // Add speaker notes if present
        if (slideData.notes) {
            slide.addNotes(slideData.notes);
        }

        // Render based on layout
        switch (slideData.layout) {
            case "title":
                renderTitleSlide(slide, slideData);
                break;
            case "content":
                renderContentSlide(slide, slideData);
                break;
            case "two-column":
                renderTwoColumnSlide(slide, slideData);
                break;
            case "code":
                renderCodeSlide(slide, slideData);
                break;
            case "image":
                renderImageSlide(slide, slideData);
                break;
            case "blank":
                renderBlankSlide(slide, slideData);
                break;
            default:
                renderContentSlide(slide, slideData);
        }
    }

    // Generate the file as a Blob
    const blob = await pptx.write({ outputType: "blob" }) as Blob;
    return blob;
}

/**
 * Trigger download of the PowerPoint file
 */
export function downloadPptx(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".pptx") ? filename : `${filename}.pptx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ============================================================================
// Layout Renderers
// ============================================================================

function renderTitleSlide(slide: PptxGenJS.Slide, data: SlideData): void {
    const title = String(data.content?.title || data.title || "");
    const subtitle = String(data.content?.body || data.content?.subtitle || "");

    // Centered title
    slide.addText(title, {
        x: 0.5,
        y: 2,
        w: 9,
        h: 1.2,
        fontSize: 44,
        bold: true,
        align: "center",
        valign: "middle",
    });

    // Subtitle below
    if (subtitle) {
        slide.addText(subtitle, {
            x: 0.5,
            y: 3.2,
            w: 9,
            h: 0.8,
            fontSize: 24,
            color: "666666",
            align: "center",
            valign: "middle",
        });
    }
}

function renderContentSlide(slide: PptxGenJS.Slide, data: SlideData): void {
    const title = String(data.content?.title || data.title || "");
    const body = String(data.content?.body || "");

    // Title at top
    slide.addText(title, {
        x: 0.5,
        y: 0.3,
        w: 9,
        h: 0.8,
        fontSize: 32,
        bold: true,
    });

    // Body content
    if (body) {
        // Convert bullet points if present
        const lines = body.split("\n").map((line) => {
            const text = line.replace(/^[•\-\*]\s*/, "");
            const isBullet = line.match(/^[•\-\*]\s*/);
            return { text, options: isBullet ? { bullet: true } : {} };
        });

        slide.addText(lines, {
            x: 0.5,
            y: 1.3,
            w: 9,
            h: 4,
            fontSize: 18,
            valign: "top",
        });
    }
}

function renderTwoColumnSlide(slide: PptxGenJS.Slide, data: SlideData): void {
    const title = String(data.content?.title || data.title || "");
    const leftContent = String(data.content?.body || "");
    const rightContent = String(data.notes || "");

    // Title
    slide.addText(title, {
        x: 0.5,
        y: 0.3,
        w: 9,
        h: 0.8,
        fontSize: 32,
        bold: true,
    });

    // Left column
    slide.addText(leftContent, {
        x: 0.5,
        y: 1.3,
        w: 4.25,
        h: 4,
        fontSize: 16,
        valign: "top",
    });

    // Right column
    slide.addText(rightContent, {
        x: 5.25,
        y: 1.3,
        w: 4.25,
        h: 4,
        fontSize: 16,
        valign: "top",
    });
}

function renderCodeSlide(slide: PptxGenJS.Slide, data: SlideData): void {
    const title = String(data.content?.title || data.title || "");
    const code = String(data.content?.body || "");

    // Title
    slide.addText(title, {
        x: 0.5,
        y: 0.3,
        w: 9,
        h: 0.6,
        fontSize: 24,
        bold: true,
    });

    // Code block with dark background
    slide.addShape("rect", {
        x: 0.5,
        y: 1.1,
        w: 9,
        h: 4.2,
        fill: { color: "1e1e1e" },
    });

    slide.addText(code, {
        x: 0.7,
        y: 1.3,
        w: 8.6,
        h: 4,
        fontSize: 12,
        fontFace: "Courier New",
        color: "4ec9b0",
        valign: "top",
    });
}

function renderImageSlide(slide: PptxGenJS.Slide, data: SlideData): void {
    const caption = String(data.content?.title || data.title || "");
    const imageUrl = String(data.content?.body || "");

    // Try to add image if URL is provided
    if (imageUrl && imageUrl.startsWith("http")) {
        try {
            slide.addImage({
                path: imageUrl,
                x: 1,
                y: 0.5,
                w: 8,
                h: 4.5,
            });
        } catch {
            // If image fails, add placeholder
            slide.addText("[Image: " + imageUrl + "]", {
                x: 1,
                y: 2,
                w: 8,
                h: 1,
                fontSize: 14,
                color: "999999",
                align: "center",
            });
        }
    }

    // Caption at bottom
    if (caption) {
        slide.addText(caption, {
            x: 0.5,
            y: 5,
            w: 9,
            h: 0.5,
            fontSize: 18,
            align: "center",
        });
    }
}

function renderBlankSlide(slide: PptxGenJS.Slide, data: SlideData): void {
    const content = String(data.content?.body || "");

    if (content) {
        slide.addText(content, {
            x: 0.5,
            y: 0.5,
            w: 9,
            h: 4.625,
            fontSize: 18,
            valign: "top",
        });
    }
}
