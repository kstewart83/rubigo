//! Button Component WASM Entry Point
//!
//! Implements button with loading, disabled, and pressed states.

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

/// Button context - the extended state
#[derive(Debug, Clone, Serialize, Deserialize)]
#[wasm_bindgen]
pub struct ButtonContext {
    pub disabled: bool,
    pub loading: bool,
    pub pressed: bool,
    pub focused: bool,
}

#[wasm_bindgen]
impl ButtonContext {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            disabled: false,
            loading: false,
            pressed: false,
            focused: false,
        }
    }
}

impl Default for ButtonContext {
    fn default() -> Self {
        Self::new()
    }
}

/// Button state machine states
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum ButtonState {
    Idle,
    Pressed,
    Loading,
}

impl Default for ButtonState {
    fn default() -> Self {
        Self::Idle
    }
}

/// Button component - wraps state machine and context
#[wasm_bindgen]
pub struct Button {
    context: ButtonContext,
    state: ButtonState,
}

#[wasm_bindgen]
impl Button {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            context: ButtonContext::new(),
            state: ButtonState::Idle,
        }
    }

    /// Create with initial disabled state
    pub fn with_disabled(disabled: bool) -> Self {
        let mut button = Self::new();
        button.context.disabled = disabled;
        button
    }

    // === Getters ===

    pub fn disabled(&self) -> bool {
        self.context.disabled
    }

    pub fn loading(&self) -> bool {
        self.context.loading
    }

    pub fn pressed(&self) -> bool {
        self.context.pressed
    }

    pub fn focused(&self) -> bool {
        self.context.focused
    }

    pub fn state_name(&self) -> String {
        match self.state {
            ButtonState::Idle => "idle".to_string(),
            ButtonState::Pressed => "pressed".to_string(),
            ButtonState::Loading => "loading".to_string(),
        }
    }

    // === Setters ===

    pub fn set_disabled(&mut self, disabled: bool) {
        self.context.disabled = disabled;
    }

    // === Guards ===

    fn can_activate(&self) -> bool {
        !self.context.disabled && !self.context.loading
    }

    // === Events ===

    /// Event: PRESS_DOWN - Start pressing the button
    pub fn press_down(&mut self) -> bool {
        if self.state == ButtonState::Idle && self.can_activate() {
            self.context.pressed = true;
            self.state = ButtonState::Pressed;
            true
        } else {
            false
        }
    }

    /// Event: PRESS_UP - Release the button (triggers action)
    /// Returns true if the button was activated
    pub fn press_up(&mut self) -> bool {
        if self.state == ButtonState::Pressed {
            self.context.pressed = false;
            self.state = ButtonState::Idle;
            true // Action triggered!
        } else {
            false
        }
    }

    /// Event: CANCEL_PRESS - Cancel press without triggering action
    pub fn cancel_press(&mut self) -> bool {
        if self.state == ButtonState::Pressed {
            self.context.pressed = false;
            self.state = ButtonState::Idle;
            true
        } else {
            false
        }
    }

    /// Event: CLICK - Immediate activation (for Enter key)
    /// Returns true if the button was activated
    pub fn click(&mut self) -> bool {
        if self.state == ButtonState::Idle && self.can_activate() {
            true // Action triggered!
        } else {
            false
        }
    }

    /// Event: START_LOADING - Enter loading state
    pub fn start_loading(&mut self) -> bool {
        if self.state == ButtonState::Idle && !self.context.disabled {
            self.context.loading = true;
            self.state = ButtonState::Loading;
            true
        } else {
            false
        }
    }

    /// Event: STOP_LOADING - Exit loading state
    pub fn stop_loading(&mut self) -> bool {
        if self.state == ButtonState::Loading {
            self.context.loading = false;
            self.state = ButtonState::Idle;
            true
        } else {
            false
        }
    }

    /// Event: FOCUS
    pub fn focus(&mut self) {
        self.context.focused = true;
    }

    /// Event: BLUR
    pub fn blur(&mut self) {
        self.context.focused = false;
    }

    /// Event: RESET - Reset to initial state (global event)
    pub fn reset(&mut self) {
        self.context.disabled = false;
        self.context.loading = false;
        self.context.pressed = false;
        self.context.focused = false;
        self.state = ButtonState::Idle;
    }

    /// Handle keyboard events
    /// Returns true if action should be triggered
    pub fn keydown(&mut self, key: &str) -> bool {
        if !self.can_activate() {
            return false;
        }

        match key {
            "Enter" => self.click(),
            " " => {
                self.press_down();
                false // Space triggers on keyup
            }
            _ => false,
        }
    }

    /// Handle keyboard keyup events
    /// Returns true if action should be triggered
    pub fn keyup(&mut self, key: &str) -> bool {
        if key == " " {
            self.press_up()
        } else {
            false
        }
    }

    /// Get ARIA attributes as JSON
    pub fn aria_attrs(&self) -> String {
        format!(
            r#"{{"role":"button","aria-disabled":"{}","aria-busy":"{}","tabindex":"{}"}}"#,
            self.context.disabled,
            self.context.loading,
            if self.context.disabled { -1 } else { 0 }
        )
    }
}

impl Default for Button {
    fn default() -> Self {
        Self::new()
    }
}

/// Binary entry point (required for binary target)
fn main() {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_initial_state() {
        let button = Button::new();
        assert!(!button.disabled());
        assert!(!button.loading());
        assert!(!button.pressed());
        assert_eq!(button.state_name(), "idle");
    }

    #[test]
    fn test_press_cycle() {
        let mut button = Button::new();

        assert!(button.press_down());
        assert!(button.pressed());
        assert_eq!(button.state_name(), "pressed");

        let triggered = button.press_up();
        assert!(triggered);
        assert!(!button.pressed());
        assert_eq!(button.state_name(), "idle");
    }

    #[test]
    fn test_disabled_blocks_press() {
        let mut button = Button::with_disabled(true);

        assert!(!button.press_down());
        assert!(!button.pressed());
    }

    #[test]
    fn test_loading_state() {
        let mut button = Button::new();

        assert!(button.start_loading());
        assert!(button.loading());
        assert_eq!(button.state_name(), "loading");

        // Loading blocks activation
        assert!(!button.click());

        assert!(button.stop_loading());
        assert!(!button.loading());
        assert_eq!(button.state_name(), "idle");
    }

    #[test]
    fn test_reset() {
        let mut button = Button::new();
        button.set_disabled(true);
        button.focus();

        button.reset();

        assert!(!button.disabled());
        assert!(!button.focused());
        assert_eq!(button.state_name(), "idle");
    }
}
