//! Core types for spec processing
//!
//! Contains SpecType enum, SpecMeta struct, and section constants.

/// Configurable suffix for spec files
pub const SPEC_SUFFIX: &str = ".sudo.md";

/// Required sections for primitive specs (full statechart)
pub const PRIMITIVE_SECTIONS: &[&str] = &[
    "Component API",
    "Context Schema",
    "State Machine",
    "Guards",
    "Actions",
];

/// Primitive sections that require CUE syntax (excludes Sudolang sections)
pub const PRIMITIVE_CUE_SECTIONS: &[&str] = &[
    "Component API",
    "Context Schema",
    "State Machine",
    "Guards",
    "Actions",
];

/// Required sections for compound specs (orchestration + imports)
pub const COMPOUND_SECTIONS: &[&str] = &["Composition", "Context Schema"];

/// Required sections for presentational specs (design only)
pub const PRESENTATIONAL_SECTIONS: &[&str] = &["Design Guidelines"];

/// Required sections for schema specs (types only)
pub const SCHEMA_SECTIONS: &[&str] = &["Context Schema"];

/// Spec type determined from frontmatter
#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub enum SpecType {
    /// Full statechart + Quint (default for components)
    Primitive,
    /// Orchestration state + child imports
    Compound,
    /// Design/styling only, no state machine
    Presentational,
    /// Data types only, no UI
    Schema,
}

impl SpecType {
    /// Get required sections for this spec type
    pub fn required_sections(&self) -> &'static [&'static str] {
        match self {
            SpecType::Primitive => PRIMITIVE_SECTIONS,
            SpecType::Compound => COMPOUND_SECTIONS,
            SpecType::Presentational => PRESENTATIONAL_SECTIONS,
            SpecType::Schema => SCHEMA_SECTIONS,
        }
    }

    /// Get sections that require ```cue blocks (excludes presentational sections)
    pub fn sections_requiring_cue(&self) -> &'static [&'static str] {
        match self {
            SpecType::Primitive => PRIMITIVE_CUE_SECTIONS, // Component API uses sudolang, not cue
            SpecType::Compound => &["Context Schema"],     // Only Context Schema needs cue
            SpecType::Presentational => &[],               // Design Guidelines uses sudolang
            SpecType::Schema => SCHEMA_SECTIONS,           // Context Schema needs cue
        }
    }

    /// Get forbidden sections for this spec type (statechart sections not allowed)
    pub fn forbidden_sections(&self) -> &'static [&'static str] {
        match self {
            SpecType::Primitive => &[], // All sections allowed
            SpecType::Compound => &[],  // All sections allowed (may have orchestration state)
            SpecType::Presentational => &[
                "State Machine",
                "Guards",
                "Actions",
                "Formal Model",
                "Test Vectors",
            ],
            SpecType::Schema => &[
                "State Machine",
                "Guards",
                "Actions",
                "Formal Model",
                "Test Vectors",
            ],
        }
    }

    /// Parse from frontmatter type string
    pub fn from_str(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "primitive" => SpecType::Primitive,
            "compound" => SpecType::Compound,
            "presentational" => SpecType::Presentational,
            "schema" => SpecType::Schema,
            "component" => SpecType::Primitive, // Legacy: treat component as primitive
            _ => SpecType::Primitive,
        }
    }
}

/// Frontmatter metadata
#[derive(Debug, Clone)]
pub struct SpecMeta {
    pub spec_type: SpecType,
    pub description: Option<String>,
}

impl Default for SpecMeta {
    fn default() -> Self {
        Self {
            spec_type: SpecType::Primitive,
            description: None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn spec_type_from_str_primitive() {
        assert_eq!(SpecType::from_str("primitive"), SpecType::Primitive);
    }

    #[test]
    fn spec_type_from_str_legacy_component() {
        assert_eq!(SpecType::from_str("component"), SpecType::Primitive);
    }

    #[test]
    fn spec_type_from_str_presentational() {
        assert_eq!(
            SpecType::from_str("presentational"),
            SpecType::Presentational
        );
    }

    #[test]
    fn spec_type_from_str_case_insensitive() {
        assert_eq!(SpecType::from_str("PRIMITIVE"), SpecType::Primitive);
        assert_eq!(SpecType::from_str("Compound"), SpecType::Compound);
    }

    #[test]
    fn spec_type_from_str_unknown_defaults_primitive() {
        assert_eq!(SpecType::from_str("unknown"), SpecType::Primitive);
    }

    #[test]
    fn primitive_has_required_sections() {
        let sections = SpecType::Primitive.required_sections();
        assert!(sections.contains(&"State Machine"));
        assert!(sections.contains(&"Context Schema"));
    }

    #[test]
    fn presentational_forbids_statechart_sections() {
        let forbidden = SpecType::Presentational.forbidden_sections();
        assert!(forbidden.contains(&"State Machine"));
        assert!(forbidden.contains(&"Guards"));
    }
}
