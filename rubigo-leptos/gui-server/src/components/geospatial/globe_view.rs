use crate::components::geospatial::projections::{geometry_to_path, Orthographic, Projection};
use crate::Region;
use leptos::prelude::*;
use nexosim_hybrid::database::geo::GeoFeature;

#[component]
pub fn GlobeView(
    features: Vec<GeoFeature>,
    #[prop(default = vec![])] regions: Vec<Region>,
    #[prop(default = None)] center: Option<(f64, f64)>,
    #[prop(default = vec![])] cached_country_paths: Vec<String>,
    #[prop(default = vec![])] cached_state_paths: Vec<String>,
) -> impl IntoView {
    let size = 400.0;

    // Center globe on specified location or default to US
    let (center_lon, center_lat) = center.unwrap_or((-95.0, 35.0));

    // Use cached paths for default view, compute for custom centers
    let (country_paths_view, state_paths_view) =
        if center.is_none() && !cached_country_paths.is_empty() {
            // Use cached paths (instant)
            let country_view = cached_country_paths
                .iter()
                .map(|d| {
                    view! {
                        <path d=d.clone() fill="#3a4a3a" stroke="#6b7280" stroke-width="0.8"/>
                    }
                })
                .collect_view();

            let state_view = cached_state_paths
                .iter()
                .map(|d| {
                    view! {
                        <path d=d.clone() fill="#3a4a3a" stroke="#4a5568" stroke-width="0.4"/>
                    }
                })
                .collect_view();

            (country_view, state_view)
        } else {
            // Compute paths dynamically
            let proj = Orthographic::new()
                .center(center_lon, center_lat)
                .fit_size(size, size);

            let country_view = features
                .iter()
                .filter(|f| f.feature_type == "country")
                .filter_map(|f| {
                    let d = geometry_to_path(&f.geometry, &proj);
                    if d.is_empty() {
                        None
                    } else {
                        Some(view! {
                            <path d=d fill="#3a4a3a" stroke="#6b7280" stroke-width="0.8"/>
                        })
                    }
                })
                .collect_view();

            let state_view = features
                .iter()
                .filter(|f| f.feature_type == "state")
                .filter_map(|f| {
                    let d = geometry_to_path(&f.geometry, &proj);
                    if d.is_empty() {
                        None
                    } else {
                        Some(view! {
                            <path d=d fill="#3a4a3a" stroke="#4a5568" stroke-width="0.4"/>
                        })
                    }
                })
                .collect_view();

            (country_view, state_view)
        };

    // Generate markers for regions (always compute - small dataset)
    let proj = Orthographic::new()
        .center(center_lon, center_lat)
        .fit_size(size, size);

    let markers = regions
        .iter()
        .filter_map(|r| {
            let (lon, lat) = r.location;
            let projected = proj.project(lon, lat);

            if !projected.visible {
                return None;
            }

            let region_id = r.id.as_ref().map(|t| t.to_string()).unwrap_or_default();
            let href = format!("/?tab=sites&region_id={}", region_id);
            let name = r.name.clone();

            Some(view! {
                <a href=href>
                    <circle
                        cx=format!("{:.1}", projected.x)
                        cy=format!("{:.1}", projected.y)
                        r="5"
                        fill="var(--color-primary)"
                        stroke="var(--color-white)"
                        stroke-width="1.5"
                        style="cursor: pointer;"
                    >
                        <title>{name}</title>
                    </circle>
                </a>
            })
        })
        .collect_view();

    view! {
        <div class="globe-view">
            <svg
                viewBox=format!("0 0 {} {}", size as u32, size as u32)
                preserveAspectRatio="xMidYMid meet"
                style="background: transparent; border-radius: 50%; width: 100%; max-width: 400px; height: auto;"
            >
                // Gradient definitions for atmosphere effect
                <defs>
                    <radialGradient id="atmosphereGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="85%" stop-color="#1a1f26" stop-opacity="1"/>
                        <stop offset="100%" stop-color="#1a1f26" stop-opacity="0"/>
                    </radialGradient>
                </defs>
                // Atmosphere ring (fades outward)
                <circle
                    cx=format!("{}", size / 2.0)
                    cy=format!("{}", size / 2.0)
                    r=format!("{}", size / 2.0)
                    fill="url(#atmosphereGradient)"
                />
                // Globe ocean background circle
                <circle
                    cx=format!("{}", size / 2.0)
                    cy=format!("{}", size / 2.0)
                    r=format!("{}", size * 0.45)
                    fill="#0d2137"
                />
                // Country paths
                {country_paths_view}
                // US state paths (rendered on top)
                {state_paths_view}
                // Region markers
                {markers}
            </svg>
        </div>
    }
}
