//! Feature rendering
//!
//! Generates Bevy meshes from parsed geographic features.

use bevy::asset::RenderAssetUsages;
use bevy::prelude::*;
use bevy::render::render_resource::PrimitiveTopology;

use super::parser::{GeoFeature, GeoGeometry};
use super::projection::coords_to_xyz;

/// Configuration for feature rendering
#[derive(Clone)]
pub struct FeatureRenderConfig {
    /// Sphere radius
    pub radius: f32,
    /// Offset from sphere surface (prevents z-fighting)
    pub offset: f32,
    /// Color for the feature
    pub color: Color,
}

impl Default for FeatureRenderConfig {
    fn default() -> Self {
        Self {
            radius: 1.0,
            offset: 0.002,
            color: Color::WHITE,
        }
    }
}

/// Generate a line mesh from a series of 3D positions.
/// Uses LineStrip topology for connected lines.
pub fn create_line_mesh(positions: Vec<Vec3>) -> Mesh {
    let mut mesh = Mesh::new(PrimitiveTopology::LineStrip, RenderAssetUsages::default());

    // Create normals pointing outward (normalized positions for a unit sphere)
    let normals: Vec<[f32; 3]> = positions.iter().map(|p| p.normalize().to_array()).collect();

    let positions: Vec<[f32; 3]> = positions.iter().map(|p| p.to_array()).collect();

    mesh.insert_attribute(Mesh::ATTRIBUTE_POSITION, positions);
    mesh.insert_attribute(Mesh::ATTRIBUTE_NORMAL, normals);

    mesh
}

/// Generate a filled polygon mesh using triangulation.
/// Triangulates the 2D coordinates and projects to 3D sphere.
pub fn create_filled_polygon_mesh(
    exterior: &[[f64; 2]],
    holes: &[Vec<[f64; 2]>],
    radius: f32,
    offset: f32,
) -> Option<Mesh> {
    if exterior.len() < 3 {
        return None;
    }

    // Try triangulation with holes first, fall back to exterior-only
    let (triangles, all_coords) = match triangulate_polygon(exterior, holes) {
        Some(result) => result,
        None => {
            // Fallback: try without holes
            match triangulate_polygon(exterior, &[]) {
                Some(result) => result,
                None => return None,
            }
        }
    };

    if triangles.is_empty() {
        return None;
    }

    // Convert triangulated indices to 3D positions
    let mut positions: Vec<[f32; 3]> = Vec::new();
    let mut normals: Vec<[f32; 3]> = Vec::new();

    for &idx in &triangles {
        if idx < all_coords.len() {
            let coord = all_coords[idx];
            let pos = super::projection::lat_lon_to_xyz_offset(coord[1], coord[0], radius, offset);
            let normal = pos.normalize();
            positions.push(pos.to_array());
            normals.push(normal.to_array());
        }
    }

    if positions.is_empty() {
        return None;
    }

    let mut mesh = Mesh::new(
        PrimitiveTopology::TriangleList,
        RenderAssetUsages::default(),
    );
    mesh.insert_attribute(Mesh::ATTRIBUTE_POSITION, positions);
    mesh.insert_attribute(Mesh::ATTRIBUTE_NORMAL, normals);

    Some(mesh)
}

/// Helper function to triangulate a polygon
fn triangulate_polygon(
    exterior: &[[f64; 2]],
    holes: &[Vec<[f64; 2]>],
) -> Option<(Vec<usize>, Vec<[f64; 2]>)> {
    // Flatten coordinates for earcutr (expects [x, y, x, y, ...])
    let mut flat_coords: Vec<f64> = Vec::new();
    let mut hole_indices: Vec<usize> = Vec::new();

    // Add exterior ring
    for coord in exterior {
        flat_coords.push(coord[0]); // lon
        flat_coords.push(coord[1]); // lat
    }

    // Add holes
    for hole in holes {
        if hole.len() >= 3 {
            hole_indices.push(flat_coords.len() / 2);
            for coord in hole {
                flat_coords.push(coord[0]);
                flat_coords.push(coord[1]);
            }
        }
    }

    // Triangulate using earcutr
    let triangles = earcutr::earcut(&flat_coords, &hole_indices, 2).ok()?;

    if triangles.is_empty() {
        return None;
    }

    // Collect all 2D vertices
    let mut all_coords: Vec<[f64; 2]> = exterior.to_vec();
    for hole in holes {
        if hole.len() >= 3 {
            all_coords.extend(hole.iter().cloned());
        }
    }

    Some((triangles, all_coords))
}

