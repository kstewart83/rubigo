// Switch Component Exports

// Config (shared by both implementations)
export { switchConfig, createSwitchConfig, type SwitchContext } from './config';

// SolidJS implementation
export { Switch, type SwitchProps } from './solid/Switch';
export { useSwitch, type UseSwitchOptions, type UseSwitchReturn } from './solid/useSwitch';

// Legacy Web Component (for backwards compatibility)
export { RubigoSwitch } from './rubigo-switch';
