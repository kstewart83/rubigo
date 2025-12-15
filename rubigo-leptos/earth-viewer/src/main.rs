//! Earth Viewer - Interactive 3D Globe using Bevy
//!
//! This module provides an interactive 3D Earth visualization
//! that can be embedded in a web page via WebAssembly.

use bevy::input::mouse::{MouseMotion, MouseWheel};
use bevy::prelude::*;
use std::f32::consts::PI;

#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

/// Plugin for the Earth viewer functionality
pub struct EarthViewerPlugin;

impl Plugin for EarthViewerPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<CameraController>()
            .add_systems(Startup, setup_scene)
            .add_systems(
                Update,
                (
                    orbit_camera_mouse,
                    orbit_camera_touch,
                    zoom_camera,
                    auto_rotate,
                ),
            );
    }
}

/// Camera controller state for orbit controls
#[derive(Resource)]
pub struct CameraController {
    /// Distance from the target (zoom level)
    pub radius: f32,
    /// Horizontal rotation angle (around Y axis)
    pub theta: f32,
    /// Vertical rotation angle (polar angle)
    pub phi: f32,
    /// Target point to orbit around
    pub target: Vec3,
    /// Whether the mouse/touch is currently dragging
    pub dragging: bool,
    /// Auto-rotation speed (radians per second, 0 to disable)
    pub auto_rotate_speed: f32,
    /// Sensitivity for mouse/touch input
    pub sensitivity: f32,
    /// Zoom sensitivity
    pub zoom_sensitivity: f32,
}

impl Default for CameraController {
    fn default() -> Self {
        Self {
            radius: 3.0,
            theta: PI * 0.25, // Start with US-ish view
            phi: PI * 0.4,
            target: Vec3::ZERO,
            dragging: false,
            auto_rotate_speed: 0.05, // Slow auto-rotation
            sensitivity: 0.005,
            zoom_sensitivity: 0.2,
        }
    }
}

/// Marker component for the Earth model
#[derive(Component)]
pub struct EarthModel;

/// Setup the 3D scene with lighting and Earth model
fn setup_scene(mut commands: Commands, asset_server: Res<AssetServer>) {
    // Load the GLB model
    commands.spawn((
        SceneRoot(asset_server.load("geo/geoviz_earth.glb#Scene0")),
        EarthModel,
    ));

    // Camera with orbit controller and dark space background
    commands.spawn((
        Camera3d::default(),
        Transform::from_xyz(2.5, 1.5, 2.5).looking_at(Vec3::ZERO, Vec3::Y),
    ));

    // Set clear color to dark space blue (matches the container background)
    commands.insert_resource(ClearColor(Color::srgb(0.03, 0.06, 0.10)));

    // Ambient light for overall illumination
    commands.spawn((AmbientLight {
        color: Color::srgb(0.4, 0.45, 0.5),
        brightness: 200.0,
        affects_lightmapped_meshes: false,
    },));

    // Key directional light (sun)
    commands.spawn((
        DirectionalLight {
            color: Color::srgb(1.0, 0.98, 0.95),
            illuminance: 8000.0,
            shadows_enabled: false,
            ..default()
        },
        Transform::from_rotation(Quat::from_euler(EulerRot::XYZ, -PI * 0.3, PI * 0.25, 0.0)),
    ));

    // Fill light from the other side
    commands.spawn((
        DirectionalLight {
            color: Color::srgb(0.6, 0.7, 0.9),
            illuminance: 2000.0,
            shadows_enabled: false,
            ..default()
        },
        Transform::from_rotation(Quat::from_euler(EulerRot::XYZ, -PI * 0.2, -PI * 0.6, 0.0)),
    ));
}

/// Handle mouse-based orbit controls
fn orbit_camera_mouse(
    mouse_button: Res<ButtonInput<MouseButton>>,
    mut mouse_motion: MessageReader<MouseMotion>,
    mut controller: ResMut<CameraController>,
    mut camera_query: Query<&mut Transform, With<Camera3d>>,
) {
    // Update dragging state
    controller.dragging = mouse_button.pressed(MouseButton::Left);

    if controller.dragging {
        for event in mouse_motion.read() {
            controller.theta -= event.delta.x * controller.sensitivity;
            controller.phi -= event.delta.y * controller.sensitivity;

            // Clamp phi to avoid flipping
            controller.phi = controller.phi.clamp(0.1, PI - 0.1);
        }
    } else {
        // Clear any pending events when not dragging
        mouse_motion.clear();
    }

    // Update camera position
    update_camera_position(&controller, &mut camera_query);
}

