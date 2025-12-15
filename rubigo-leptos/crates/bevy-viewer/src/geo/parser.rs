//! GeoJSON Parser
//!
//! Parses GeoJSON data and extracts geometry for rendering.

use geojson::{Feature, FeatureCollection, GeoJson, Geometry, Value};

/// A parsed geographic feature with its geometry
#[derive(Debug, Clone)]
pub struct GeoFeature {
    /// Feature name (if available)
    pub name: Option<String>,
    /// Feature type (country, state, lake, river, etc.)
    pub feature_type: FeatureType,
    /// Parsed geometry
    pub geometry: GeoGeometry,
}

/// Type of geographic feature
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FeatureType {
    Country,
    State,
    Lake,
    River,
    Coastline,
    Boundary,
    Unknown,
}

/// Parsed geometry types
#[derive(Debug, Clone)]
pub enum GeoGeometry {
    /// A single line string (array of [lon, lat] coordinates)
    LineString(Vec<[f64; 2]>),
    /// Multiple line strings
    MultiLineString(Vec<Vec<[f64; 2]>>),
    /// A polygon (exterior ring + optional holes)
    Polygon {
        exterior: Vec<[f64; 2]>,
        holes: Vec<Vec<[f64; 2]>>,
    },
    /// Multiple polygons
    MultiPolygon(Vec<(Vec<[f64; 2]>, Vec<Vec<[f64; 2]>>)>),
    /// A single point
    Point([f64; 2]),
}

/// Parse a GeoJSON string into a collection of features
pub fn parse_geojson(json: &str, feature_type: FeatureType) -> Result<Vec<GeoFeature>, String> {
    let geojson: GeoJson = json.parse().map_err(|e| format!("Parse error: {}", e))?;

    match geojson {
        GeoJson::FeatureCollection(fc) => parse_feature_collection(fc, feature_type),
        GeoJson::Feature(f) => {
            if let Some(feature) = parse_feature(&f, feature_type) {
                Ok(vec![feature])
            } else {
                Ok(vec![])
            }
        }
        GeoJson::Geometry(g) => {
            if let Some(geom) = parse_geometry(&g) {
                Ok(vec![GeoFeature {
                    name: None,
                    feature_type,
                    geometry: geom,
                }])
            } else {
                Ok(vec![])
            }
        }
    }
}

fn parse_feature_collection(
    fc: FeatureCollection,
    feature_type: FeatureType,
) -> Result<Vec<GeoFeature>, String> {
    let mut features = Vec::new();
    for f in fc.features {
        if let Some(feature) = parse_feature(&f, feature_type) {
            features.push(feature);
        }
    }
    Ok(features)
}

fn parse_feature(feature: &Feature, feature_type: FeatureType) -> Option<GeoFeature> {
    let geometry = feature.geometry.as_ref()?;
    let geo_geom = parse_geometry(geometry)?;

    // Try to extract name from properties
    let name = feature.properties.as_ref().and_then(|props| {
        props
            .get("NAME")
            .or_else(|| props.get("name"))
            .or_else(|| props.get("ADMIN"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())
    });

    Some(GeoFeature {
        name,
        feature_type,
        geometry: geo_geom,
    })
}

fn parse_geometry(geometry: &Geometry) -> Option<GeoGeometry> {
    match &geometry.value {
        Value::Point(coords) => Some(GeoGeometry::Point([coords[0], coords[1]])),

        Value::LineString(coords) => Some(GeoGeometry::LineString(
            coords.iter().map(|c| [c[0], c[1]]).collect(),
        )),

        Value::MultiLineString(lines) => Some(GeoGeometry::MultiLineString(
            lines
                .iter()
                .map(|line| line.iter().map(|c| [c[0], c[1]]).collect())
                .collect(),
        )),

        Value::Polygon(rings) => {
            if rings.is_empty() {
                return None;
            }
            let exterior = rings[0].iter().map(|c| [c[0], c[1]]).collect();
            let holes = rings[1..]
                .iter()
                .map(|ring| ring.iter().map(|c| [c[0], c[1]]).collect())
                .collect();
            Some(GeoGeometry::Polygon { exterior, holes })
        }

        Value::MultiPolygon(polygons) => {
            let parsed: Vec<_> = polygons
                .iter()
                .filter_map(|rings| {
                    if rings.is_empty() {
                        return None;
                    }
                    let exterior = rings[0].iter().map(|c| [c[0], c[1]]).collect();
                    let holes = rings[1..]
                        .iter()
                        .map(|ring| ring.iter().map(|c| [c[0], c[1]]).collect())
                        .collect();
                    Some((exterior, holes))
                })
                .collect();
            Some(GeoGeometry::MultiPolygon(parsed))
        }

        _ => None, // GeometryCollection not handled for simplicity
    }
}
