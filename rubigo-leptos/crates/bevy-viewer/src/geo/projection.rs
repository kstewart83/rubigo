//! Spherical projection utilities
//!
//! Converts latitude/longitude coordinates to 3D Cartesian coordinates
//! on a sphere surface.

use bevy::prelude::*;

/// Project latitude/longitude to 3D Cartesian coordinates on a sphere.
///
/// # Arguments
/// * `lat` - Latitude in degrees (-90 to 90)
/// * `lon` - Longitude in degrees (-180 to 180)
/// * `radius` - Sphere radius
///
/// # Returns
/// A Vec3 representing the 3D position on the sphere surface.
pub fn lat_lon_to_xyz(lat: f64, lon: f64, radius: f32) -> Vec3 {
    // Convert to radians
    let lat_rad = (lat as f32).to_radians();
    let lon_rad = (lon as f32).to_radians();

    // Spherical to Cartesian conversion
    // Note: We use Y-up coordinate system (Bevy default)
    // Latitude maps to Y (north/south)
    // Longitude maps to X-Z plane (east/west)
    let x = radius * lat_rad.cos() * lon_rad.sin();
    let y = radius * lat_rad.sin();
    let z = radius * lat_rad.cos() * lon_rad.cos();

    Vec3::new(x, y, z)
}

/// Project latitude/longitude to 3D with a slight offset from the surface.
/// Useful for rendering lines above the sphere to prevent z-fighting.
///
/// # Arguments
/// * `lat` - Latitude in degrees
/// * `lon` - Longitude in degrees
/// * `radius` - Base sphere radius
/// * `offset` - Additional offset above the surface (e.g., 0.002 for 0.2%)
pub fn lat_lon_to_xyz_offset(lat: f64, lon: f64, radius: f32, offset: f32) -> Vec3 {
    lat_lon_to_xyz(lat, lon, radius * (1.0 + offset))
}

/// Convert a series of GeoJSON coordinates to 3D positions.
///
/// GeoJSON coordinates are [longitude, latitude] (note the order!).
pub fn coords_to_xyz(coords: &[[f64; 2]], radius: f32, offset: f32) -> Vec<Vec3> {
    coords
        .iter()
        .map(|coord| {
            let lon = coord[0];
            let lat = coord[1];
            lat_lon_to_xyz_offset(lat, lon, radius, offset)
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_north_pole() {
        let pos = lat_lon_to_xyz(90.0, 0.0, 1.0);
        assert!((pos.y - 1.0).abs() < 0.001);
        assert!(pos.x.abs() < 0.001);
        assert!(pos.z.abs() < 0.001);
    }

    #[test]
    fn test_equator_prime_meridian() {
        let pos = lat_lon_to_xyz(0.0, 0.0, 1.0);
        assert!((pos.z - 1.0).abs() < 0.001);
        assert!(pos.x.abs() < 0.001);
        assert!(pos.y.abs() < 0.001);
    }

    #[test]
    fn test_equator_90e() {
        let pos = lat_lon_to_xyz(0.0, 90.0, 1.0);
        assert!((pos.x - 1.0).abs() < 0.001);
        assert!(pos.y.abs() < 0.001);
        assert!(pos.z.abs() < 0.001);
    }
}
