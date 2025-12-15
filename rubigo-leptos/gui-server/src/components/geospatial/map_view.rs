use crate::components::geospatial::projections::{geometry_to_path, Equirectangular, Projection};
use crate::Region;
use leptos::prelude::*;
use nexosim_hybrid::database::geo::GeoFeature;

#[component]
pub fn MapView(
    features: Vec<GeoFeature>,
    #[prop(default = vec![])] regions: Vec<Region>,
    #[prop(default = None)] center: Option<(f64, f64)>,
    #[prop(default = vec![])] cached_country_paths: Vec<String>,
    #[prop(default = vec![])] cached_state_paths: Vec<String>,
) -> impl IntoView {
    // Calculate viewport based on center
    let (width, height) = (800.0, 400.0);

    // Use cached paths for world view, compute for zoomed views
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
            // Compute paths (for zoomed views or if cache not ready)
            let proj = if let Some((lon, lat)) = center {
                let mut p = Equirectangular::new();
                p.set_center(lon, lat);
                p.set_scale(width / 40.0);
                p.set_translate(width / 2.0, height / 2.0);
                p
            } else {
                Equirectangular::new().fit_size(width, height)
            };

            let country_view = features
                .iter()
                .filter(|f| f.feature_type == "country")
                .map(|f| {
                    let d = geometry_to_path(&f.geometry, &proj);
                    view! {
                        <path d=d fill="#3a4a3a" stroke="#6b7280" stroke-width="0.8"/>
                    }
                })
                .collect_view();

            let state_view = features
                .iter()
                .filter(|f| f.feature_type == "state")
                .map(|f| {
                    let d = geometry_to_path(&f.geometry, &proj);
                    view! {
                        <path d=d fill="#3a4a3a" stroke="#4a5568" stroke-width="0.4"/>
                    }
                })
                .collect_view();

            (country_view, state_view)
        };

    // Generate markers for regions (always compute - small dataset)
    let proj = Equirectangular::new().fit_size(width, height);
    let markers = regions
        .iter()
        .map(|r| {
            let (lon, lat) = r.location;
            let projected = proj.project(lon, lat);
            let region_id = r.id.as_ref().map(|t| t.to_string()).unwrap_or_default();
            let href = format!("/?tab=sites&region_id={}", region_id);
            let name = r.name.clone();

            view! {
                <a href=href>
                    <circle
                        cx=format!("{:.1}", projected.x)
                        cy=format!("{:.1}", projected.y)
                        r="6"
                        fill="var(--color-primary)"
                        stroke="var(--color-white)"
                        stroke-width="1.5"
                        style="cursor: pointer; transition: r 0.2s ease-out;"
                    >
                        <title>{name}</title>
                    </circle>
                </a>
            }
        })
        .collect_view();

    view! {
        <div class="map-view">
            <svg
                viewBox=format!("0 0 {} {}", width as u32, height as u32)
                preserveAspectRatio="xMidYMid meet"
                style="background: #0a1929; border-radius: var(--radius-lg); width: 100%; height: auto;"
            >
                {country_paths_view}
                {state_paths_view}
                {markers}
            </svg>
        </div>
    }
}
