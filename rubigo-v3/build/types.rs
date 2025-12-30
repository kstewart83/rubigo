//! Type definitions for the build script

/// Configurable suffix for spec files
pub const SPEC_SUFFIX: &str = ".sudo.md";

// Required sections for primitive specs (full statechart)
pub const PRIMITIVE_SECTIONS: &[&str] = &["Context Schema", "State Machine", "Guards", "Actions"];
// Required sections for compound specs (orchestration + imports)
pub const COMPOUND_SECTIONS: &[&str] = &["Composition", "Context Schema"];
// Required sections for presentational specs (design only)
pub const PRESENTATIONAL_SECTIONS: &[&str] = &["Design Guidelines"];
// Required sections for schema specs (types only)
pub const SCHEMA_SECTIONS: &[&str] = &["Context Schema"];

/// Spec type determined from frontmatter
#[derive(Debug, PartialEq, Clone, Copy)]
pub enum SpecType {
    Primitive,      // Full statechart + Quint (default for components)
    Compound,       // Orchestration state + child imports
    Presentational, // Design/styling only, no state machine
    Schema,         // Data types only, no UI
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
            SpecType::Presentational => &[], // Design Guidelines doesn't require CUE
            _ => self.required_sections(),
        }
    }

    /// Get forbidden sections for this spec type (statechart sections not allowed)
    pub fn forbidden_sections(&self) -> &'static [&'static str] {
        match self {
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
                "Design Guidelines",
                "Requirements",
            ],
            _ => &[], // Primitive and Compound can have any sections
        }
    }

    /// Parse from frontmatter type string
    pub fn from_str(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "primitive" => SpecType::Primitive,
            "compound" => SpecType::Compound,
            "presentational" => SpecType::Presentational,
            "schema" => SpecType::Schema,
            _ => SpecType::Primitive, // Default for backward compatibility
        }
    }
}

/// Frontmatter metadata
#[derive(Debug)]
pub struct SpecMeta {
    pub spec_type: SpecType,
    pub description: String,
}

impl Default for SpecMeta {
    fn default() -> Self {
        Self {
            spec_type: SpecType::Primitive,
            description: String::new(),
        }
    }
}
