//! GeoJSON-based projection module for map visualization
//!
//! Provides D3-style projection functions:
//! - Equirectangular: Flat 2D map view
//! - Orthographic: 3D globe view

use std::f64::consts::PI;

/// A point projected to screen coordinates
pub struct ProjectedPoint {
    pub x: f64,
    pub y: f64,
    pub visible: bool,
}

/// Projection trait - converts lon/lat to screen coordinates
#[allow(dead_code)]
pub trait Projection {
    fn project(&self, lon: f64, lat: f64) -> ProjectedPoint;
    fn set_center(&mut self, lon: f64, lat: f64);
    fn set_scale(&mut self, scale: f64);
    fn set_translate(&mut self, x: f64, y: f64);
}

/// Equirectangular projection - simple linear mapping for flat map view
///
/// Longitude maps directly to X, latitude maps directly to Y.
/// Good for: 2D map views, simple visualization
pub struct Equirectangular {
    center_lon: f64,
    center_lat: f64,
    scale: f64,
    translate_x: f64,
    translate_y: f64,
}

impl Equirectangular {
    pub fn new() -> Self {
        Self {
            center_lon: 0.0,
            center_lat: 0.0,
            scale: 1.0,
            translate_x: 0.0,
            translate_y: 0.0,
        }
    }

    pub fn fit_size(mut self, width: f64, height: f64) -> Self {
        // Scale to fit world (-180 to 180 lon, -90 to 90 lat) in the viewport
        self.scale = (width / 360.0).min(height / 180.0);
        self.translate_x = width / 2.0;
        self.translate_y = height / 2.0;
        self
    }
}

impl Default for Equirectangular {
    fn default() -> Self {
        Self::new()
    }
}

impl Projection for Equirectangular {
    fn project(&self, lon: f64, lat: f64) -> ProjectedPoint {
        // Simple linear projection
        let x = (lon - self.center_lon) * self.scale + self.translate_x;
        let y = (self.center_lat - lat) * self.scale + self.translate_y; // Y is inverted

        ProjectedPoint {
            x,
            y,
            visible: true, // All points visible in equirectangular
        }
    }

    fn set_center(&mut self, lon: f64, lat: f64) {
        self.center_lon = lon;
        self.center_lat = lat;
    }

    fn set_scale(&mut self, scale: f64) {
        self.scale = scale;
    }

    fn set_translate(&mut self, x: f64, y: f64) {
        self.translate_x = x;
        self.translate_y = y;
    }
}

/// Orthographic projection - 3D globe view
///
/// Projects the sphere as seen from infinite distance (orthographic).
/// Points on the back of the globe are not visible.
/// Good for: Globe visualization, "view from space" effect
pub struct Orthographic {
    center_lon: f64,
    center_lat: f64,
    scale: f64, // Radius of the globe in pixels
    translate_x: f64,
    translate_y: f64,
}

impl Orthographic {
    pub fn new() -> Self {
        Self {
            center_lon: 0.0,
            center_lat: 0.0,
            scale: 100.0,
            translate_x: 0.0,
            translate_y: 0.0,
        }
    }

    pub fn fit_size(mut self, width: f64, height: f64) -> Self {
        // Scale to fit globe in viewport (radius = min dimension / 2)
        self.scale = width.min(height) / 2.0 * 0.9; // 90% to leave margin
        self.translate_x = width / 2.0;
        self.translate_y = height / 2.0;
        self
    }

    pub fn center(mut self, lon: f64, lat: f64) -> Self {
        self.center_lon = lon;
        self.center_lat = lat;
        self
    }
}

impl Default for Orthographic {
    fn default() -> Self {
        Self::new()
    }
}

impl Projection for Orthographic {
    fn project(&self, lon: f64, lat: f64) -> ProjectedPoint {
        let deg_to_rad = PI / 180.0;

        // Convert to radians
        let lambda = (lon - self.center_lon) * deg_to_rad;
        let phi = lat * deg_to_rad;
        let phi0 = self.center_lat * deg_to_rad;

        // Cosine of angular distance from center (determines visibility)
        let cos_c = phi0.sin() * phi.sin() + phi0.cos() * phi.cos() * lambda.cos();

        // Point is on back of globe (not visible)
        if cos_c < 0.0 {
            return ProjectedPoint {
                x: 0.0,
                y: 0.0,
                visible: false,
            };
        }

        // Orthographic projection formulas
        // Note: Y is negated to put north at the top (SVG Y increases downward)
        let x = self.scale * phi.cos() * lambda.sin() + self.translate_x;
        let y = -self.scale * (phi0.cos() * phi.sin() - phi0.sin() * phi.cos() * lambda.cos())
            + self.translate_y;

        ProjectedPoint {
            x,
            y,
            visible: true,
        }
    }

