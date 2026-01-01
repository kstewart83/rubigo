// Switch Component Exports

// Config (shared by both implementations)
export { switchConfig, createSwitchConfig, type SwitchContext } from './config';

// SolidJS implementation
export { Switch, type SwitchProps } from './bindings/solid/Switch';
export { useSwitch, type UseSwitchOptions, type UseSwitchReturn } from './bindings/solid/useSwitch';

// Legacy Web Component (for backwards compatibility)
export { RubigoSwitch } from './rubigo-switch';
