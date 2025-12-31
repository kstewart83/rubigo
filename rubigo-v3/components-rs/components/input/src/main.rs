//! Input Component WASM Entry Point
//!
//! Implements text input with focus, disabled, and validation states.

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

/// Input context - the extended state
#[derive(Debug, Clone, Serialize, Deserialize)]
#[wasm_bindgen]
pub struct InputContext {
    #[wasm_bindgen(skip)]
    pub value: String,
    pub disabled: bool,
    pub read_only: bool,
    pub focused: bool,
    #[wasm_bindgen(skip)]
    pub error: String,
}

#[wasm_bindgen]
impl InputContext {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            value: String::new(),
            disabled: false,
            read_only: false,
            focused: false,
            error: String::new(),
        }
    }

    #[wasm_bindgen(getter)]
    pub fn value(&self) -> String {
        self.value.clone()
    }

    #[wasm_bindgen(setter)]
    pub fn set_value(&mut self, value: String) {
        self.value = value;
    }

    #[wasm_bindgen(getter)]
    pub fn error(&self) -> String {
        self.error.clone()
    }

    #[wasm_bindgen(setter)]
    pub fn set_error(&mut self, error: String) {
        self.error = error;
    }
}

impl Default for InputContext {
    fn default() -> Self {
        Self::new()
    }
}

/// Input state machine states
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum InputState {
    Idle,
    Focused,
    Disabled,
}

impl Default for InputState {
    fn default() -> Self {
        Self::Idle
    }
}

/// Input component - wraps state machine and context
#[wasm_bindgen]
pub struct Input {
    context: InputContext,
    state: InputState,
}

#[wasm_bindgen]
impl Input {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            context: InputContext::new(),
            state: InputState::Idle,
        }
    }

    /// Create with initial value
    pub fn with_value(value: &str) -> Self {
        let mut input = Self::new();
        input.context.value = value.to_string();
        input
    }

    /// Create with initial disabled state
    pub fn with_disabled(disabled: bool) -> Self {
        let mut input = Self::new();
        input.context.disabled = disabled;
        if disabled {
            input.state = InputState::Disabled;
        }
        input
    }

    // === Getters ===

    pub fn value(&self) -> String {
        self.context.value.clone()
    }

    pub fn disabled(&self) -> bool {
        self.context.disabled
    }

    pub fn read_only(&self) -> bool {
        self.context.read_only
    }

    pub fn focused(&self) -> bool {
        self.context.focused
    }

    pub fn has_error(&self) -> bool {
        !self.context.error.is_empty()
    }

    pub fn error(&self) -> String {
        self.context.error.clone()
    }

    pub fn state_name(&self) -> String {
        match self.state {
            InputState::Idle => "idle".to_string(),
            InputState::Focused => "focused".to_string(),
            InputState::Disabled => "disabled".to_string(),
        }
    }

    // === Setters ===

    pub fn set_disabled(&mut self, disabled: bool) {
        self.context.disabled = disabled;
        if disabled {
            self.context.focused = false;
            self.state = InputState::Disabled;
        } else if self.state == InputState::Disabled {
            self.state = InputState::Idle;
        }
    }

    pub fn set_read_only(&mut self, read_only: bool) {
        self.context.read_only = read_only;
    }

    pub fn set_error(&mut self, error: &str) {
        self.context.error = error.to_string();
    }

    pub fn clear_error(&mut self) {
        self.context.error.clear();
    }

    // === Guards ===

    fn can_focus(&self) -> bool {
        !self.context.disabled
    }

    fn can_edit(&self) -> bool {
        !self.context.disabled && !self.context.read_only
    }

    // === Events ===

    /// Event: FOCUS
    pub fn focus(&mut self) -> bool {
        if self.can_focus() {
            self.context.focused = true;
            self.state = InputState::Focused;
            true
        } else {
            false
        }
    }

    /// Event: BLUR
    pub fn blur(&mut self) -> bool {
        if self.context.focused {
            self.context.focused = false;
            self.state = if self.context.disabled {
                InputState::Disabled
            } else {
                InputState::Idle
            };
            true
        } else {
            false
        }
    }

    /// Event: CHANGE - Set the input value
    /// Returns true if the value was changed
    pub fn change(&mut self, new_value: &str) -> bool {
        if self.can_edit() {
            self.context.value = new_value.to_string();
            true
        } else {
            false
        }
    }

    /// Clear the input value
    pub fn clear(&mut self) -> bool {
        if self.can_edit() {
            self.context.value.clear();
            true
        } else {
            false
        }
    }

    /// Get ARIA attributes as JSON
    pub fn aria_attrs(&self) -> String {
        format!(
            r#"{{"role":"textbox","aria-disabled":"{}","aria-readonly":"{}","aria-invalid":"{}","tabindex":"{}"}}"#,
            self.context.disabled,
            self.context.read_only,
            self.has_error(),
            if self.context.disabled { -1 } else { 0 }
        )
    }
}

impl Default for Input {
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
        let input = Input::new();
        assert_eq!(input.value(), "");
        assert!(!input.disabled());
        assert!(!input.focused());
        assert!(!input.has_error());
        assert_eq!(input.state_name(), "idle");
    }

    #[test]
    fn test_set_value() {
        let mut input = Input::new();

        assert!(input.change("Hello"));

        assert_eq!(input.value(), "Hello");
    }

    #[test]
    fn test_focus_and_blur() {
        let mut input = Input::new();

        assert!(input.focus());
        assert!(input.focused());
        assert_eq!(input.state_name(), "focused");

        assert!(input.blur());
        assert!(!input.focused());
        assert_eq!(input.state_name(), "idle");
    }

    #[test]
    fn test_disabled_blocks_focus() {
        let mut input = Input::with_disabled(true);

        assert!(!input.focus());
        assert!(!input.focused());
    }

    #[test]
    fn test_disabled_blocks_change() {
        let mut input = Input::with_disabled(true);

        assert!(!input.change("test"));
        assert_eq!(input.value(), "");
    }

    #[test]
    fn test_read_only_blocks_change() {
        let mut input = Input::new();
        input.set_read_only(true);

        assert!(!input.change("test"));
        assert_eq!(input.value(), "");
    }

    #[test]
    fn test_error_state() {
        let mut input = Input::new();

        assert!(!input.has_error());

        input.set_error("Invalid input");
        assert!(input.has_error());
        assert_eq!(input.error(), "Invalid input");

        input.clear_error();
        assert!(!input.has_error());
    }
}
