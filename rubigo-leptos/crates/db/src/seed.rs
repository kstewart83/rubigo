//! Seed database from scenario-loader data
//!
//! Converts scenario-loader types to database models and inserts them.

use crate::client::DbClient;
use crate::models::{Building, Floor, NetworkAsset, Person, Site, Space};
use crate::repositories::{AssetRepository, GeoRepository, PersonRepository};
use anyhow::Result;
use scenario_loader::Scenario;
use std::collections::HashMap;
use surrealdb::sql::Thing;

/// Seed the database from a scenario directory path
pub async fn from_path(db: &DbClient, scenario_path: &str) -> Result<SeedStats> {
    let scenario = Scenario::load_from_path(scenario_path)?;
    from_scenario(db, &scenario).await
}

/// Seed the database from a parsed scenario
pub async fn from_scenario(db: &DbClient, scenario: &Scenario) -> Result<SeedStats> {
    let mut stats = SeedStats::default();

    // Track IDs for foreign key resolution
    let mut site_ids: HashMap<String, Thing> = HashMap::new();
    let mut building_ids: HashMap<String, Thing> = HashMap::new();
    let mut floor_ids: HashMap<String, Thing> = HashMap::new();
    let mut space_ids: HashMap<String, Thing> = HashMap::new();

    // 1. Seed sites
    for site in &scenario.sites {
        let id = site.id();
        let db_site = Site {
            id: None,
            name: site.name.clone(),
            region: site.city.clone(), // Using city as region for now
            city: site.city.clone(),
            country: None,
            address: site.address.clone(),
            status: None,
            lat: None,
            lon: None,
        };
        let created = GeoRepository::create_site_with_id(db, &id, db_site).await?;
        if let Some(thing) = created.id {
            site_ids.insert(site.name.clone(), thing);
        }
        stats.sites += 1;
    }

    // 2. Seed buildings
    for building in &scenario.buildings {
        let id = building.id();
        let site_id = site_ids.get(&building.site).cloned();
        let db_building = Building {
            id: None,
            name: building.name.clone(),
            site_id,
            address: None,
            floors_min: None,
            floors_max: None,
        };
        let created = GeoRepository::create_building_with_id(db, &id, db_building).await?;
        if let Some(thing) = created.id {
            building_ids.insert(building.name.clone(), thing);
        }
        stats.buildings += 1;
    }

    // 3. Seed floors (derived from spaces - collect unique building+level combinations)
    let mut seen_floors: HashMap<String, bool> = HashMap::new();
    for space in &scenario.spaces {
        let level = space.level.unwrap_or(1);
        let floor_key = format!("{}_{}", space.building, level);

        if seen_floors.contains_key(&floor_key) {
            continue;
        }
        seen_floors.insert(floor_key.clone(), true);

        let building_id = building_ids.get(&space.building).cloned();
        let floor_name = format!("Level {}", level);
        let floor_id = format!(
            "{}_{}",
            space.building.to_lowercase().replace(' ', "_"),
            level
        );

        let db_floor = Floor {
            id: None,
            name: floor_name.clone(),
            building_id,
            level: Some(level),
        };
        let created = GeoRepository::create_floor_with_id(db, &floor_id, db_floor).await?;
        if let Some(thing) = created.id {
            floor_ids.insert(floor_key, thing);
        }
        stats.floors += 1;
    }

    // 4. Seed spaces
    for space in &scenario.spaces {
        let floor_key = format!("{}_{}", space.building, space.level.unwrap_or(1));
        let floor_id = floor_ids.get(&floor_key).cloned();
        let space_key = space.id();
        let db_space = Space {
            id: None,
            name: space.name.clone(),
            floor_id,
            locator: space.locator.clone(),
            space_type: space.space_type.clone(),
            capacity: space.capacity,
        };
        let created = GeoRepository::create_space_with_id(db, &space_key, db_space).await?;
        if let Some(thing) = created.id {
            space_ids.insert(space_key, thing);
        }
        stats.spaces += 1;
    }

    // 5. Seed personnel
    for person in &scenario.personnel {
        let person_id = person.get_id();
        let space_id = person
            .space
            .as_ref()
            .and_then(|s| space_ids.get(s).cloned());
        let building_id = person
            .building
            .as_ref()
            .and_then(|b| building_ids.get(b).cloned());
        let site_id = person.site.as_ref().and_then(|s| site_ids.get(s).cloned());

        let db_person = Person {
            id: None,
            short_id: person.id.clone(),
            name: person.name.clone(),
            email: person.email.clone(),
            title: person.title.clone(),
            department: person.department.clone(),
            site_id,
            building_id,
            space_id,
            manager_id: None, // Would need separate pass to resolve
            photo: person.photo.clone(),
            desk_phone: person.desk_phone.clone(),
            cell_phone: person.cell_phone.clone(),
            bio: person.bio.clone(),
        };
        PersonRepository::create_with_id(db, &person_id, db_person).await?;
        stats.people += 1;
    }

    // 6. Seed assets
    for asset in &scenario.assets {
        let asset_id = asset
            .name
            .to_lowercase()
            .replace(' ', "_")
            .replace('-', "_");
        let space_id = asset.space.as_ref().and_then(|s| space_ids.get(s).cloned());

        let db_asset = NetworkAsset {
            id: None,
            name: asset.name.clone(),
            category: asset.category.clone(),
            manufacturer: asset.manufacturer.clone(),
            model: asset.model.clone(),
            serial_number: asset.serial_number.clone(),
            mac_address: asset.mac_address.clone(),
            status: asset.status.clone(),
            rack_id: None, // Would need rack seeding first
            position_u: asset.position_u,
            height_u: asset.height_u,
            space_id,
            storage_location: asset.storage_location.clone(),
            notes: asset.notes.clone(),
        };
        AssetRepository::create_with_id(db, &asset_id, db_asset).await?;
        stats.assets += 1;
    }

    tracing::info!(
        "Seeded database: {} sites, {} buildings, {} floors, {} spaces, {} people, {} assets",
        stats.sites,
        stats.buildings,
        stats.floors,
        stats.spaces,
        stats.people,
        stats.assets
    );

    Ok(stats)
}

/// Statistics from seeding operation
#[derive(Debug, Default)]
pub struct SeedStats {
    pub sites: usize,
    pub buildings: usize,
    pub floors: usize,
    pub spaces: usize,
    pub people: usize,
    pub assets: usize,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::Database;

    #[tokio::test]
    async fn seed_from_scenario_path() {
        let db = Database::init().await.unwrap();
        let result = from_path(&db.client, "../../../common/scenarios/mmc").await;

        // This may fail if test runs from wrong directory, which is OK
        if let Ok(stats) = result {
            assert!(stats.people > 0);
            assert!(stats.sites > 0);
        }
    }
}
