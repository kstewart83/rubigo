#![allow(dead_code)]

use crate::AppState;
use axum::extract::{State, Query, Path};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use nexosim_hybrid::config::{ComponentConfig, ConnectionConfig};
use nexosim_hybrid::database::simulation::SimulationRun;
use nexosim_hybrid::database::{components::ComponentRepository, connections::ConnectionRepository};

pub async fn list_components(State(state): State<AppState>) -> Json<Vec<ComponentConfig>> {
    let components = ComponentRepository::get_all(&state.db.client)
        .await
        .unwrap_or_default();
    Json(components)
}

pub async fn create_component(
    State(state): State<AppState>,
    Json(payload): Json<ComponentConfig>,
) -> impl IntoResponse {
    match ComponentRepository::create(&state.db.client, payload).await {
        Ok(c) => (StatusCode::CREATED, Json(c)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn update_component(
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<u32>,
    Json(payload): Json<ComponentConfig>,
) -> impl IntoResponse {
    match ComponentRepository::update(&state.db.client, id, payload).await {
        Ok(c) => (StatusCode::OK, Json(c)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn delete_component(
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<u32>,
) -> impl IntoResponse {
    match ComponentRepository::delete(&state.db.client, id).await {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn list_connections(State(state): State<AppState>) -> Json<Vec<ConnectionConfig>> {
    let connections = ConnectionRepository::get_all(&state.db.client).await.unwrap_or_default();
    Json(connections)
}

#[allow(dead_code)]
pub async fn create_connection(
    State(state): State<AppState>,
    Json(config): Json<ConnectionConfig>,
) -> impl IntoResponse {
    let _ = ConnectionRepository::create(&state.db.client, config).await;
}

#[allow(dead_code)]
pub async fn delete_connection(
    State(state): State<AppState>,
    axum::extract::Path((from, to)): axum::extract::Path<(u32, u32)>,
) -> impl IntoResponse {
    let _ = ConnectionRepository::delete(&state.db.client, from, to).await;
}

pub async fn list_runs(State(state): State<AppState>) -> Json<Vec<SimulationRun>> {
    use nexosim_hybrid::database::simulation::SimulationRepository;
    let runs = SimulationRepository::get_all(&state.db.client).await.unwrap_or_default();
    Json(runs)
}

use nexosim_hybrid::database::geo::{self, City, Region, Site};

pub async fn search_cities(
    State(state): State<AppState>,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> Json<Vec<City>> {
    let query = params.get("q").cloned().unwrap_or_default();
    let cities = geo::GeoRepository::search_cities(&state.db.client, &query)
        .await
        .unwrap_or_default();
    Json(cities)
}

pub async fn list_sites(State(state): State<AppState>) -> Json<Vec<Site>> {
    let sites = geo::GeoRepository::list_sites(&state.db.client)
        .await
        .unwrap_or_default();
    Json(sites)
}

#[allow(dead_code)]
pub async fn search_regions(
    State(state): State<AppState>,
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> Json<Vec<Region>> {
    let query = params.get("q").map(|s| s.as_str()).unwrap_or("");
    let regions = geo::GeoRepository::search_regions(&state.db.client, query)
        .await
        .unwrap_or_default();
    Json(regions)
}

pub async fn list_regions(State(state): State<AppState>) -> Json<Vec<Region>> {
    let regions = geo::GeoRepository::list_regions(&state.db.client)
        .await
        .unwrap_or_default();
    Json(regions)
}

/// Get geographic features as GeoJSON FeatureCollection
/// Query params: type (optional) - "country" or "state"
pub async fn list_geo_features(
    State(state): State<AppState>,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> impl IntoResponse {
    let feature_type = params.get("type").map(|s| s.as_str());
    
    match geo::GeoRepository::list_geo_features(&state.db.client, feature_type).await {
        Ok(features) => {
            // Convert to GeoJSON FeatureCollection format
            let geojson_features: Vec<serde_json::Value> = features.iter().map(|f| {
                serde_json::json!({
                    "type": "Feature",
                    "properties": {
                        "name": f.name,
                        "feature_type": f.feature_type,
                        "iso_code": f.iso_code,
                    },
                    "geometry": f.geometry
                })
            }).collect();
            
            let feature_collection = serde_json::json!({
                "type": "FeatureCollection",
                "features": geojson_features
            });
            
            Json(feature_collection).into_response()
        }
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

#[allow(dead_code)]
pub async fn create_site(
    State(state): State<AppState>,
    Json(site): Json<Site>,
) -> impl IntoResponse {
    match geo::GeoRepository::create_site(&state.db.client, site).await {
        Ok(s) => (StatusCode::CREATED, Json(s)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

use nexosim_hybrid::database::geo::{Rack, Device};
use serde::Deserialize;
use surrealdb::sql::thing;

#[derive(Deserialize)]
pub struct CreateRegionRequest {
    pub name: String,
    pub city: String,
    pub country: String,
    pub lat: f64,
    pub lon: f64,
}

#[allow(dead_code)]
#[derive(Deserialize)]
pub struct CreateSiteRequest {
    pub name: String,
    pub status: String,
    pub lat: f64,
    pub lon: f64,
    pub region_id: String,
}

#[derive(Deserialize)]
pub struct CreateRackRequest {
    pub name: String,
    pub space_id: String,
    pub height_u: u8,
}


#[derive(Deserialize)]
pub struct CreateBuildingRequest {
    pub name: String,
    pub site_id: String,
}

#[derive(Deserialize)]
pub struct CreateFloorRequest {
    pub name: String,
    pub building_id: String,
    pub level: i16,
}

#[derive(Deserialize)]
pub struct CreateSpaceRequest {
    pub name: String,
    pub floor_id: String,
}

#[derive(Deserialize)]
pub struct CreateDeviceRequest {
    pub name: String,
    pub rack_id: String,
    pub position_u: u8,
    pub component_id: Option<String>,
}

pub async fn list_buildings(
    State(state): State<AppState>,
    axum::extract::Path(site_id): axum::extract::Path<String>,
) -> impl IntoResponse {
    match geo::GeoRepository::list_buildings(&state.db.client, &site_id).await {
        Ok(r) => Json(r).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn list_floors(
    State(state): State<AppState>,
    axum::extract::Path(building_id): axum::extract::Path<String>,
) -> impl IntoResponse {
    match geo::GeoRepository::list_floors(&state.db.client, &building_id).await {
        Ok(r) => Json(r).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn list_spaces(
    State(state): State<AppState>,
    axum::extract::Path(floor_id): axum::extract::Path<String>,
) -> impl IntoResponse {
    match geo::GeoRepository::list_spaces(&state.db.client, &floor_id).await {
        Ok(r) => Json(r).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn list_racks(
    State(state): State<AppState>,
    axum::extract::Path(space_id): axum::extract::Path<String>,
) -> impl IntoResponse {
    match geo::GeoRepository::list_racks(&state.db.client, &space_id).await {
        Ok(r) => Json(r).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

#[allow(dead_code)]
pub async fn create_rack(
    State(state): State<AppState>,
    Json(req): Json<CreateRackRequest>,
) -> impl IntoResponse {
    let space_thing = match thing(&req.space_id) {
        Ok(t) => t,
        Err(e) => return (StatusCode::BAD_REQUEST, format!("Invalid space_id: {}", e)).into_response(),
    };

    let rack = Rack {
        id: None,
        name: req.name,
        space_id: space_thing,
        height_u: req.height_u,
    };

    match geo::GeoRepository::create_rack(&state.db.client, rack).await {
        Ok(r) => (StatusCode::CREATED, Json(r)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

// Implement handlers for create_building, create_floor, create_space if needed by API
// For now, these might be minimal implementation to satisfy compilation if used elsewhere
// But since we are updating api.rs, we should probably add them for completeness if the frontend uses them via API.
// However, the frontend creates things via Form POST handlers in main.rs mostly for the "actions".
// API handlers are mainly for fetching.
// I will skip adding create handlers for Building/Floor/Space in API struct unless I see them used.


pub async fn list_devices(
    State(state): State<AppState>,
    axum::extract::Path(rack_id): axum::extract::Path<String>,
) -> impl IntoResponse {
    match geo::GeoRepository::list_devices(&state.db.client, &rack_id).await {
        Ok(d) => Json(d).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

#[allow(dead_code)]
pub async fn create_device(
    State(state): State<AppState>,
    Json(req): Json<CreateDeviceRequest>,
) -> impl IntoResponse {
    let rack_thing = match thing(&req.rack_id) {
        Ok(t) => t,
        Err(e) => return (StatusCode::BAD_REQUEST, format!("Invalid rack_id: {}", e)).into_response(),
    };

    let component_thing = match req.component_id {
        Some(s) => match thing(&s) {
            Ok(t) => Some(t),
            Err(e) => return (StatusCode::BAD_REQUEST, format!("Invalid component_id: {}", e)).into_response(),
        },
        None => None,
    };

    let device = Device {
        id: None,
        name: req.name,
        rack_id: rack_thing,
        position_u: req.position_u,
        component_id: component_thing,
    };

    match geo::GeoRepository::create_device(&state.db.client, device).await {
        Ok(d) => (StatusCode::CREATED, Json(d)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// List all people for persona selection
pub async fn list_people(State(state): State<AppState>) -> impl IntoResponse {
    use nexosim_hybrid::database::geo;
    match geo::GeoRepository::list_all_people(&state.db.client).await {
        Ok(people) => Json(people).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Get photo for a person by ID (returns as binary image)
pub async fn get_person_photo(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    use base64::Engine;
    use nexosim_hybrid::database::geo;
    
    match geo::GeoRepository::get_person_by_id(&state.db.client, &id).await {
        Ok(Some(person)) => {
            if let Some(photo_data) = person.photo_data {
                match base64::engine::general_purpose::STANDARD.decode(&photo_data) {
                    Ok(bytes) => {
                        (
                            StatusCode::OK,
                            [("content-type", "image/png")],
                            bytes,
                        ).into_response()
                    }
                    Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Failed to decode photo").into_response(),
                }
            } else {
                (StatusCode::NOT_FOUND, "No photo available").into_response()
            }
        }
        Ok(None) => (StatusCode::NOT_FOUND, "Person not found").into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}
