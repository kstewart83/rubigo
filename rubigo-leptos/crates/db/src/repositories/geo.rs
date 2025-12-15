//! Geographic repository - Sites, Buildings, Floors, Spaces

use crate::client::DbClient;
use crate::models::{Site, Building, Floor, Space, Rack};
use anyhow::Result;

pub struct GeoRepository;

impl GeoRepository {
    // =========================================================================
    // Sites
    // =========================================================================
    
    pub async fn list_sites(db: &DbClient) -> Result<Vec<Site>> {
        let sites: Vec<Site> = db.select("site").await?;
        Ok(sites)
    }
    
    pub async fn create_site(db: &DbClient, site: Site) -> Result<Site> {
        let created: Option<Site> = db.create("site").content(site).await?;
        created.ok_or_else(|| anyhow::anyhow!("Failed to create site"))
    }
    
    pub async fn create_site_with_id(db: &DbClient, id: &str, site: Site) -> Result<Site> {
        let created: Option<Site> = db.create(("site", id)).content(site).await?;
        created.ok_or_else(|| anyhow::anyhow!("Failed to create site"))
    }
    
    // =========================================================================
    // Buildings
    // =========================================================================
    
    pub async fn list_buildings(db: &DbClient) -> Result<Vec<Building>> {
        let buildings: Vec<Building> = db.select("building").await?;
        Ok(buildings)
    }
    
    pub async fn create_building(db: &DbClient, building: Building) -> Result<Building> {
        let created: Option<Building> = db.create("building").content(building).await?;
        created.ok_or_else(|| anyhow::anyhow!("Failed to create building"))
    }
    
    pub async fn create_building_with_id(db: &DbClient, id: &str, building: Building) -> Result<Building> {
        let created: Option<Building> = db.create(("building", id)).content(building).await?;
        created.ok_or_else(|| anyhow::anyhow!("Failed to create building"))
    }
    
    // =========================================================================
    // Floors
    // =========================================================================
    
    pub async fn list_floors(db: &DbClient) -> Result<Vec<Floor>> {
        let floors: Vec<Floor> = db.select("floor").await?;
        Ok(floors)
    }
    
    pub async fn create_floor(db: &DbClient, floor: Floor) -> Result<Floor> {
        let created: Option<Floor> = db.create("floor").content(floor).await?;
        created.ok_or_else(|| anyhow::anyhow!("Failed to create floor"))
    }
    
    pub async fn create_floor_with_id(db: &DbClient, id: &str, floor: Floor) -> Result<Floor> {
        let created: Option<Floor> = db.create(("floor", id)).content(floor).await?;
        created.ok_or_else(|| anyhow::anyhow!("Failed to create floor"))
    }
    
    // =========================================================================
    // Spaces
    // =========================================================================
    
    pub async fn list_spaces(db: &DbClient) -> Result<Vec<Space>> {
        let spaces: Vec<Space> = db.select("space").await?;
        Ok(spaces)
    }
    
    pub async fn create_space(db: &DbClient, space: Space) -> Result<Space> {
        let created: Option<Space> = db.create("space").content(space).await?;
        created.ok_or_else(|| anyhow::anyhow!("Failed to create space"))
    }
    
    pub async fn create_space_with_id(db: &DbClient, id: &str, space: Space) -> Result<Space> {
        let created: Option<Space> = db.create(("space", id)).content(space).await?;
        created.ok_or_else(|| anyhow::anyhow!("Failed to create space"))
    }
    
    // =========================================================================
    // Racks
    // =========================================================================
    
    pub async fn list_racks(db: &DbClient) -> Result<Vec<Rack>> {
        let racks: Vec<Rack> = db.select("rack").await?;
        Ok(racks)
    }
    
    pub async fn create_rack(db: &DbClient, rack: Rack) -> Result<Rack> {
        let created: Option<Rack> = db.create("rack").content(rack).await?;
        created.ok_or_else(|| anyhow::anyhow!("Failed to create rack"))
    }
    
    pub async fn create_rack_with_id(db: &DbClient, id: &str, rack: Rack) -> Result<Rack> {
        let created: Option<Rack> = db.create(("rack", id)).content(rack).await?;
        created.ok_or_else(|| anyhow::anyhow!("Failed to create rack"))
    }
}
