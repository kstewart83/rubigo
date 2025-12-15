//! Globe Viewer
//!
//! 3D globe visualization using Blender GLB model.

use bevy::core_pipeline::tonemapping::Tonemapping;
use bevy::prelude::*;

/// Plugin for the globe viewer
pub struct GlobePlugin;

impl Plugin for GlobePlugin {
    fn build(&self, app: &mut App) {
        app.add_systems(Startup, setup_globe_scene);
    }
}

/// Marker component for the globe model
#[derive(Component)]
pub struct GlobeModel;

/// Setup the globe scene with GLB
fn setup_globe_scene(mut commands: Commands, asset_server: Res<AssetServer>) {
    // Load GLB using standard asset path - bevy_embedded_assets should handle this
    let glb_handle: Handle<Scene> = asset_server.load("geo/test_model.glb#Scene0");

    commands.spawn((
        SceneRoot(glb_handle),
        Transform::from_xyz(0.0, 0.0, 0.0),
        GlobeModel,
    ));

    // Camera farther back to see the model
    commands.spawn((
        Camera3d::default(),
        Tonemapping::None,
        Transform::from_xyz(5.0, 3.0, 5.0).looking_at(Vec3::ZERO, Vec3::Y),
    ));

    // Solid magenta background for debugging
    commands.insert_resource(ClearColor(Color::srgb(1.0, 0.0, 1.0)));

    // Brighter ambient light
    commands.spawn((AmbientLight {
        color: Color::WHITE,
        brightness: 500.0,
        ..default()
    },));

    // Directional light
    commands.spawn((
        DirectionalLight {
            color: Color::WHITE,
            illuminance: 20000.0,
            shadows_enabled: false,
            ..default()
        },
        Transform::from_rotation(Quat::from_euler(
            EulerRot::XYZ,
            -std::f32::consts::PI * 0.3,
            std::f32::consts::PI * 0.25,
            0.0,
        )),
    ));
}
