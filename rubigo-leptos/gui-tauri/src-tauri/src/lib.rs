//! Tauri Application Entry Point
//!
//! Handles action dispatch from the WASM frontend.

use serde_json::Value;

/// Dispatch an action from the frontend
/// 
/// This command receives serialized actions from TauriBroker in the WASM frontend
/// and routes them to the appropriate handler.
#[tauri::command]
async fn dispatch_action(action_type: String, payload: Value) -> Result<Value, String> {
    // Log the action for debugging
    println!("Dispatching action: {} with payload: {:?}", action_type, payload);
    
    // Route based on action type
    match action_type.as_str() {
        // Asset actions
        "asset/create" => handle_asset_create(payload).await,
        "asset/update" => handle_asset_update(payload).await,
        "asset/delete" => handle_asset_delete(payload).await,
        "asset/list" => handle_asset_list(payload).await,
        "asset/get" => handle_asset_get(payload).await,
        
        // Personnel actions
        "personnel/list" => handle_personnel_list(payload).await,
        "personnel/get" => handle_personnel_get(payload).await,
        
        // Unknown action
        _ => Err(format!("Unknown action type: {}", action_type)),
    }
}

// Placeholder handlers - would connect to actual business logic
async fn handle_asset_create(_payload: Value) -> Result<Value, String> {
    // TODO: Implement actual asset creation
    Ok(serde_json::json!({ "id": "asset-1", "success": true }))
}

async fn handle_asset_update(_payload: Value) -> Result<Value, String> {
    Ok(serde_json::json!({ "success": true }))
}

async fn handle_asset_delete(_payload: Value) -> Result<Value, String> {
    Ok(serde_json::json!({ "success": true }))
}

async fn handle_asset_list(_payload: Value) -> Result<Value, String> {
    // Return mock data for now
    Ok(serde_json::json!([
        { "id": "asset-1", "name": "Server 1", "status": "active" },
        { "id": "asset-2", "name": "Router 1", "status": "active" },
    ]))
}

async fn handle_asset_get(_payload: Value) -> Result<Value, String> {
    Ok(serde_json::json!({ "id": "asset-1", "name": "Server 1", "status": "active" }))
}

async fn handle_personnel_list(_payload: Value) -> Result<Value, String> {
    Ok(serde_json::json!([
        { "id": "person-1", "name": "John Doe", "role": "Engineer" },
    ]))
}

async fn handle_personnel_get(_payload: Value) -> Result<Value, String> {
    Ok(serde_json::json!({ "id": "person-1", "name": "John Doe", "role": "Engineer" }))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![dispatch_action])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
