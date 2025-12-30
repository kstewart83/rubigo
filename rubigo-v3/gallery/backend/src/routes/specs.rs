//! Specs API routes - list and get spec files

use axum::{
    extract::Path,
    response::Json,
    http::StatusCode,
};
use serde::Serialize;
use std::path::PathBuf;
use glob::glob;
use gray_matter::Pod;

/// Convert gray_matter Pod to serde_json::Value
fn pod_to_json(pod: &Pod) -> serde_json::Value {
    match pod {
        Pod::Null => serde_json::Value::Null,
        Pod::Boolean(b) => serde_json::Value::Bool(*b),
        Pod::Integer(i) => serde_json::json!(*i),
        Pod::Float(f) => serde_json::json!(*f),
        Pod::String(s) => serde_json::Value::String(s.clone()),
        Pod::Array(arr) => serde_json::Value::Array(
            arr.iter().map(pod_to_json).collect()
        ),
        Pod::Hash(map) => {
            let obj: serde_json::Map<String, serde_json::Value> = map
                .iter()
                .map(|(k, v)| (k.clone(), pod_to_json(v)))
                .collect();
            serde_json::Value::Object(obj)
        }
    }
}

/// Spec list item
#[derive(Serialize)]
pub struct SpecListItem {
    pub id: String,
    pub name: String,
    pub path: String,
}

/// Full spec response
#[derive(Serialize)]
pub struct SpecResponse {
    pub id: String,
    pub name: String,
    pub content: String,
    pub frontmatter: serde_json::Value,
    pub machine: Option<serde_json::Value>,
}

/// Get project root (relative to binary location in dev)
fn project_root() -> PathBuf {
    // In dev: gallery/backend -> rubigo-v3
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .to_path_buf()
}

/// List all available specs
pub async fn list_specs() -> Json<Vec<SpecListItem>> {
    let specs_dir = project_root().join("specifications");
    let mut specs = Vec::new();
    
    // Find all .sudo.md files
    let pattern = specs_dir.join("**/*.sudo.md");
    if let Ok(paths) = glob(pattern.to_str().unwrap()) {
        for entry in paths.flatten() {
            let relative = entry.strip_prefix(&specs_dir).unwrap_or(&entry);
            let id = relative.to_string_lossy()
                .replace(".sudo.md", "")
                .replace("/", "-");
            let name = entry.file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("unknown")
                .replace(".sudo", "")
                .to_string();
            
            specs.push(SpecListItem {
                id,
                name,
                path: relative.to_string_lossy().to_string(),
            });
        }
    }
    
    Json(specs)
}

/// Get a specific spec by ID
pub async fn get_spec(Path(id): Path<String>) -> Result<Json<SpecResponse>, StatusCode> {
    let specs_dir = project_root().join("specifications");
    
    // Convert ID back to path: "switch-switch" -> "switch/switch.sudo.md"
    let path_str = id.replace("-", "/") + ".sudo.md";
    let spec_path = specs_dir.join(&path_str);
    
    if !spec_path.exists() {
        return Err(StatusCode::NOT_FOUND);
    }
    
    let content = std::fs::read_to_string(&spec_path)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    // Parse frontmatter using gray_matter
    let matter = gray_matter::Matter::<gray_matter::engine::YAML>::new();
    let parsed = matter.parse(&content);
    
    // Convert frontmatter Pod to serde_json::Value
    let frontmatter = parsed.data
        .map(|d| pod_to_json(&d))
        .unwrap_or(serde_json::Value::Null);
    
    // Try to load generated JSON for machine config
    let generated_path = project_root()
        .join("generated")
        .join(format!("{}.json", id.split('-').last().unwrap_or(&id)));
    
    let machine = std::fs::read_to_string(&generated_path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok());
    
    let name = spec_path.file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("unknown")
        .replace(".sudo", "");
    
    Ok(Json(SpecResponse {
        id,
        name,
        content: parsed.content,
        frontmatter,
        machine,
    }))
}
