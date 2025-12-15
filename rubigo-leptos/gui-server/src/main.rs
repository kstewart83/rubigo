//! GUI Server - Axum SSR

#![recursion_limit = "256"]
use axum::{
    routing::{get, post},
    response::IntoResponse,
    Router,
};
use std::sync::Arc;
use tokio::sync::Mutex;

mod api;
mod app;
mod cached_geo;
mod components;

use nexosim_hybrid::database::Database;

// Re-export for use in components
pub use nexosim_hybrid::config::{ComponentConfig, ComponentType, ConnectionConfig};
pub use nexosim_hybrid::database::geo::{Region, Site};
pub use nexosim_hybrid::database::simulation::SimulationRun;

/// Application state shared across handlers
#[derive(Clone)]
pub struct AppState {
    pub db: Arc<Database>,
    pub logs: LogBuffer,
    pub geo_cache: cached_geo::SharedCachedGeoPaths,
    /// Current persona for dev-mode (name of person from config)
    pub current_persona: Arc<Mutex<Option<String>>>,
    /// Dev mode flag - enables persona switcher
    pub dev_mode: bool,
}

/// Simple thread-safe log buffer
#[derive(Clone, Default)]
pub struct LogBuffer {
    inner: Arc<Mutex<Vec<String>>>,
}

impl LogBuffer {
    pub async fn append(&self, msg: String) {
        let mut guard = self.inner.lock().await;
        guard.push(msg);
    }
    
