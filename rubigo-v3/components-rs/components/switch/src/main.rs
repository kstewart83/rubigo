//! Switch Component WASM Entry Point
//!
//! This is a standalone binary target that compiles to its own WASM file.

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

/// Switch context - the extended state
#[derive(Debug, Clone, Serialize, Deserialize)]
#[wasm_bindgen]
pub struct SwitchContext {
    pub checked: bool,
    pub disabled: bool,
    pub read_only: bool,
    pub focused: bool,
}

#[wasm_bindgen]
impl SwitchContext {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            checked: false,
            disabled: false,
            read_only: false,
            focused: false,
        }
    }
}

impl Default for SwitchContext {
    fn default() -> Self {
        Self::new()
    }
}

/// Switch component - wraps state machine and context
#[wasm_bindgen]
pub struct Switch {
    context: SwitchContext,
    state: SwitchState,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum SwitchState {
    Idle,
    Focused,
}

#[wasm_bindgen]
impl Switch {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            context: SwitchContext::new(),
            state: SwitchState::Idle,
        }
    }

    /// Create with initial checked state
    pub fn with_checked(checked: bool) -> Self {
        let mut switch = Self::new();
        switch.context.checked = checked;
        switch
    }

    /// Get current checked state
    pub fn checked(&self) -> bool {
        self.context.checked
    }

    /// Get current focused state
    pub fn focused(&self) -> bool {
        self.context.focused
    }

    /// Get current disabled state
    pub fn disabled(&self) -> bool {
        self.context.disabled
    }

    /// Set disabled state
    pub fn set_disabled(&mut self, disabled: bool) {
        self.context.disabled = disabled;
    }

    /// Guard: canToggle - check if toggle is allowed
    fn can_toggle(&self) -> bool {
        !self.context.disabled && !self.context.read_only
    }

    /// Action: toggle - invert checked state
    fn do_toggle(&mut self) -> bool {
        if self.can_toggle() {
            let prev = self.context.checked;
            self.context.checked = !self.context.checked;
            prev != self.context.checked
        } else {
            false
        }
    }

    /// Event: TOGGLE
    pub fn toggle(&mut self) -> bool {
        self.do_toggle()
    }

    /// Event: FOCUS
    pub fn focus(&mut self) {
        self.context.focused = true;
        self.state = SwitchState::Focused;
    }

    /// Event: BLUR
    pub fn blur(&mut self) {
        self.context.focused = false;
        self.state = SwitchState::Idle;
    }

    /// Event: KEYDOWN (handles Space and Enter)
    pub fn keydown(&mut self, key: &str) -> bool {
        match self.state {
            SwitchState::Focused => {
                if key == " " || key == "Enter" {
                    self.do_toggle()
                } else {
                    false
                }
            }
            SwitchState::Idle => false,
        }
    }

    /// Get current state name (for debugging/testing)
    pub fn state_name(&self) -> String {
        match self.state {
            SwitchState::Idle => "idle".to_string(),
            SwitchState::Focused => "focused".to_string(),
        }
    }

    /// Get ARIA attributes as JSON
    pub fn aria_attrs(&self) -> String {
        format!(
            r#"{{"role":"switch","aria-checked":"{}","aria-disabled":"{}"}}"#,
            self.context.checked, self.context.disabled
        )
    }
}

impl Default for Switch {
    fn default() -> Self {
        Self::new()
    }
}

/// Binary entry point (required for binary target)
fn main() {}
