/**
 * Button Component Exports
 *
 * Default exports from SolidJS bindings.
 * Import from './solid' or './web-component' for framework-specific bindings.
 */

// Re-export SolidJS bindings as default
export { Button, useButton, type UseButtonOptions, type UseButtonReturn } from './solid';

// Export config for custom implementations
export { buttonConfig, createButtonConfig, type ButtonContext } from './config';
