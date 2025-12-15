//! Integration test for personnel location assignment
//!
//! This test verifies that personnel are correctly assigned to spaces during seeding.

use nexosim_hybrid::database::components::ComponentRepository;
use surrealdb::Surreal;
use surrealdb::engine::local::Mem;

#[tokio::test]
async fn test_personnel_space_assignment() -> anyhow::Result<()> {
    // Initialize in-memory DB
    let db = Surreal::new::<Mem>(()).await?;
    db.use_ns("test").use_db("test").await?;

    // Seed from scenario.toml (the new config structure)
    ComponentRepository::seed_from_toml(&db, "../scenarios/mmc/scenario.toml").await?;

    // Verify people were created
    let people: Vec<nexosim_hybrid::database::geo::Person> = db.select("person").await?;
    assert!(!people.is_empty(), "No people were seeded");

    // Verify spaces were created
    let spaces: Vec<nexosim_hybrid::database::geo::Space> = db.select("space").await?;
    assert!(!spaces.is_empty(), "No spaces were seeded");

    // Check that at least some people have space_id assigned
    let people_with_space: Vec<_> = people.iter().filter(|p| p.space_id.is_some()).collect();

    println!("Total people: {}", people.len());
    println!("People with space_id: {}", people_with_space.len());

    for person in &people {
        println!(
            "Person: {} | space_id: {:?}",
            person.name,
            person.space_id.as_ref().map(|t| t.to_string())
        );
    }

    // Print spaces for debugging
    println!("\nSpaces:");
    for space in &spaces {
        println!(
            "Space: {} | locator: {} | id: {:?}",
            space.name,
            space.locator,
            space.id.as_ref().map(|t| t.to_string())
        );
    }

    assert!(
        !people_with_space.is_empty(),
        "No people have space_id assigned. Expected at least some to have locations."
    );

    // Specifically check Thomas Anderson (CEO) should be in space 300 (Executive Suite)
    let thomas = people.iter().find(|p| p.name == "Thomas Anderson");
    assert!(thomas.is_some(), "Thomas Anderson not found");

    let thomas = thomas.unwrap();
    assert!(
        thomas.space_id.is_some(),
        "Thomas Anderson should have a space_id assigned"
    );

    // Verify the lookup would work (simulating UI logic)
    use std::collections::HashMap;
    let space_map: HashMap<String, &nexosim_hybrid::database::geo::Space> = spaces
        .iter()
        .filter_map(|s| Some((s.id.as_ref()?.to_string(), s)))
        .collect();

    println!("\n--- Verifying UI lookup logic ---");
    println!(
        "Thomas space_id: {:?}",
        thomas.space_id.as_ref().map(|t| t.to_string())
    );

    let thomas_space_id_str = thomas.space_id.as_ref().unwrap().to_string();
    let found_space = space_map.get(&thomas_space_id_str);

    println!("Looking up key: '{}'", thomas_space_id_str);
    println!("Found space: {:?}", found_space.map(|s| &s.name));

    assert!(
        found_space.is_some(),
        "UI lookup logic failed: could not find space for Thomas Anderson using key '{}'. Available keys: {:?}",
        thomas_space_id_str,
        space_map.keys().collect::<Vec<_>>()
    );

    Ok(())
}
