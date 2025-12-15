//! Button Component Tests

use super::*;

#[cfg(test)]
mod tests {
    use super::*;

    // Note: With Stylance, the class names are now scoped constants
    // We test that the variant/size selection works correctly

    #[test]
    fn button_variant_returns_scoped_class() {
        // Each variant should return a non-empty class name
        assert!(!ButtonVariant::Primary.class_name().is_empty());
        assert!(!ButtonVariant::Secondary.class_name().is_empty());
        assert!(!ButtonVariant::Danger.class_name().is_empty());
        assert!(!ButtonVariant::Ghost.class_name().is_empty());
    }

    #[test]
    fn button_size_returns_scoped_class() {
        // Each size should return a non-empty class name
        assert!(!ButtonSize::Small.class_name().is_empty());
        assert!(!ButtonSize::Medium.class_name().is_empty());
        assert!(!ButtonSize::Large.class_name().is_empty());
    }

    #[test]
    fn button_variant_default_is_primary() {
        assert_eq!(ButtonVariant::default(), ButtonVariant::Primary);
    }

    #[test]
    fn button_size_default_is_medium() {
        assert_eq!(ButtonSize::default(), ButtonSize::Medium);
    }

    #[test]
    fn all_variants_have_unique_classes() {
        let primary = ButtonVariant::Primary.class_name();
        let secondary = ButtonVariant::Secondary.class_name();
        let danger = ButtonVariant::Danger.class_name();
        let ghost = ButtonVariant::Ghost.class_name();

        // All should be unique
        assert_ne!(primary, secondary);
        assert_ne!(primary, danger);
        assert_ne!(primary, ghost);
        assert_ne!(secondary, danger);
        assert_ne!(secondary, ghost);
        assert_ne!(danger, ghost);
    }
}

// Note: Full DOM rendering tests require wasm-bindgen-test
// and running in a browser environment. These will be added
// when we set up the test harness.