    #[allow(dead_code)]
    pub async fn get_and_clear(&self) -> Vec<String> {
        let mut guard = self.inner.lock().await;
        std::mem::take(&mut *guard)
    }
}

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive("gui_server=info".parse().unwrap())
                .add_directive("nexosim_hybrid=info".parse().unwrap()),
        )
        .init();

    // Initialize database
    let db = Database::init()
        .await
        .expect("Failed to create database");
    
    // Seed from scenario config
    let scenario_path = std::env::var("SCENARIO_PATH")
        .unwrap_or_else(|_| "../../common/scenarios/mmc/scenario.toml".to_string());
    if let Err(e) = nexosim_hybrid::database::components::ComponentRepository::seed_from_toml(
        &db.client,
        &scenario_path,
    ).await {
        tracing::warn!("Could not seed database: {}", e);
    }

    // Import cities
    let cities_path = std::env::var("CITIES_DB_PATH")
        .unwrap_or_else(|_| "../../common/geo/worldcities_dev.csv".to_string());
    tracing::info!("Importing cities from {:?}", cities_path);
    match nexosim_hybrid::database::geo::GeoRepository::import_cities(&db.client, std::path::Path::new(&cities_path)).await {
        Ok(count) => tracing::info!("Imported {} cities from CSV.", count),
        Err(e) => tracing::warn!("Failed to import cities: {}", e),
    }

    // Import GeoJSON in background
    tokio::spawn({
        let db = db.clone();
        async move {
            // Countries
            match nexosim_hybrid::database::geo::GeoRepository::import_geojson(
                &db.client,
                std::path::Path::new("../../common/geo/countries_110m.geo.json"),
                "country",
            ).await {
                Ok(count) => tracing::info!("Imported {} countries.", count),
                Err(e) => tracing::warn!("Failed to import countries: {}", e),
            }
            
            // US States
            match nexosim_hybrid::database::geo::GeoRepository::import_geojson(
                &db.client,
                std::path::Path::new("../../common/geo/us_states_20m.geo.json"),
                "state",
            ).await {
                Ok(count) => tracing::info!("Imported {} US states.", count),
                Err(e) => tracing::warn!("Failed to import US states: {}", e),
            }
        }
    });

    // Spawn high-fidelity background import (runs after low-fidelity startup)
    tokio::spawn({
        let db = db.clone();
        async move {
            // Wait for server to be ready and initial imports to complete
            tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
            tracing::info!("Starting high-fidelity background imports...");

            // High-fidelity cities (~48K)
            match nexosim_hybrid::database::geo::GeoRepository::import_cities_full(
                &db.client,
                std::path::Path::new("../../common/geo/worldcities.csv"),
            ).await {
                Ok(count) => tracing::info!("High-fidelity city import complete: {} cities.", count),
                Err(e) => tracing::warn!("Failed high-fidelity city import: {}", e),
            }

            // High-fidelity countries (10m detail)
            match nexosim_hybrid::database::geo::GeoRepository::import_geojson_high_fidelity(
                &db.client,
                std::path::Path::new("../../common/geo/countries_10m.geo.json"),
                "country",
            ).await {
                Ok(count) => tracing::info!("High-fidelity country import complete: {} countries.", count),
                Err(e) => tracing::warn!("Failed high-fidelity country import: {}", e),
            }

            // High-fidelity US states (5m detail)
            match nexosim_hybrid::database::geo::GeoRepository::import_geojson_high_fidelity(
                &db.client,
                std::path::Path::new("../../common/geo/us_states_5m.geo.json"),
                "state",
            ).await {
                Ok(count) => tracing::info!("High-fidelity US state import complete: {} states.", count),
                Err(e) => tracing::warn!("Failed high-fidelity US state import: {}", e),
            }

            tracing::info!("All high-fidelity background imports complete!");
        }
    });

    let geo_cache = cached_geo::new_shared_cache();

    // Check for DEV_MODE environment variable
    let dev_mode = std::env::var("DEV_MODE").map(|v| v == "true" || v == "1").unwrap_or(false);
    
    let state = AppState {
        db: Arc::new(db),
        logs: LogBuffer::default(),
        geo_cache: geo_cache.clone(),
        current_persona: Arc::new(Mutex::new(None)),
        dev_mode,
    };

    // Spawn task to warm geo cache after initial import
    tokio::spawn({
        let db_arc = state.db.clone();
        let cache = geo_cache.clone();
        async move {
            // Wait for initial geo imports to complete
            tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
            
            // Fetch features and cache paths
            if let Ok(features) = nexosim_hybrid::database::geo::GeoRepository::list_geo_features(
                &db_arc.client, None
            ).await {
                let cached = cached_geo::CachedGeoPaths::from_features(&features);
                *cache.write().await = cached;
                tracing::info!("Geo path cache warmed successfully");
            }
        }
    });

    // Get port from environment
    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(3000);

    // Build router
    let app = Router::new()
        // Static files
        .nest_service("/assets", tower_http::services::ServeDir::new("assets"))
        .nest_service("/scenarios", tower_http::services::ServeDir::new("scenarios"))
        // SSE for dev auto-reload
        .route("/sse", get(sse_handler))
        // API routes
        .route("/api/components", get(api::list_components))
        .route("/api/connections", get(api::list_connections))
        .route("/api/regions", get(api::list_regions))
        .route("/api/sites", get(api::list_sites))
        .route("/api/geo/features", get(api::list_geo_features))
        .route("/api/cities/search", get(api::search_cities))
        // Persona management
        .route("/api/persona", get(handle_get_persona))
        .route("/api/persona", post(handle_set_persona))
        .route("/api/persona", axum::routing::delete(handle_delete_persona))
        .route("/api/people", get(api::list_people))
        .route("/api/people/:id/photo", get(api::get_person_photo))
        // Form handlers
        .route("/components/create", post(handle_create_component))
        .route("/components/:id/delete", post(handle_delete_component))
        .route("/connections/create", post(handle_create_connection))
        .route("/connections/:from/:to/delete", post(handle_delete_connection))
        .route("/sites/create", post(handle_create_site))
        .route("/regions/create", post(handle_create_region))
        .route("/buildings/create", post(handle_create_building))
        .route("/floors/create", post(handle_create_floor))
        .route("/spaces/create", post(handle_create_space))
        .route("/racks/create", post(handle_create_rack))
        .route("/devices/create", post(handle_create_device))
        .route("/simulation/start", post(handle_start_simulation))
        .route("/runs/:id/delete", post(handle_delete_run))
        .route("/events/create", post(handle_create_event))
        // Main page - SSR
        .route("/", get(root_handler))
        .with_state(state);

    let addr = std::net::SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("listening on http://{}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

// ============================================================================
// Page Handlers
// ============================================================================

use axum::response::Html;
use axum::extract::{Query, State, Form, Path};

#[derive(serde::Deserialize, Default)]
pub struct PageParams {
    pub tab: Option<String>,
    pub view: Option<String>,
    pub workweek: Option<String>,
    pub region_id: Option<String>,
    pub site_id: Option<String>,
    pub building_id: Option<String>,
    pub floor_id: Option<String>,
    pub space_id: Option<String>,
    pub rack_id: Option<String>,
    pub month: Option<u32>,
    pub year: Option<i32>,
    pub modal: Option<String>,
    #[allow(dead_code)]
    pub run_id: Option<String>,
}


async fn root_handler(
    State(state): State<AppState>,
    Query(params): Query<PageParams>,
) -> Html<String> {
    // Fetch data from database
    let components = nexosim_hybrid::database::components::ComponentRepository::get_all(&state.db.client)
        .await
        .unwrap_or_default();
    let connections = nexosim_hybrid::database::connections::ConnectionRepository::get_all(&state.db.client)
        .await
        .unwrap_or_default();
    let regions = nexosim_hybrid::database::geo::GeoRepository::list_regions(&state.db.client)
        .await
        .unwrap_or_default();
    let sites = nexosim_hybrid::database::geo::GeoRepository::list_sites(&state.db.client)
        .await
        .unwrap_or_default();
    let runs = nexosim_hybrid::database::simulation::SimulationRepository::get_all(&state.db.client)
        .await
        .unwrap_or_default();
    let geo_features = nexosim_hybrid::database::geo::GeoRepository::list_geo_features(&state.db.client, None)
        .await
        .unwrap_or_default();
    
    // Determine active tab (default to home)
    let active_tab = params.tab.as_deref().unwrap_or("home");
    
    // Determine geo view based on params
    use crate::components::sites_tab::GeoView;
    let geo_view = if let Some(view) = &params.view {
        match view.as_str() {
            "create_region" => GeoView::CreateRegion,
            "create_site" => params.region_id.clone().map(GeoView::CreateSite).unwrap_or(GeoView::RegionList),
            "create_building" => params.site_id.clone().map(GeoView::CreateBuilding).unwrap_or(GeoView::RegionList),
            "create_floor" => params.building_id.clone().map(GeoView::CreateFloor).unwrap_or(GeoView::RegionList),
            "create_space" => params.floor_id.clone().map(GeoView::CreateSpace).unwrap_or(GeoView::RegionList),
            "create_rack" => params.space_id.clone().map(GeoView::CreateRack).unwrap_or(GeoView::RegionList),
            "create_device" => params.rack_id.clone().map(GeoView::CreateDevice).unwrap_or(GeoView::RegionList),
            _ => GeoView::RegionList,
        }
    } else if let Some(id) = &params.rack_id {
        GeoView::RackDetail(id.clone())
    } else if let Some(id) = &params.space_id {
        GeoView::SpaceDetail(id.clone())
    } else if let Some(id) = &params.floor_id {
        GeoView::FloorDetail(id.clone())
    } else if let Some(id) = &params.building_id {
        GeoView::BuildingDetail(id.clone())
    } else if let Some(id) = &params.site_id {
        GeoView::SiteDetail(id.clone())
    } else if let Some(id) = &params.region_id {
        GeoView::RegionDetail(id.clone())
    } else {
        GeoView::RegionList
    };

    // Fetch buildings for display
    let buildings = nexosim_hybrid::database::geo::GeoRepository::list_all_buildings(&state.db.client)
        .await
        .unwrap_or_default();
    
    // Fetch floors for location lookup
    let floors = nexosim_hybrid::database::geo::GeoRepository::list_all_floors(&state.db.client)
        .await
        .unwrap_or_default();
    
    // Fetch spaces for location lookup
    let spaces = nexosim_hybrid::database::geo::GeoRepository::list_all_spaces(&state.db.client)
        .await
        .unwrap_or_default();
    
    // Fetch racks for asset location lookup
    let racks = nexosim_hybrid::database::geo::GeoRepository::list_all_racks(&state.db.client)
        .await
        .unwrap_or_default();
    
    // Fetch assets for asset management
    let assets = nexosim_hybrid::database::geo::GeoRepository::list_all_assets(&state.db.client)
        .await
        .unwrap_or_default();
    
    // Get cached geo paths for fast rendering
    let (cached_country_paths, cached_state_paths, cached_globe_country_paths, cached_globe_state_paths) = {
        let cache = state.geo_cache.read().await;
        (
            cache.country_paths.clone(),
            cache.state_paths.clone(),
            cache.globe_country_paths.clone(),
            cache.globe_state_paths.clone(),
        )
    };
    
    // Get persona state
    let current_persona = state.current_persona.lock().await.clone();
    let people = nexosim_hybrid::database::geo::GeoRepository::list_all_people(&state.db.client)
        .await
        .unwrap_or_default();
    
    // Fetch meetings for calendar
    let meetings = nexosim_hybrid::database::calendar::CalendarRepository::get_all(&state.db.client)
        .await
        .unwrap_or_default();
    
    // Render the page
    let html = app::render_page(app::PageData {
        components,
        connections,
        regions,
        sites,
        buildings,
        floors,
        spaces,
        racks,
        devices: vec![],
        assets,
        runs,
        geo_features,
        cached_country_paths,
        cached_state_paths,
        cached_globe_country_paths,
        cached_globe_state_paths,
        active_tab: active_tab.to_string(),
        view: params.view.clone(),
        workweek: params.workweek.clone(),
        geo_view,
        run_id: None,
        month: params.month,
        year: params.year,
        modal: params.modal.clone(),

        dev_mode: state.dev_mode,
        current_persona,
        people,
        meetings,
    });

    
    Html(html)
}

// ============================================================================
// Form Handlers
// ============================================================================

#[derive(serde::Deserialize)]
pub struct CreateComponentForm {
    pub id: Option<String>,
    pub name: String,
    pub component_type: String,
}

async fn handle_create_component(
    State(state): State<AppState>,
    Form(form): Form<CreateComponentForm>,
) -> impl axum::response::IntoResponse {
    let comp_type = match form.component_type.as_str() {
        "router" => ComponentType::Router,
        "switch" => ComponentType::Switch,
        _ => ComponentType::Router,
    };
    
    // Determine ID: use provided ID or find next available
    let id = match form.id.as_ref().and_then(|s| s.trim().parse::<u32>().ok()) {
        Some(explicit_id) => explicit_id,
        None => {
            // Find next available ID (max + 1, or 0 if empty)
            let existing = nexosim_hybrid::database::components::ComponentRepository::get_all(&state.db.client)
                .await
                .unwrap_or_default();
            existing.iter().map(|c| c.id).max().map(|m| m + 1).unwrap_or(0)
        }
    };
    
    let config = ComponentConfig {
        id,
        name: form.name,
        component_type: comp_type,
        placement: Default::default(),
    };
    
    let _ = nexosim_hybrid::database::components::ComponentRepository::create(&state.db.client, config).await;
    axum::response::Redirect::to("/?tab=components")
}

async fn handle_delete_component(
    State(state): State<AppState>,
    Path(id): Path<u32>,
) -> impl axum::response::IntoResponse {
    let _ = nexosim_hybrid::database::components::ComponentRepository::delete(&state.db.client, id).await;
    axum::response::Redirect::to("/?tab=components")
}

#[derive(serde::Deserialize)]
pub struct CreateConnectionForm {
    pub from_id: u32,
    pub to_id: u32,
}

async fn handle_create_connection(
    State(state): State<AppState>,
    Form(form): Form<CreateConnectionForm>,
) -> impl axum::response::IntoResponse {
    let conn = ConnectionConfig { from: form.from_id, to: form.to_id };
    let _ = nexosim_hybrid::database::connections::ConnectionRepository::create(&state.db.client, conn).await;
    axum::response::Redirect::to("/?tab=connections")
}

async fn handle_delete_connection(
    State(state): State<AppState>,
    Path((from, to)): Path<(u32, u32)>,
) -> impl axum::response::IntoResponse {
    let _ = nexosim_hybrid::database::connections::ConnectionRepository::delete(&state.db.client, from, to).await;
    axum::response::Redirect::to("/?tab=connections")
}

#[derive(serde::Deserialize)]
pub struct CreateSiteForm {
    pub name: String,
    pub status: String,
    pub region_id: String,
}

async fn handle_create_site(
    State(state): State<AppState>,
    Form(form): Form<CreateSiteForm>,
) -> impl axum::response::IntoResponse {
    // Parse region_id - it may come as "region:id" or just "id"
    let region_thing = if form.region_id.contains(':') {
        let parts: Vec<&str> = form.region_id.splitn(2, ':').collect();
        surrealdb::sql::Thing::from((parts[0], parts[1]))
    } else {
        surrealdb::sql::Thing::from(("region", form.region_id.as_str()))
    };
    
    let site = Site {
        id: None,
        name: form.name,
        region_id: Some(region_thing.clone()),
        location: (0.0, 0.0), // Default location, inherited from region in practice
        status: form.status,
    };
    let _ = nexosim_hybrid::database::geo::GeoRepository::create_site(&state.db.client, site).await;
    axum::response::Redirect::to(&format!("/?tab=sites&region_id={}", form.region_id))
}

#[derive(serde::Deserialize)]
pub struct CreateRegionForm {
    pub name: String,
    pub city: String,
    pub country: String,
    pub lat: f64,
    pub lon: f64,
}

async fn handle_create_region(
    State(state): State<AppState>,
    Form(form): Form<CreateRegionForm>,
) -> impl axum::response::IntoResponse {
    let region = Region {
        id: None,
        name: form.name,
        city: form.city,
        country: form.country,
        population: 0,
        location: (form.lon, form.lat),
    };
    let _: Option<Region> = state.db.client.create("region").content(region).await.ok().flatten();
    axum::response::Redirect::to("/?tab=sites")
}

// Building handlers
#[derive(serde::Deserialize)]
pub struct CreateBuildingForm {
    pub name: String,
    pub site_id: String,
}

async fn handle_create_building(
    State(state): State<AppState>,
    Form(form): Form<CreateBuildingForm>,
) -> impl axum::response::IntoResponse {
    use nexosim_hybrid::database::geo::{Building, GeoRepository};
    let site_thing = parse_thing(&form.site_id, "site");
    let building = Building { id: None, name: form.name, site_id: site_thing };
    let _ = GeoRepository::create_building(&state.db.client, building).await;
    axum::response::Redirect::to(&format!("/?tab=sites&site_id={}", form.site_id))
}

// Floor handlers
#[derive(serde::Deserialize)]
pub struct CreateFloorForm {
    pub name: String,
    pub level: i16,
    pub building_id: String,
}

async fn handle_create_floor(
    State(state): State<AppState>,
    Form(form): Form<CreateFloorForm>,
) -> impl axum::response::IntoResponse {
    use nexosim_hybrid::database::geo::{Floor, GeoRepository};
    let building_thing = parse_thing(&form.building_id, "building");
    let floor = Floor { id: None, name: form.name, building_id: building_thing, level: form.level };
    let _ = GeoRepository::create_floor(&state.db.client, floor).await;
    axum::response::Redirect::to(&format!("/?tab=sites&building_id={}", form.building_id))
}

// Space handlers
#[derive(serde::Deserialize)]
pub struct CreateSpaceForm {
    pub name: String,
    pub locator: String,
    pub space_type: Option<String>,
    pub floor_id: String,
}

async fn handle_create_space(
    State(state): State<AppState>,
    Form(form): Form<CreateSpaceForm>,
) -> impl axum::response::IntoResponse {
    use nexosim_hybrid::database::geo::{Space, GeoRepository};
    let floor_thing = parse_thing(&form.floor_id, "floor");
    let space = Space { 
        id: None, 
        name: form.name, 
        locator: form.locator,
        floor_id: floor_thing, 
        space_type: form.space_type 
    };
    let _ = GeoRepository::create_space(&state.db.client, space).await;
axum::response::Redirect::to(&format!("/?tab=sites&floor_id={}", form.floor_id))
}

// Rack handlers
#[derive(serde::Deserialize)]
pub struct CreateRackForm {
    pub name: String,
    pub height_u: u8,
    pub space_id: String,
}

async fn handle_create_rack(
    State(state): State<AppState>,
    Form(form): Form<CreateRackForm>,
) -> impl axum::response::IntoResponse {
    use nexosim_hybrid::database::geo::{Rack, GeoRepository};
    let space_thing = parse_thing(&form.space_id, "space");
    let rack = Rack { id: None, name: form.name, space_id: space_thing, height_u: form.height_u };
    let _ = GeoRepository::create_rack(&state.db.client, rack).await;
    axum::response::Redirect::to(&format!("/?tab=sites&space_id={}", form.space_id))
}

// Device handlers
#[derive(serde::Deserialize)]
pub struct CreateDeviceForm {
    pub name: String,
    pub position_u: u8,
    pub rack_id: String,
}

async fn handle_create_device(
    State(state): State<AppState>,
    Form(form): Form<CreateDeviceForm>,
) -> impl axum::response::IntoResponse {
    use nexosim_hybrid::database::geo::{Device, GeoRepository};
    let rack_thing = parse_thing(&form.rack_id, "rack");
    let device = Device { id: None, name: form.name, rack_id: rack_thing, position_u: form.position_u, component_id: None };
    let _ = GeoRepository::create_device(&state.db.client, device).await;
    axum::response::Redirect::to(&format!("/?tab=sites&rack_id={}", form.rack_id))
}

// Helper to parse Thing from string (handles "table:id" or just "id")
fn parse_thing(s: &str, default_table: &str) -> surrealdb::sql::Thing {
    if s.contains(':') {
        let parts: Vec<&str> = s.splitn(2, ':').collect();
        surrealdb::sql::Thing::from((parts[0], parts[1]))
    } else {
        surrealdb::sql::Thing::from((default_table, s))
    }
}

async fn handle_start_simulation(
    State(state): State<AppState>,
) -> impl axum::response::IntoResponse {
    use chrono::Utc;
    use nexosim_hybrid::database::simulation::{SimulationRepository, SimulationRun};
    use nexosim_hybrid::database::components::ComponentRepository;
    use nexosim_hybrid::database::connections::ConnectionRepository;
    use nexosim_hybrid::simulation::SimulationBuilder;
    use nexosim_hybrid::model::{Component, RouterModel, SwitchModel};
    use nexosim::ports::Output;
    use std::collections::HashMap;
    
    let timestamp = Utc::now().format("%Y-%m-%d %H:%M:%S UTC").to_string();
    tracing::info!("Simulation started at {}", timestamp);
    
    let mut logs = vec![format!("[{}] Simulation initialized", timestamp)];
    
    // Fetch components and connections from database
    let components = ComponentRepository::get_all(&state.db.client)
        .await
        .unwrap_or_default();
    let connections = ConnectionRepository::get_all(&state.db.client)
        .await
        .unwrap_or_default();
    
    logs.push(format!("[{}] Loaded {} components and {} connections", 
        Utc::now().format("%H:%M:%S"), components.len(), connections.len()));
    
    if components.is_empty() {
        logs.push(format!("[{}] No components found - nothing to simulate", 
            Utc::now().format("%H:%M:%S")));
        let run = SimulationRun {
            id: None,
            started_at: timestamp,
            status: "completed".to_string(),
            logs,
        };
        let _ = SimulationRepository::create(&state.db.client, run).await;
        return axum::response::Redirect::to("/?tab=simulation");
    }
    
    // Build simulation
    let mut builder = SimulationBuilder::new();
    let mut component_indices: HashMap<u32, usize> = HashMap::new();
    
    // Add components to simulation
    for comp in &components {
        let id = comp.id;
        let component = match &comp.component_type {
            nexosim_hybrid::config::ComponentType::Router => 
                Component::Router(RouterModel { id, output: Output::default() }),
            nexosim_hybrid::config::ComponentType::Switch => 
                Component::Switch(SwitchModel { id, output: Output::default() }),
            // These types don't have simulation models yet - skip them
            nexosim_hybrid::config::ComponentType::Firewall |
            nexosim_hybrid::config::ComponentType::Server |
            nexosim_hybrid::config::ComponentType::Workstation |
            nexosim_hybrid::config::ComponentType::AccessPoint |
            nexosim_hybrid::config::ComponentType::Phone |
            nexosim_hybrid::config::ComponentType::Printer => continue,
            nexosim_hybrid::config::ComponentType::PacketGenerator { .. } => 
                continue, // Skip packet generators for now - they need special handling
            nexosim_hybrid::config::ComponentType::WasmModule { .. } => 
                continue, // Skip wasm modules for now
        };
        
        let idx = builder.add_component(component, &comp.name);
        component_indices.insert(comp.id, idx);
        logs.push(format!("[{}] Added {:?} '{}' (id={})", 
            Utc::now().format("%H:%M:%S"), comp.component_type, comp.name, comp.id));
    }
    
    // Establish connections
    for conn in &connections {
        if let (Some(&src_idx), Some(&target_idx)) = 
            (component_indices.get(&conn.from), component_indices.get(&conn.to)) 
        {
            builder.connect(src_idx, target_idx);
            logs.push(format!("[{}] Connected {} -> {}", 
                Utc::now().format("%H:%M:%S"), 
                conn.from, conn.to));
        }
    }
    
    logs.push(format!("[{}] Building simulation...", Utc::now().format("%H:%M:%S")));
    
    // Build and run simulation
    match builder.build() {
        Ok(mut sim) => {
            logs.push(format!("[{}] Simulation engine started", Utc::now().format("%H:%M:%S")));
            
            // Run 10 simulation steps
            let step_count = 10;
            for step in 0..step_count {
                match sim.step() {
                    Ok(()) => {
                        if step == 0 || step == step_count - 1 {
                            logs.push(format!("[{}] Step {} completed", 
                                Utc::now().format("%H:%M:%S"), step + 1));
                        }
                    }
                    Err(e) => {
                        logs.push(format!("[{}] Step {} error: {:?}", 
                            Utc::now().format("%H:%M:%S"), step + 1, e));
                        break;
                    }
                }
            }
            
            logs.push(format!("[{}] Simulation completed: {} steps executed", 
                Utc::now().format("%H:%M:%S"), step_count));
        }
        Err(e) => {
            logs.push(format!("[{}] Simulation build failed: {:?}", 
                Utc::now().format("%H:%M:%S"), e));
        }
    }
    
    // Save run record
    let run = SimulationRun {
        id: None,
        started_at: timestamp,
        status: "completed".to_string(),
        logs,
    };
    
    let _ = SimulationRepository::create(&state.db.client, run).await;
    
    axum::response::Redirect::to("/?tab=simulation")
}

async fn handle_delete_run(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> impl axum::response::IntoResponse {
    use nexosim_hybrid::database::simulation::SimulationRepository;
    let _ = SimulationRepository::delete(&state.db.client, &id).await;
    axum::response::Redirect::to("/?tab=simulation")
}

// Event creation handler
#[derive(serde::Deserialize)]
pub struct CreateEventForm {
    pub title: String,
    #[serde(rename = "type")]
    pub event_type: Option<String>,
    pub start_date: Option<String>,
    pub start_time: Option<String>,
    pub end_date: Option<String>,
    pub end_time: Option<String>,
    pub timezone: Option<String>,
    pub description: Option<String>,
    pub is_recurring: Option<String>,
    pub freq: Option<String>,
    pub interval: Option<u32>,
    #[serde(default, deserialize_with = "deserialize_byday")]
    pub byday: Vec<String>,
    pub until_type: Option<String>,
    pub until_date: Option<String>,
    pub count: Option<u32>,
}

// Custom deserializer to handle both single string and array of strings from form
fn deserialize_byday<'de, D>(deserializer: D) -> Result<Vec<String>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    use serde::de::{self, Visitor};
    
    struct BydayVisitor;
    
    impl<'de> Visitor<'de> for BydayVisitor {
        type Value = Vec<String>;
        
        fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
            formatter.write_str("a string or sequence of strings")
        }
        
        fn visit_str<E>(self, v: &str) -> Result<Self::Value, E>
        where
            E: de::Error,
        {
            Ok(vec![v.to_string()])
        }
        
        fn visit_seq<A>(self, mut seq: A) -> Result<Self::Value, A::Error>
        where
            A: de::SeqAccess<'de>,
        {
            let mut vec = Vec::new();
            while let Some(item) = seq.next_element::<String>()? {
                vec.push(item);
            }
            Ok(vec)
        }
        
        fn visit_none<E>(self) -> Result<Self::Value, E>
        where
            E: de::Error,
        {
            Ok(Vec::new())
        }
        
        fn visit_unit<E>(self) -> Result<Self::Value, E>
        where
            E: de::Error,
        {
            Ok(Vec::new())
        }
    }
    
    deserializer.deserialize_any(BydayVisitor)
}


