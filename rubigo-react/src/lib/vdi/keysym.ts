/**
 * X11 Keysym Mapping
 * 
 * Maps browser KeyboardEvent.key values to X11 keysyms for Guacamole protocol.
 */

// Common keysym values from X11
const KEYSYM_SPECIAL: Record<string, number> = {
    // Modifier keys
    'Shift': 0xFFE1,
    'Control': 0xFFE3,
    'Alt': 0xFFE9,
    'Meta': 0xFFEB,
    'CapsLock': 0xFFE5,
    'NumLock': 0xFF7F,
    'ScrollLock': 0xFF14,

    // Navigation
    'Backspace': 0xFF08,
    'Tab': 0xFF09,
    'Enter': 0xFF0D,
    'Escape': 0xFF1B,
    'Delete': 0xFFFF,
    'Insert': 0xFF63,
    'Home': 0xFF50,
    'End': 0xFF57,
    'PageUp': 0xFF55,
    'PageDown': 0xFF56,

    // Arrow keys
    'ArrowLeft': 0xFF51,
    'ArrowUp': 0xFF52,
    'ArrowRight': 0xFF53,
    'ArrowDown': 0xFF54,

    // Function keys
    'F1': 0xFFBE,
    'F2': 0xFFBF,
    'F3': 0xFFC0,
    'F4': 0xFFC1,
    'F5': 0xFFC2,
    'F6': 0xFFC3,
    'F7': 0xFFC4,
    'F8': 0xFFC5,
    'F9': 0xFFC6,
    'F10': 0xFFC7,
    'F11': 0xFFC8,
    'F12': 0xFFC9,

    // Space
    ' ': 0x0020,
};

/**
 * Convert a browser KeyboardEvent to an X11 keysym
 */
export function keyToKeysym(event: KeyboardEvent): number | null {
    const key = event.key;

    // Check special keys first
    if (KEYSYM_SPECIAL[key] !== undefined) {
        return KEYSYM_SPECIAL[key];
    }

    // Single character - use Unicode code point
    if (key.length === 1) {
        const codePoint = key.charCodeAt(0);

        // ASCII printable characters map directly
        if (codePoint >= 0x20 && codePoint <= 0x7E) {
            return codePoint;
        }

        // Unicode characters use Unicode keysym range (0x01000000 + code point)
        if (codePoint >= 0x100) {
            return 0x01000000 | codePoint;
        }

        return codePoint;
    }

    // Unknown key
    return null;
}

/**
 * Convert mouse button to Guacamole button mask
 * Guacamole uses bit positions: 0=left, 1=middle, 2=right, 3=scroll up, 4=scroll down
 */
export function mouseButtonMask(buttons: number, deltaY?: number): number {
    let mask = 0;

    // Map browser button bits to Guacamole bits
    if (buttons & 1) mask |= (1 << 0); // Left
    if (buttons & 4) mask |= (1 << 1); // Middle
    if (buttons & 2) mask |= (1 << 2); // Right

    // Scroll wheel
    if (deltaY !== undefined) {
        if (deltaY < 0) mask |= (1 << 3); // Scroll up
        if (deltaY > 0) mask |= (1 << 4); // Scroll down
    }

    return mask;
}
