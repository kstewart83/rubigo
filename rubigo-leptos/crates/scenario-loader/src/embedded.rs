//! Embedded MMC scenario data (compile-time)
//!
//! This module is only available when the `embed-mmc` feature is enabled.
//! It embeds the MMC scenario TOML files at compile time for use in WASM builds.

use crate::{Asset, Building, Event, Floor, Person, Scenario, Site, Space};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use std::sync::OnceLock;

// Embed TOML files at compile time
const SCENARIO_TOML: &str = include_str!("../../../scenarios/mmc/scenario.toml");
const PERSONNEL_TOML: &str = include_str!("../../../scenarios/mmc/personnel.toml");
const SITES_TOML: &str = include_str!("../../../scenarios/mmc/sites.toml");
const ASSETS_TOML: &str = include_str!("../../../scenarios/mmc/assets.toml");
const EVENTS_TOML: &str = include_str!("../../../scenarios/mmc/events.toml");

// Embed headshot images at compile time (PNG files as bytes)
const HEADSHOTS: &[(&str, &[u8])] = &[
    (
        "thomas_anderson_241a6d",
        include_bytes!("../../../scenarios/mmc/headshots/thomas_anderson_241a6d.png"),
    ),
    (
        "margaret_sullivan_cdb964",
        include_bytes!("../../../scenarios/mmc/headshots/margaret_sullivan_cdb964.png"),
    ),
    (
        "richard_nakamura_714fd4",
        include_bytes!("../../../scenarios/mmc/headshots/richard_nakamura_714fd4.png"),
    ),
    (
        "sarah_kim_7aa0d4",
        include_bytes!("../../../scenarios/mmc/headshots/sarah_kim_7aa0d4.png"),
    ),
    (
        "james_wilson_f73c1c",
        include_bytes!("../../../scenarios/mmc/headshots/james_wilson_f73c1c.png"),
    ),
    (
        "lisa_chen_8f3a18",
        include_bytes!("../../../scenarios/mmc/headshots/lisa_chen_8f3a18.png"),
    ),
    (
        "mike_chen_1ea074",
        include_bytes!("../../../scenarios/mmc/headshots/mike_chen_1ea074.png"),
    ),
    (
        "patricia_martinez_4f6f43",
        include_bytes!("../../../scenarios/mmc/headshots/patricia_martinez_4f6f43.png"),
    ),
    (
        "david_park_d827cb",
        include_bytes!("../../../scenarios/mmc/headshots/david_park_d827cb.png"),
    ),
    (
        "emily_rodriguez_4fcdf6",
        include_bytes!("../../../scenarios/mmc/headshots/emily_rodriguez_4fcdf6.png"),
    ),
    (
        "robert_thompson_8a0c57",
        include_bytes!("../../../scenarios/mmc/headshots/robert_thompson_8a0c57.png"),
    ),
    (
        "jennifer_adams_f9c8d7",
        include_bytes!("../../../scenarios/mmc/headshots/jennifer_adams_f9c8d7.png"),
    ),
    (
        "kevin_obrien_4d9154",
        include_bytes!("../../../scenarios/mmc/headshots/kevin_obrien_4d9154.png"),
    ),
    (
        "nicole_taylor_5eedf9",
        include_bytes!("../../../scenarios/mmc/headshots/nicole_taylor_5eedf9.png"),
    ),
    (
        "amanda_johnson_e8a466",
        include_bytes!("../../../scenarios/mmc/headshots/amanda_johnson_e8a466.png"),
    ),
    (
        "chris_miller_1e4e5c",
        include_bytes!("../../../scenarios/mmc/headshots/chris_miller_1e4e5c.png"),
    ),
    (
        "daniel_foster_c1eddc",
        include_bytes!("../../../scenarios/mmc/headshots/daniel_foster_c1eddc.png"),
    ),
    (
        "jason_wright_d62d4d",
        include_bytes!("../../../scenarios/mmc/headshots/jason_wright_d62d4d.png"),
    ),
];

// Cached parsed scenario
static MMC_SCENARIO: OnceLock<Scenario> = OnceLock::new();

/// Get the embedded MMC scenario (lazily parsed once)
pub fn mmc() -> &'static Scenario {
    MMC_SCENARIO.get_or_init(|| {
        let mut scenario = match Scenario::from_toml_strings(
            SCENARIO_TOML,
            Some(PERSONNEL_TOML),
            Some(SITES_TOML),
            Some(ASSETS_TOML),
            Some(EVENTS_TOML),
        ) {
            Ok(s) => s,
            Err(e) => panic!("Failed to parse embedded MMC scenario: {:?}", e),
        };

        // Populate photo_data for each person from embedded headshots
        for person in &mut scenario.personnel {
            // Extract the headshot key from photo path (e.g., headshots/name_id.png -> name_id)
            let headshot_key = person
                .photo
                .as_ref()
                .and_then(|p| p.strip_prefix("headshots/"))
                .and_then(|p| p.strip_suffix(".png"));

            if let Some(key) = headshot_key {
                if let Some((_, bytes)) = HEADSHOTS.iter().find(|(k, _)| *k == key) {
                    person.photo_data = Some(BASE64.encode(bytes));
                }
            }
        }

        scenario
    })
}

/// Get MMC personnel list
pub fn personnel() -> &'static [Person] {
    &mmc().personnel
}

/// Get MMC sites list
pub fn sites() -> &'static [Site] {
    &mmc().sites
}

/// Get MMC buildings list  
pub fn buildings() -> &'static [Building] {
    &mmc().buildings
}

/// Get MMC floors list
pub fn floors() -> &'static [Floor] {
    &mmc().floors
}

/// Get MMC spaces list
pub fn spaces() -> &'static [Space] {
    &mmc().spaces
}

/// Get MMC assets list
pub fn assets() -> &'static [Asset] {
    &mmc().assets
}

/// Get MMC events list
pub fn events() -> &'static [Event] {
    &mmc().events
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn mmc_scenario_loads() {
        let scenario = mmc();
        assert_eq!(scenario.short_name, "mmc");
        assert!(!scenario.personnel.is_empty());
    }

    #[test]
    fn mmc_has_personnel() {
        let people = personnel();
        assert!(!people.is_empty());
        // Check for known person
        assert!(people.iter().any(|p| p.name == "Thomas Anderson"));
    }

    #[test]
    fn personnel_have_photo_data() {
        let people = personnel();
        let thomas = people.iter().find(|p| p.name == "Thomas Anderson").unwrap();
        assert!(thomas.photo_data.is_some(), "Thomas should have photo_data");
        assert!(
            thomas.photo_data.as_ref().unwrap().len() > 100,
            "Photo data should be substantial"
        );
    }
}