async fn handle_create_event(
    State(state): State<AppState>,
    Form(form): Form<CreateEventForm>,
) -> impl axum::response::IntoResponse {
    use nexosim_hybrid::database::calendar::{Meeting, MeetingType, RecurrenceFrequency, CalendarRepository};
    
    // Parse dates and times
    let start_date = form.start_date.unwrap_or_else(|| chrono::Utc::now().format("%Y-%m-%d").to_string());
    let start_time = form.start_time.unwrap_or_else(|| "09:00 AM".to_string());
    let end_date = form.end_date.unwrap_or_else(|| start_date.clone());
    let end_time = form.end_time.unwrap_or_else(|| "10:00 AM".to_string());
    
    // Convert 12-hour to 24-hour format
    fn to_24h(time_str: &str) -> String {
        let parts: Vec<&str> = time_str.split_whitespace().collect();
        if parts.len() == 2 {
            let time_part = parts[0];
            let period = parts[1].to_uppercase();
            let hm: Vec<&str> = time_part.split(':').collect();
            if hm.len() == 2 {
                let mut hour: u32 = hm[0].parse().unwrap_or(9);
                let min: u32 = hm[1].parse().unwrap_or(0);
                if period == "PM" && hour != 12 {
                    hour += 12;
                } else if period == "AM" && hour == 12 {
                    hour = 0;
                }
                return format!("{:02}:{:02}:00", hour, min);
            }
        }
        "09:00:00".to_string()
    }
    
    let start_time_24 = to_24h(&start_time);
    let end_time_24 = to_24h(&end_time);
    
    // Build ISO datetime strings
    let start_datetime = format!("{}T{}", start_date, start_time_24);
    let end_datetime = format!("{}T{}", end_date, end_time_24);
    
    // Determine meeting type
    let meeting_type = match form.event_type.as_deref() {
        Some("Standup") => MeetingType::Standup,
        Some("AllHands") => MeetingType::AllHands,
        Some("OneOnOne") => MeetingType::OneOnOne,
        Some("Training") => MeetingType::Training,
        Some("Interview") => MeetingType::Interview,
        Some("Holiday") => MeetingType::Holiday,
        Some("Conference") => MeetingType::Conference,
        Some("Review") => MeetingType::Review,
        Some("Planning") => MeetingType::Planning,
        _ => MeetingType::Meeting,
    };
    
    // Determine recurrence
    let is_recurring = form.is_recurring.as_deref() == Some("on");
    let recurrence = if is_recurring {
        match form.freq.as_deref() {
            Some("DAILY") => RecurrenceFrequency::Daily,
            Some("WEEKLY") => RecurrenceFrequency::Weekly,
            Some("MONTHLY") => RecurrenceFrequency::Monthly,
            Some("YEARLY") => RecurrenceFrequency::Yearly,
            _ => RecurrenceFrequency::None,
        }
    } else {
        RecurrenceFrequency::None
    };
    
    // Recurrence days
    let recurrence_days = form.byday;
    
    // Recurrence end
    let recurrence_until = if form.until_type.as_deref() == Some("date") {
        form.until_date.map(|d| format!("{}T23:59:59", d))
    } else {
        None
    };
    let recurrence_count = if form.until_type.as_deref() == Some("count") {
        form.count
    } else {
        None
    };
    
    let meeting = Meeting {
        id: None,
        title: form.title,
        description: form.description,
        start_time: start_datetime,
        end_time: end_datetime,
        all_day: false,
        meeting_type,
        recurrence,
        recurrence_interval: form.interval.unwrap_or(1),
        recurrence_days,
        recurrence_until,
        recurrence_count,
        location_id: None,
        virtual_url: None,
        organizer_id: None,
        participant_ids: vec![],
        timezone: form.timezone.unwrap_or_else(|| "America/New_York".to_string()),
    };
    
    if let Err(e) = CalendarRepository::create(&state.db.client, meeting).await {
        tracing::warn!("Failed to create event: {}", e);
    }
    
    axum::response::Redirect::to("/?tab=calendar")
}

