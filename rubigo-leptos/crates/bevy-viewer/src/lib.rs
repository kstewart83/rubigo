//! Bevy Viewer - Reusable 3D Viewer Library
//!
//! Provides embeddable 3D visualization capabilities using Bevy.
//! Designed to be compiled into the main ui-app.

pub mod camera;
pub mod geo;
pub mod viewers;

use bevy::prelude::*;

/// Main plugin that sets up the viewer infrastructure
pub struct BevyViewerPlugin;

impl Plugin for BevyViewerPlugin {
    fn build(&self, app: &mut App) {
        app.add_plugins(camera::CameraControlPlugin);

        #[cfg(feature = "globe")]
        app.add_plugins(viewers::globe::GlobePlugin);
    }
}

/// Initialize the viewer with default settings
/// Call this from the main app to set up the viewer
pub fn configure_viewer_plugins() -> impl PluginGroup {
    DefaultPlugins
        .set(WindowPlugin {
            primary_window: Some(Window {
                title: "3D Viewer".into(),
                canvas: Some("#viewer-canvas".into()),
                fit_canvas_to_parent: true,
                prevent_default_event_handling: true,
                ..default()
            }),
            ..default()
        })
        .set(bevy::asset::AssetPlugin {
            file_path: "/assets".into(),
            ..default()
        })
}

/// Re-export commonly used types
pub use camera::CameraController;
