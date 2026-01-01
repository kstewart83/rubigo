//! Vectors API routes - get unified test vectors

use axum::{
    extract::Path,
    response::Json,
    http::StatusCode,
};
use std::path::PathBuf;

/// Get project root
fn project_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .to_path_buf()
}

/// Get unified test vectors for a component
pub async fn get_vectors(Path(id): Path<String>) -> Result<Json<serde_json::Value>, StatusCode> {
    let vectors_path = project_root()
        .join("generated")
        .join("test-vectors")
        .join(format!("{}.unified.json", id));
    
    if !vectors_path.exists() {
        return Err(StatusCode::NOT_FOUND);
    }
    
    let content = std::fs::read_to_string(&vectors_path)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let vectors: serde_json::Value = serde_json::from_str(&content)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    Ok(Json(vectors))
}