// ============================================================================
// Persona Handlers (Dev Mode Only)
// ============================================================================

#[derive(serde::Serialize)]
struct PersonaResponse {
    dev_mode: bool,
    current_persona: Option<String>,
}

async fn handle_get_persona(
    State(state): State<AppState>,
) -> axum::Json<PersonaResponse> {
    let persona = state.current_persona.lock().await.clone();
    axum::Json(PersonaResponse {
        dev_mode: state.dev_mode,
        current_persona: persona,
    })
}

#[derive(serde::Deserialize)]
struct SetPersonaRequest {
    name: Option<String>,
}

async fn handle_set_persona(
    State(state): State<AppState>,
    axum::Json(payload): axum::Json<SetPersonaRequest>,
) -> impl axum::response::IntoResponse {
    let mut persona = state.current_persona.lock().await;
    *persona = payload.name.clone();
    axum::Json(PersonaResponse {
        dev_mode: state.dev_mode,
        current_persona: payload.name,
    }).into_response()
}

async fn handle_delete_persona(
    State(state): State<AppState>,
) -> impl axum::response::IntoResponse {
    let mut persona = state.current_persona.lock().await;
    *persona = None;
    axum::Json(PersonaResponse {
        dev_mode: state.dev_mode,
        current_persona: None,
    })
}

// ============================================================================
// SSE Handler for Dev Auto-Reload
// ============================================================================

async fn sse_handler() -> impl axum::response::IntoResponse {
    use axum::response::sse::{Event, Sse};
    use futures::stream;
    use std::time::Duration;
    use tokio_stream::StreamExt;
    
    let stream = stream::repeat_with(|| {
        Event::default().data("keepalive")
    })
    .map(Ok::<_, std::convert::Infallible>)
    .throttle(Duration::from_secs(10));
    
    Sse::new(stream).keep_alive(
        axum::response::sse::KeepAlive::new()
            .interval(Duration::from_secs(5))
            .text("ping")
    )
}
