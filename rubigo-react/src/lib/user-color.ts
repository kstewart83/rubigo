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
 * @returns HSL color string suitable for backgrounds, e.g., "hsl(210, 35%, 95%)"
 */
export function getUserColor(userId: string): string {
    const hash = hashString(userId);
    const hueIndex = hash % COLOR_HUES.length;
    const hue = COLOR_HUES[hueIndex];

    // Fixed saturation and lightness for subtle, professional look
    // Saturation: 30-40% for muted colors
    // Lightness: 93-96% for subtle backgrounds
    const saturation = 35;
    const lightness = 94;

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
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
