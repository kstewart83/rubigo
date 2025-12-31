//! Checkbox Component WASM Entry Point
//!
//! Implements tri-state checkbox with checked, unchecked, and indeterminate states.

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

/// Checkbox context - the extended state
#[derive(Debug, Clone, Serialize, Deserialize)]
#[wasm_bindgen]
pub struct CheckboxContext {
    pub checked: bool,
    pub disabled: bool,
    pub indeterminate: bool,
}

#[wasm_bindgen]
impl CheckboxContext {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            checked: false,
            disabled: false,
            indeterminate: false,
        }
    }
}

impl Default for CheckboxContext {
    fn default() -> Self {
        Self::new()
    }
}

/// Checkbox state machine states
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum CheckboxState {
    Unchecked,
    Checked,
    Indeterminate,
}

impl Default for CheckboxState {
    fn default() -> Self {
        Self::Unchecked
    }
}

/// Checkbox component - wraps state machine and context
#[wasm_bindgen]
pub struct Checkbox {
    context: CheckboxContext,
    state: CheckboxState,
}

#[wasm_bindgen]
impl Checkbox {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            context: CheckboxContext::new(),
            state: CheckboxState::Unchecked,
        }
    }

    /// Create with initial checked state
    pub fn with_checked(checked: bool) -> Self {
        let mut checkbox = Self::new();
        if checked {
            checkbox.context.checked = true;
            checkbox.state = CheckboxState::Checked;
        }
        checkbox
    }

    /// Create in indeterminate state
    pub fn with_indeterminate() -> Self {
        let mut checkbox = Self::new();
        checkbox.context.indeterminate = true;
        checkbox.state = CheckboxState::Indeterminate;
        checkbox
    }

    // === Getters ===

    pub fn checked(&self) -> bool {
        self.context.checked
    }

    pub fn disabled(&self) -> bool {
        self.context.disabled
    }

    pub fn indeterminate(&self) -> bool {
        self.context.indeterminate
    }

    pub fn state_name(&self) -> String {
        match self.state {
            CheckboxState::Unchecked => "unchecked".to_string(),
            CheckboxState::Checked => "checked".to_string(),
            CheckboxState::Indeterminate => "indeterminate".to_string(),
        }
    }

    // === Setters ===

    pub fn set_disabled(&mut self, disabled: bool) {
        self.context.disabled = disabled;
    }

    pub fn set_checked(&mut self, checked: bool) {
        self.context.checked = checked;
        self.context.indeterminate = false;
        self.state = if checked {
            CheckboxState::Checked
        } else {
            CheckboxState::Unchecked
        };
    }

    // === Guards ===

    fn can_toggle(&self) -> bool {
        !self.context.disabled
    }

    // === Events ===

    /// Event: TOGGLE - Toggle the checkbox state
    /// Returns the new checked state
    pub fn toggle(&mut self) -> bool {
        if !self.can_toggle() {
            return self.context.checked;
        }

        match self.state {
            CheckboxState::Unchecked => {
                self.context.checked = true;
                self.context.indeterminate = false;
                self.state = CheckboxState::Checked;
            }
            CheckboxState::Checked => {
                self.context.checked = false;
                self.context.indeterminate = false;
                self.state = CheckboxState::Unchecked;
            }
            CheckboxState::Indeterminate => {
                // Indeterminate always goes to checked
                self.context.checked = true;
                self.context.indeterminate = false;
                self.state = CheckboxState::Checked;
            }
        }

        self.context.checked
    }

    /// Event: SET_INDETERMINATE - Set to indeterminate state
    pub fn set_indeterminate(&mut self) {
        self.context.indeterminate = true;
        self.context.checked = false;
        self.state = CheckboxState::Indeterminate;
    }

    /// Handle keyboard events
    /// Returns Some(new_checked) if toggled, None if not
    pub fn keydown(&mut self, key: &str) -> Option<bool> {
        if key == "Enter" && self.can_toggle() {
            Some(self.toggle())
        } else {
            None
        }
    }

    /// Handle keyboard keyup events (Space triggers on release)
    /// Returns Some(new_checked) if toggled, None if not
    pub fn keyup(&mut self, key: &str) -> Option<bool> {
        if key == " " && self.can_toggle() {
            Some(self.toggle())
        } else {
            None
        }
    }

    /// Get aria-checked value
    pub fn aria_checked(&self) -> String {
        match self.state {
            CheckboxState::Unchecked => "false".to_string(),
            CheckboxState::Checked => "true".to_string(),
            CheckboxState::Indeterminate => "mixed".to_string(),
        }
    }

    /// Get ARIA attributes as JSON
    pub fn aria_attrs(&self) -> String {
        format!(
            r#"{{"role":"checkbox","aria-checked":"{}","aria-disabled":"{}","tabindex":"{}"}}"#,
            self.aria_checked(),
            self.context.disabled,
            if self.context.disabled { -1 } else { 0 }
        )
    }
}

impl Default for Checkbox {
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
        let checkbox = Checkbox::new();
        assert!(!checkbox.checked());
        assert!(!checkbox.disabled());
        assert!(!checkbox.indeterminate());
        assert_eq!(checkbox.state_name(), "unchecked");
    }

    #[test]
    fn test_toggle_unchecked_to_checked() {
        let mut checkbox = Checkbox::new();

        let new_state = checkbox.toggle();

        assert!(new_state);
        assert!(checkbox.checked());
        assert_eq!(checkbox.state_name(), "checked");
    }

    #[test]
    fn test_toggle_checked_to_unchecked() {
        let mut checkbox = Checkbox::with_checked(true);

        let new_state = checkbox.toggle();

        assert!(!new_state);
        assert!(!checkbox.checked());
        assert_eq!(checkbox.state_name(), "unchecked");
    }

    #[test]
    fn test_toggle_indeterminate_to_checked() {
        let mut checkbox = Checkbox::with_indeterminate();

        let new_state = checkbox.toggle();

        assert!(new_state);
        assert!(checkbox.checked());
        assert!(!checkbox.indeterminate());
        assert_eq!(checkbox.state_name(), "checked");
    }

    #[test]
    fn test_disabled_blocks_toggle() {
        let mut checkbox = Checkbox::new();
        checkbox.set_disabled(true);

        let new_state = checkbox.toggle();

        assert!(!new_state); // Still unchecked
        assert!(!checkbox.checked());
    }

    #[test]
    fn test_aria_checked_values() {
        let unchecked = Checkbox::new();
        assert_eq!(unchecked.aria_checked(), "false");

        let checked = Checkbox::with_checked(true);
        assert_eq!(checked.aria_checked(), "true");

        let indeterminate = Checkbox::with_indeterminate();
        assert_eq!(indeterminate.aria_checked(), "mixed");
    }
}
