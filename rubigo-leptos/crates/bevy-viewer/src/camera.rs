//! Camera Controls
//!
//! Orbit camera system for 3D visualization.

use bevy::input::mouse::{MouseMotion, MouseWheel};
use bevy::prelude::*;
use std::f32::consts::PI;

/// Plugin for camera controls
pub struct CameraControlPlugin;

impl Plugin for CameraControlPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<CameraController>()
            .add_systems(Update, (orbit_camera_mouse, zoom_camera, auto_rotate));
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
            theta: PI * 0.25,
            phi: PI * 0.4,
            target: Vec3::ZERO,
            dragging: false,
            auto_rotate_speed: 0.05,
            sensitivity: 0.005,
            zoom_sensitivity: 0.01,
        }
    }
}

/// Handle mouse-based orbit controls
fn orbit_camera_mouse(
    mouse_button: Res<ButtonInput<MouseButton>>,
    mut mouse_motion: MessageReader<MouseMotion>,
    mut controller: ResMut<CameraController>,
    mut camera_query: Query<&mut Transform, With<Camera3d>>,
) {
    controller.dragging = mouse_button.pressed(MouseButton::Left);

    if controller.dragging {
        for event in mouse_motion.read() {
            // Horizontal: drag right = globe rotates right
            controller.theta += event.delta.x * controller.sensitivity;
            // Vertical: drag up = camera moves up (inverted)
            controller.phi -= event.delta.y * controller.sensitivity;
            controller.phi = controller.phi.clamp(0.1, PI - 0.1);
        }
    } else {
        mouse_motion.clear();
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
        // Clamp scroll delta to prevent jerky zoom from high-DPI mice
        let delta = event.y.clamp(-3.0, 3.0);
        controller.radius -= delta * controller.zoom_sensitivity;
        controller.radius = controller.radius.clamp(1.3, 8.0);
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
        let x = controller.radius * controller.phi.sin() * controller.theta.cos();
        let y = controller.radius * controller.phi.cos();
        let z = controller.radius * controller.phi.sin() * controller.theta.sin();

        transform.translation = controller.target + Vec3::new(x, y, z);
        transform.look_at(controller.target, Vec3::Y);
    }
}
