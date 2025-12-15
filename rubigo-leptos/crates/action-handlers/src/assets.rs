//! Asset action handlers

use actions::{AssetAction, AssetResponse, AssetData, AssetListQuery, CreateAssetData};
use db::client::DbClient;
use db::models::NetworkAsset;
use db::repositories::AssetRepository;
use anyhow::Result;

/// Handle asset actions
pub async fn handle(db: &DbClient, action: AssetAction) -> Result<AssetResponse> {
    match action {
        AssetAction::List(query) => list(db, query).await,
        AssetAction::Get(id) => get(db, &id).await,
        AssetAction::Create(data) => create(db, data).await,
        AssetAction::Update(id, data) => update(db, &id, data).await,
        AssetAction::Delete(id) => delete(db, &id).await,
    }
}

async fn list(db: &DbClient, query: AssetListQuery) -> Result<AssetResponse> {
    let assets = if let Some(ref cat) = query.category {
        AssetRepository::find_by_category(db, cat).await?
    } else if let Some(ref status) = query.status {
        AssetRepository::find_by_status(db, status).await?
    } else {
        AssetRepository::list_all(db).await?
    };
    
    // Apply search filter and convert to response type
    let data: Vec<AssetData> = assets
        .into_iter()
        .filter(|a| {
            if let Some(ref search) = query.search {
                let search_lower = search.to_lowercase();
                a.name.to_lowercase().contains(&search_lower) ||
                a.manufacturer.as_ref().map(|m| m.to_lowercase().contains(&search_lower)).unwrap_or(false) ||
                a.model.as_ref().map(|m| m.to_lowercase().contains(&search_lower)).unwrap_or(false)
            } else {
                true
            }
        })
        .map(|a| AssetData {
            id: a.id.map(|t| t.id.to_string()).unwrap_or_default(),
            name: a.name,
            manufacturer: a.manufacturer.unwrap_or_default(),
            model: a.model.unwrap_or_default(),
            serial_number: a.serial_number.unwrap_or_default(),
            category: a.category.unwrap_or_default(),
            status: a.status.unwrap_or_default(),
        })
        .collect();
    
    // Apply pagination
    let data = if let (Some(offset), Some(limit)) = (query.offset, query.limit) {
        data.into_iter()
            .skip(offset as usize)
            .take(limit as usize)
            .collect()
    } else if let Some(limit) = query.limit {
        data.into_iter().take(limit as usize).collect()
    } else {
        data
    };
    
    Ok(AssetResponse::List(data))
}

async fn get(db: &DbClient, id: &str) -> Result<AssetResponse> {
    match AssetRepository::get_by_id(db, id).await? {
        Some(a) => Ok(AssetResponse::Single(AssetData {
            id: a.id.map(|t| t.id.to_string()).unwrap_or_else(|| id.to_string()),
            name: a.name,
            manufacturer: a.manufacturer.unwrap_or_default(),
            model: a.model.unwrap_or_default(),
            serial_number: a.serial_number.unwrap_or_default(),
            category: a.category.unwrap_or_default(),
            status: a.status.unwrap_or_default(),
        })),
        None => Ok(AssetResponse::Error(format!("Asset not found: {}", id))),
    }
}

async fn create(db: &DbClient, data: CreateAssetData) -> Result<AssetResponse> {
    let asset = NetworkAsset {
        id: None,
        name: data.name,
        category: Some(data.category),
        manufacturer: Some(data.manufacturer),
        model: Some(data.model),
        serial_number: Some(data.serial_number),
        mac_address: data.mac_address,
        status: Some(data.status),
        rack_id: None, // Would need to resolve from rack_id string
        position_u: data.position_u.map(|u| u as i32),
        height_u: data.height_u.map(|u| u as i32),
        space_id: None, // Would need to resolve from space_id string
        storage_location: data.storage_location,
        notes: data.notes,
    };
    
    let created = AssetRepository::create(db, asset).await?;
    
    Ok(AssetResponse::Single(AssetData {
        id: created.id.map(|t| t.id.to_string()).unwrap_or_default(),
        name: created.name,
        manufacturer: created.manufacturer.unwrap_or_default(),
        model: created.model.unwrap_or_default(),
        serial_number: created.serial_number.unwrap_or_default(),
        category: created.category.unwrap_or_default(),
        status: created.status.unwrap_or_default(),
    }))
}

async fn update(db: &DbClient, id: &str, _data: actions::UpdateAssetData) -> Result<AssetResponse> {
    // Get existing asset first
    match AssetRepository::get_by_id(db, id).await? {
        Some(_existing) => {
            // TODO: Apply updates to existing asset
            // For now, just return success
            Ok(AssetResponse::Success)
        }
        None => Ok(AssetResponse::Error(format!("Asset not found: {}", id))),
    }
}

async fn delete(db: &DbClient, id: &str) -> Result<AssetResponse> {
    // Note: SurrealDB delete doesn't error if not found
    let _: Option<NetworkAsset> = db.delete(("asset", id)).await?;
    Ok(AssetResponse::Success)
}
