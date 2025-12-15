//! TOML parsing logic for scenario files

use crate::types::*;
use serde::Deserialize;
use std::path::Path;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ScenarioError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("TOML parse error: {0}")]
    Toml(#[from] toml::de::Error),
    #[error("Missing file: {0}")]
    MissingFile(String),
}

/// Raw TOML structures for parsing

#[derive(Debug, Deserialize)]
struct ScenarioToml {
    scenario: ScenarioMeta,
    #[serde(default)]
    modules: ModuleRefs,
}

#[derive(Debug, Deserialize)]
struct ScenarioMeta {
    name: String,
    short_name: String,
    #[serde(default)]
    industry: Option<String>,
    #[serde(default)]
    description: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
struct ModuleRefs {
    #[serde(default)]
    personnel: Option<String>,
    #[serde(default)]
    sites: Option<String>,
    #[serde(default)]
    assets: Option<String>,
    #[serde(default)]
    events: Option<String>,
}

#[derive(Debug, Deserialize)]
struct PersonnelToml {
    #[serde(default)]
    people: Vec<Person>,
}

#[derive(Debug, Deserialize)]
struct SitesToml {
    #[serde(default)]
    sites: Vec<Site>,
    #[serde(default)]
    buildings: Vec<Building>,
    #[serde(default)]
    floors: Vec<Floor>,
    #[serde(default)]
    spaces: Vec<Space>,
}

#[derive(Debug, Deserialize)]
struct AssetsToml {
    #[serde(default)]
    assets: Vec<Asset>,
}

#[derive(Debug, Deserialize)]
struct EventsToml {
    #[serde(default)]
    events: Vec<Event>,
}

impl Scenario {
    /// Load a scenario from a directory path (runtime)
    pub fn load_from_path(path: impl AsRef<Path>) -> Result<Self, ScenarioError> {
        let base = path.as_ref();

        // Load main scenario.toml
        let scenario_path = base.join("scenario.toml");
        let scenario_str = std::fs::read_to_string(&scenario_path)?;
        let scenario_toml: ScenarioToml = toml::from_str(&scenario_str)?;

        // Load personnel
        let personnel = if let Some(ref file) = scenario_toml.modules.personnel {
            let path = base.join(file);
            let content = std::fs::read_to_string(path)?;
            let parsed: PersonnelToml = toml::from_str(&content)?;
            parsed.people
        } else {
            vec![]
        };

        // Load sites
        let (sites, buildings, floors, spaces) = if let Some(ref file) = scenario_toml.modules.sites
        {
            let path = base.join(file);
            let content = std::fs::read_to_string(path)?;
            let parsed: SitesToml = toml::from_str(&content)?;
            (parsed.sites, parsed.buildings, parsed.floors, parsed.spaces)
        } else {
            (vec![], vec![], vec![], vec![])
        };

        // Load assets
        let assets = if let Some(ref file) = scenario_toml.modules.assets {
            let path = base.join(file);
            let content = std::fs::read_to_string(path)?;
            let parsed: AssetsToml = toml::from_str(&content)?;
            parsed.assets
        } else {
            vec![]
        };

        // Load events
        let events = if let Some(ref file) = scenario_toml.modules.events {
            let path = base.join(file);
            let content = std::fs::read_to_string(path)?;
            let parsed: EventsToml = toml::from_str(&content)?;
            parsed.events
        } else {
            vec![]
        };

        Ok(Scenario {
            name: scenario_toml.scenario.name,
            short_name: scenario_toml.scenario.short_name,
            industry: scenario_toml.scenario.industry,
            description: scenario_toml.scenario.description,
            personnel,
            sites,
            buildings,
            floors,
            spaces,
            assets,
            events,
        })
    }

    /// Parse scenario from embedded TOML strings (compile-time)
    pub fn from_toml_strings(
        scenario_toml: &str,
        personnel_toml: Option<&str>,
        sites_toml: Option<&str>,
        assets_toml: Option<&str>,
        events_toml: Option<&str>,
    ) -> Result<Self, ScenarioError> {
        let scenario: ScenarioToml = toml::from_str(scenario_toml)?;

        let personnel = personnel_toml
            .map(|s| toml::from_str::<PersonnelToml>(s))
            .transpose()?
            .map(|p| p.people)
            .unwrap_or_default();

        let (sites, buildings, floors, spaces) = sites_toml
            .map(|s| toml::from_str::<SitesToml>(s))
            .transpose()?
            .map(|s| (s.sites, s.buildings, s.floors, s.spaces))
            .unwrap_or_default();

        let assets = assets_toml
            .map(|s| toml::from_str::<AssetsToml>(s))
            .transpose()?
            .map(|a| a.assets)
            .unwrap_or_default();

        let events = events_toml
            .map(|s| toml::from_str::<EventsToml>(s))
            .transpose()?
            .map(|e| e.events)
            .unwrap_or_default();

        Ok(Scenario {
            name: scenario.scenario.name,
            short_name: scenario.scenario.short_name,
            industry: scenario.scenario.industry,
            description: scenario.scenario.description,
            personnel,
            sites,
            buildings,
            floors,
            spaces,
            assets,
            events,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_minimal_scenario() {
        let toml = r#"
[scenario]
name = "Test Scenario"
short_name = "test"
"#;
        let scenario = Scenario::from_toml_strings(toml, None, None, None, None).unwrap();
        assert_eq!(scenario.name, "Test Scenario");
        assert_eq!(scenario.short_name, "test");
    }
}