/// Generate filled polygon meshes from a GeoFeature.
pub fn feature_to_filled_meshes(feature: &GeoFeature, config: &FeatureRenderConfig) -> Vec<Mesh> {
    match &feature.geometry {
        GeoGeometry::Polygon { exterior, holes } => {
            if let Some(mesh) =
                create_filled_polygon_mesh(exterior, holes, config.radius, config.offset)
            {
                vec![mesh]
            } else {
                vec![]
            }
        }

        GeoGeometry::MultiPolygon(polygons) => polygons
            .iter()
            .filter_map(|(exterior, holes)| {
                create_filled_polygon_mesh(exterior, holes, config.radius, config.offset)
            })
            .collect(),

        _ => vec![], // Only polygons can be filled
    }
}

/// Generate line meshes from a GeoFeature.
/// Returns multiple meshes for MultiLineString/MultiPolygon features.
pub fn feature_to_line_meshes(feature: &GeoFeature, config: &FeatureRenderConfig) -> Vec<Mesh> {
    match &feature.geometry {
        GeoGeometry::LineString(coords) => {
            let positions = coords_to_xyz_from_slice(coords, config.radius, config.offset);
            if positions.len() >= 2 {
                vec![create_line_mesh(positions)]
            } else {
                vec![]
            }
        }

        GeoGeometry::MultiLineString(lines) => lines
            .iter()
            .filter_map(|coords| {
                let positions = coords_to_xyz_from_slice(coords, config.radius, config.offset);
                if positions.len() >= 2 {
                    Some(create_line_mesh(positions))
                } else {
                    None
                }
            })
            .collect(),

        GeoGeometry::Polygon { exterior, holes: _ } => {
            // For polygons, render just the exterior ring as a line
            let positions = coords_to_xyz_from_slice(exterior, config.radius, config.offset);
            if positions.len() >= 2 {
                vec![create_line_mesh(positions)]
            } else {
                vec![]
            }
        }

        GeoGeometry::MultiPolygon(polygons) => polygons
            .iter()
            .filter_map(|(exterior, _holes)| {
                let positions = coords_to_xyz_from_slice(exterior, config.radius, config.offset);
                if positions.len() >= 2 {
                    Some(create_line_mesh(positions))
                } else {
                    None
                }
            })
            .collect(),

        GeoGeometry::Point(_) => vec![], // Points not rendered as lines
    }
}

/// Helper to convert slice of coordinates to Vec3
fn coords_to_xyz_from_slice(coords: &[[f64; 2]], radius: f32, offset: f32) -> Vec<Vec3> {
    coords_to_xyz(coords, radius, offset)
}

/// Spawn line entities for a collection of features
pub fn spawn_feature_lines(
    commands: &mut Commands,
    meshes: &mut Assets<Mesh>,
    materials: &mut Assets<StandardMaterial>,
    features: &[GeoFeature],
    config: &FeatureRenderConfig,
) -> Vec<Entity> {
    let material = materials.add(StandardMaterial {
        base_color: config.color,
        unlit: true, // Lines should be unlit for consistent color
        ..default()
    });

    let mut entities = Vec::new();

    for feature in features {
        let line_meshes = feature_to_line_meshes(feature, config);
        for mesh in line_meshes {
            let entity = commands
                .spawn((Mesh3d(meshes.add(mesh)), MeshMaterial3d(material.clone())))
                .id();
            entities.push(entity);
        }
    }

    entities
}

/// Spawn filled polygon entities for a collection of features
pub fn spawn_feature_polygons(
    commands: &mut Commands,
    meshes: &mut Assets<Mesh>,
    materials: &mut Assets<StandardMaterial>,
    features: &[GeoFeature],
    config: &FeatureRenderConfig,
) -> Vec<Entity> {
    let material = materials.add(StandardMaterial {
        base_color: config.color,
        perceptual_roughness: 0.8,
        metallic: 0.0,
        double_sided: true,
        cull_mode: None, // Render both sides
        ..default()
    });

    let mut entities = Vec::new();

    for feature in features {
        let polygon_meshes = feature_to_filled_meshes(feature, config);
        for mesh in polygon_meshes {
            let entity = commands
                .spawn((Mesh3d(meshes.add(mesh)), MeshMaterial3d(material.clone())))
                .id();
            entities.push(entity);
        }
    }

    entities
}

/// Marker component for geographic feature entities
#[derive(Component)]
pub struct GeoFeatureEntity {
    pub feature_type: super::parser::FeatureType,
}
