/**
 * User Color Utility
 * 
 * Generates consistent, subtle HSL colors for users based on their ID.
 * Colors are designed to be pastel/muted for use as message backgrounds.
 */

/**
 * Generate a consistent hash from a string
 */
function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

/**
 * Predefined hues that work well together (avoiding too similar colors)
 * Using golden angle distribution for optimal color spacing
 */
const COLOR_HUES = [
    210,  // Blue
    160,  // Teal
    280,  // Purple
    340,  // Pink
    45,   // Orange/Gold
    120,  // Green
    190,  // Cyan
    260,  // Violet
    20,   // Coral
    80,   // Lime
];

/**
 * Generate a subtle, consistent background color for a user
 * 
 * @param userId - The user's ID (typically personnel ID)
 * @param isDarkMode - Whether dark mode is active (affects lightness)
 * @returns HSL color string suitable for backgrounds, e.g., "hsl(210, 35%, 95%)"
 */
export function getUserColor(userId: string, isDarkMode: boolean = false): string {
    const hash = hashString(userId);
    const hueIndex = hash % COLOR_HUES.length;
    const hue = COLOR_HUES[hueIndex];

    // Subtle glassmorphism: very transparent backgrounds
    // Light mode: high lightness, very transparent
    // Dark mode: low lightness, transparent for glass effect
    const saturation = isDarkMode ? 20 : 30;
    const lightness = isDarkMode ? 20 : 95;
    const alpha = isDarkMode ? 0.4 : 0.5;

    return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
}

/**
 * Generate a slightly darker version for borders or accents
 */
export function getUserAccentColor(userId: string): string {
    const hash = hashString(userId);
    const hueIndex = hash % COLOR_HUES.length;
    const hue = COLOR_HUES[hueIndex];

    return `hsl(${hue}, 40%, 85%)`;
}

/**
 * Get raw color data for custom styling
 */
export function getUserColorData(userId: string): { hue: number; color: string; accent: string } {
    const hash = hashString(userId);
    const hueIndex = hash % COLOR_HUES.length;
    const hue = COLOR_HUES[hueIndex];

    return {
        hue,
        color: `hsl(${hue}, 35%, 94%)`,
        accent: `hsl(${hue}, 40%, 85%)`,
    };
}