/// Handle touch-based orbit controls (for mobile)
fn orbit_camera_touch(
    touches: Res<Touches>,
    mut controller: ResMut<CameraController>,
    mut camera_query: Query<&mut Transform, With<Camera3d>>,
) {
    // Single finger drag for rotation
    if let Some(touch) = touches.iter().next() {
        if touches.just_pressed(touch.id()) {
            controller.dragging = true;
        }

        if controller.dragging {
            let delta = touch.delta();
            controller.theta -= delta.x * controller.sensitivity * 0.5;
            controller.phi -= delta.y * controller.sensitivity * 0.5;
            controller.phi = controller.phi.clamp(0.1, PI - 0.1);
        }
    }

    if touches.iter().count() == 0 {
        controller.dragging = false;
    }

    // Pinch to zoom (two fingers)
    if touches.iter().count() == 2 {
        let touch_positions: Vec<_> = touches.iter().map(|t| t.position()).collect();
        let current_distance = touch_positions[0].distance(touch_positions[1]);

        // Store previous distance and calculate zoom (simplified)
        // In a full implementation, we'd track the previous frame's distance
        let zoom_factor = 0.01;
        controller.radius += (200.0 - current_distance) * zoom_factor * 0.001;
        controller.radius = controller.radius.clamp(1.5, 8.0);
    }

    update_camera_position(&controller, &mut camera_query);
}

/// Handle scroll wheel zoom
fn zoom_camera(
    mut scroll_events: MessageReader<MouseWheel>,
    mut controller: ResMut<CameraController>,
    mut camera_query: Query<&mut Transform, With<Camera3d>>,
) {
    for event in scroll_events.read() {
        controller.radius -= event.y * controller.zoom_sensitivity;
        controller.radius = controller.radius.clamp(1.5, 8.0);
    }

    update_camera_position(&controller, &mut camera_query);
}

/// Auto-rotate the camera when not interacting
fn auto_rotate(
    time: Res<Time>,
    mut controller: ResMut<CameraController>,
    mut camera_query: Query<&mut Transform, With<Camera3d>>,
) {
    if !controller.dragging && controller.auto_rotate_speed > 0.0 {
        controller.theta += controller.auto_rotate_speed * time.delta_secs();
        update_camera_position(&controller, &mut camera_query);
    }
}

/// Update camera transform based on spherical coordinates
fn update_camera_position(
    controller: &CameraController,
    camera_query: &mut Query<&mut Transform, With<Camera3d>>,
) {
    if let Ok(mut transform) = camera_query.single_mut() {
        // Convert spherical to cartesian coordinates
        let x = controller.radius * controller.phi.sin() * controller.theta.cos();
        let y = controller.radius * controller.phi.cos();
        let z = controller.radius * controller.phi.sin() * controller.theta.sin();

        transform.translation = controller.target + Vec3::new(x, y, z);
        transform.look_at(controller.target, Vec3::Y);
    }
}

/// WASM entry point
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen(start)]
pub fn wasm_main() {
    console_error_panic_hook::set_once();
    main();
}

/// Main entry point
fn main() {
    let mut app = App::new();

    // Configure window for web embedding
    app.add_plugins(
        DefaultPlugins
            .set(WindowPlugin {
                primary_window: Some(Window {
                    title: "Earth Viewer".into(),
                    canvas: Some("#earth-canvas".into()),
                    fit_canvas_to_parent: true,
                    prevent_default_event_handling: true,
                    ..default()
                }),
                ..default()
            })
            .set(bevy::asset::AssetPlugin {
                // Assets are served from /assets/ path on the web server
                // Use absolute path for WASM to correctly construct fetch URLs
                file_path: "/assets".into(),
                ..default()
            }),
    );

    app.add_plugins(EarthViewerPlugin);

    app.run();
}