    fn set_center(&mut self, lon: f64, lat: f64) {
        self.center_lon = lon;
        self.center_lat = lat;
    }

    fn set_scale(&mut self, scale: f64) {
        self.scale = scale;
    }

    fn set_translate(&mut self, x: f64, y: f64) {
        self.translate_x = x;
        self.translate_y = y;
    }
}

/// Generate an SVG path string from a GeoJSON geometry
pub fn geometry_to_path(geometry: &serde_json::Value, projection: &dyn Projection) -> String {
    match geometry.get("type").and_then(|v| v.as_str()) {
        Some("Polygon") => {
            if let Some(coords) = geometry.get("coordinates").and_then(|v| v.as_array()) {
                coords
                    .iter()
                    .filter_map(|ring| ring.as_array())
                    .map(|ring| ring_to_path(ring, projection))
                    .collect::<Vec<_>>()
                    .join(" ")
            } else {
                String::new()
            }
        }
        Some("MultiPolygon") => {
            if let Some(polys) = geometry.get("coordinates").and_then(|v| v.as_array()) {
                polys
                    .iter()
                    .filter_map(|poly| poly.as_array())
                    .flat_map(|rings| rings.iter().filter_map(|ring| ring.as_array()))
                    .map(|ring| ring_to_path(ring, projection))
                    .collect::<Vec<_>>()
                    .join(" ")
            } else {
                String::new()
            }
        }
        Some("LineString") => {
            if let Some(coords) = geometry.get("coordinates").and_then(|v| v.as_array()) {
                ring_to_path(coords, projection)
            } else {
                String::new()
            }
        }
        _ => String::new(),
    }
}

/// Convert a ring (array of [lon, lat] coordinates) to SVG path commands
fn ring_to_path(ring: &[serde_json::Value], projection: &dyn Projection) -> String {
    let mut path = String::new();
    let mut first = true;
    let mut last_visible = false;

    for point in ring {
        if let Some(coords) = point.as_array() {
            if coords.len() >= 2 {
                let lon = coords[0].as_f64().unwrap_or(0.0);
                let lat = coords[1].as_f64().unwrap_or(0.0);

                let projected = projection.project(lon, lat);

                if projected.visible {
                    if first || !last_visible {
                        path.push_str(&format!("M{:.1},{:.1}", projected.x, projected.y));
                        first = false;
                    } else {
                        path.push_str(&format!("L{:.1},{:.1}", projected.x, projected.y));
                    }
                    last_visible = true;
                } else {
                    last_visible = false;
                }
            }
        }
    }

    // Close the path if we have content
    if !path.is_empty() && path.contains('L') {
        path.push('Z');
    }

    path
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_equirectangular_center() {
        let proj = Equirectangular::new().fit_size(360.0, 180.0);

        // Center of the world should map to center of screen
        let p = proj.project(0.0, 0.0);
        assert!((p.x - 180.0).abs() < 0.1);
        assert!((p.y - 90.0).abs() < 0.1);
        assert!(p.visible);
    }

    #[test]
    fn test_orthographic_visibility() {
        let proj = Orthographic::new().center(0.0, 0.0).fit_size(400.0, 400.0);

        // Point at center should be visible
        let p = proj.project(0.0, 0.0);
        assert!(p.visible);

        // Point on back of globe should not be visible
        let p_back = proj.project(180.0, 0.0);
        assert!(!p_back.visible);
    }

    #[test]
    fn test_orthographic_us_centered() {
        let proj = Orthographic::new()
            .center(-95.0, 40.0) // Center on US
            .fit_size(400.0, 400.0);

        // US points should be visible
        let nyc = proj.project(-74.0, 40.7);
        assert!(nyc.visible);

        let la = proj.project(-118.2, 34.0);
        assert!(la.visible);

        // China should not be visible
        let beijing = proj.project(116.4, 39.9);
        assert!(!beijing.visible);
    }
}
