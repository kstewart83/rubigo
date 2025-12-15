use crate::components::geospatial::projections::{geometry_to_path, Equirectangular, Orthographic};
use nexosim_hybrid::database::geo::GeoFeature;
use std::sync::Arc;

/// Pre-computed SVG path strings for geo features
#[derive(Clone, Default)]
pub struct CachedGeoPaths {
    /// Country SVG path d-strings for 2D world view
    pub country_paths: Vec<String>,
    /// US state SVG path d-strings for 2D world view  
    pub state_paths: Vec<String>,
    /// Country SVG path d-strings for 3D globe (default US-centered view)
    pub globe_country_paths: Vec<String>,
    /// US state SVG path d-strings for 3D globe (default US-centered view)
    pub globe_state_paths: Vec<String>,
}

impl CachedGeoPaths {
    /// Compute and cache SVG paths from geo features for world view
    pub fn from_features(features: &[GeoFeature]) -> Self {
        // 2D Map projection
        let (width, height) = (800.0, 400.0);
        let map_proj = Equirectangular::new().fit_size(width, height);

        let country_paths: Vec<String> = features
            .iter()
            .filter(|f| f.feature_type == "country")
            .map(|f| geometry_to_path(&f.geometry, &map_proj))
            .collect();

        let state_paths: Vec<String> = features
            .iter()
            .filter(|f| f.feature_type == "state")
            .map(|f| geometry_to_path(&f.geometry, &map_proj))
            .collect();

        // 3D Globe projection (default US-centered view)
        let size = 400.0;
        let globe_proj = Orthographic::new().center(-95.0, 35.0).fit_size(size, size);

        let globe_country_paths: Vec<String> = features
            .iter()
            .filter(|f| f.feature_type == "country")
            .map(|f| geometry_to_path(&f.geometry, &globe_proj))
            .filter(|d| !d.is_empty())
            .collect();

        let globe_state_paths: Vec<String> = features
            .iter()
            .filter(|f| f.feature_type == "state")
            .map(|f| geometry_to_path(&f.geometry, &globe_proj))
            .filter(|d| !d.is_empty())
            .collect();

        tracing::info!(
            "Cached {} map country, {} map state, {} globe country, {} globe state paths",
            country_paths.len(),
            state_paths.len(),
            globe_country_paths.len(),
            globe_state_paths.len()
        );

        Self {
            country_paths,
            state_paths,
            globe_country_paths,
            globe_state_paths,
        }
    }
}

/// Thread-safe wrapper for cached paths
pub type SharedCachedGeoPaths = Arc<tokio::sync::RwLock<CachedGeoPaths>>;

/// Create a new shared cache
pub fn new_shared_cache() -> SharedCachedGeoPaths {
    Arc::new(tokio::sync::RwLock::new(CachedGeoPaths::default()))
}
