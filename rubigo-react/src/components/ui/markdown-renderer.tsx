"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { cn } from "@/lib/utils";
import "highlight.js/styles/github-dark.css";

// ============================================================================
// Types
// ============================================================================

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

// ============================================================================
// Callout Component
// ============================================================================

function Callout({ type, children }: { type: string; children: React.ReactNode }) {
    const styles: Record<string, { bg: string; border: string; icon: string }> = {
        NOTE: {
            bg: "bg-blue-500/10 dark:bg-blue-500/20",
            border: "border-blue-500",
            icon: "ℹ️",
        },
        TIP: {
            bg: "bg-green-500/10 dark:bg-green-500/20",
            border: "border-green-500",
            icon: "💡",
        },
        IMPORTANT: {
            bg: "bg-purple-500/10 dark:bg-purple-500/20",
            border: "border-purple-500",
            icon: "📌",
        },
        WARNING: {
            bg: "bg-amber-500/10 dark:bg-amber-500/20",
            border: "border-amber-500",
            icon: "⚠️",
        },
        CAUTION: {
            bg: "bg-red-500/10 dark:bg-red-500/20",
            border: "border-red-500",
            icon: "🚨",
        },
    };

    const style = styles[type] || styles.NOTE;

    return (
        <div className={cn(
            "my-4 p-4 rounded-lg border-l-4",
            style.bg,
            style.border
        )}>
            <div className="flex items-start gap-2">
                <span className="text-lg">{style.icon}</span>
                <div className="flex-1 prose-sm">{children}</div>
            </div>
        </div>
    );
}

// ============================================================================
// Custom Components for ReactMarkdown
// ============================================================================

const components = {
    // Handle GitHub-style callouts in blockquotes
    blockquote: ({ children, ...props }: React.ComponentPropsWithoutRef<"blockquote">) => {
        // Check if first child is a callout marker
        const childArray = Array.isArray(children) ? children : [children];
        const firstChild = childArray[0];

        if (typeof firstChild === "object" && firstChild !== null && "props" in firstChild) {
            const text = firstChild.props?.children;
            if (typeof text === "string" || (Array.isArray(text) && typeof text[0] === "string")) {
                const textContent = Array.isArray(text) ? text[0] : text;
                const calloutMatch = textContent.match?.(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/);
                if (calloutMatch) {
                    const type = calloutMatch[1];
                    // Remove the marker from content
                    const cleanedChildren = childArray.map((child, idx) => {
                        if (idx === 0 && typeof child === "object" && child !== null && "props" in child) {
                            const newText = Array.isArray(child.props.children)
                                ? [child.props.children[0].replace(calloutMatch[0], "").trim(), ...child.props.children.slice(1)]
                                : child.props.children.replace(calloutMatch[0], "").trim();
                            return { ...child, props: { ...child.props, children: newText } };
                        }
                        return child;
                    });
                    return <Callout type={type}>{cleanedChildren}</Callout>;
                }
            }
        }

        return (
            <blockquote
                className="border-l-4 border-muted-foreground/30 pl-4 italic text-muted-foreground my-4"
                {...props}
            >
                {children}
            </blockquote>
        );
    },

    // Tables
    table: ({ children, ...props }: React.ComponentPropsWithoutRef<"table">) => (
        <div className="my-4 overflow-x-auto rounded-lg border">
            <table className="w-full text-sm" {...props}>
                {children}
            </table>
        </div>
    ),
    thead: ({ children, ...props }: React.ComponentPropsWithoutRef<"thead">) => (
        <thead className="bg-muted/50 border-b" {...props}>
            {children}
        </thead>
    ),
    th: ({ children, ...props }: React.ComponentPropsWithoutRef<"th">) => (
        <th className="px-4 py-2 text-left font-medium" {...props}>
            {children}
        </th>
    ),
    td: ({ children, ...props }: React.ComponentPropsWithoutRef<"td">) => (
        <td className="px-4 py-2 border-t" {...props}>
            {children}
        </td>
    ),

    // Headings
    h1: ({ children, ...props }: React.ComponentPropsWithoutRef<"h1">) => (
        <h1 className="text-3xl font-bold tracking-tight mt-8 mb-4 first:mt-0" {...props}>
            {children}
        </h1>
    ),
    h2: ({ children, ...props }: React.ComponentPropsWithoutRef<"h2">) => (
        <h2 className="text-2xl font-semibold tracking-tight mt-8 mb-3 border-b pb-2" {...props}>
            {children}
        </h2>
    ),
    h3: ({ children, ...props }: React.ComponentPropsWithoutRef<"h3">) => (
        <h3 className="text-xl font-semibold mt-6 mb-2" {...props}>
            {children}
        </h3>
    ),
    h4: ({ children, ...props }: React.ComponentPropsWithoutRef<"h4">) => (
        <h4 className="text-lg font-medium mt-4 mb-2" {...props}>
            {children}
        </h4>
    ),

    // Paragraphs and lists
    p: ({ children, ...props }: React.ComponentPropsWithoutRef<"p">) => (
        <p className="leading-7 mb-4" {...props}>
            {children}
        </p>
    ),
    ul: ({ children, ...props }: React.ComponentPropsWithoutRef<"ul">) => (
        <ul className="list-disc pl-6 mb-4 space-y-1" {...props}>
            {children}
        </ul>
    ),
    ol: ({ children, ...props }: React.ComponentPropsWithoutRef<"ol">) => (
        <ol className="list-decimal pl-6 mb-4 space-y-1" {...props}>
            {children}
        </ol>
    ),
    li: ({ children, ...props }: React.ComponentPropsWithoutRef<"li">) => (
        <li className="leading-7" {...props}>
            {children}
        </li>
    ),

    // Code blocks
    pre: ({ children, ...props }: React.ComponentPropsWithoutRef<"pre">) => (
        <pre className="my-4 p-4 rounded-lg bg-zinc-950 text-zinc-50 overflow-x-auto text-sm" {...props}>
            {children}
        </pre>
    ),
    code: ({ children, className, ...props }: React.ComponentPropsWithoutRef<"code">) => {
        // Inline code vs block code
        const isInline = !className;
        if (isInline) {
            return (
                <code
                    className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono"
                    {...props}
                >
                    {children}
                </code>
            );
        }
        return <code className={className} {...props}>{children}</code>;
    },

    // Links
    a: ({ children, href, ...props }: React.ComponentPropsWithoutRef<"a">) => (
        <a
            href={href}
            className="text-primary underline underline-offset-4 hover:text-primary/80"
            {...props}
        >
            {children}
        </a>
    ),

    // Horizontal rule
    hr: (props: React.ComponentPropsWithoutRef<"hr">) => (
        <hr className="my-8 border-t" {...props} />
    ),

    // Strong and emphasis
    strong: ({ children, ...props }: React.ComponentPropsWithoutRef<"strong">) => (
        <strong className="font-semibold" {...props}>
            {children}
        </strong>
    ),
};

// ============================================================================
// Main Component
// ============================================================================

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
    return (
        <div className={cn("prose prose-slate dark:prose-invert max-w-none", className)}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={components}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
