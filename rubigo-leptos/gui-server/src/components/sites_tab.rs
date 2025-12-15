use crate::components::geospatial::globe_view::GlobeView;
use crate::components::geospatial::map_view::MapView;
use crate::{Region, Site};
use leptos::prelude::*;
use nexosim_hybrid::database::geo::{Building, Device, Floor, GeoFeature, Rack, Space};

/// Geospatial view state based on URL params
#[derive(Clone, PartialEq, Debug)]
#[allow(dead_code)]
pub enum GeoView {
    RegionList,
    RegionDetail(String),
    CreateRegion,
    SiteDetail(String),
    CreateSite(String),
    BuildingDetail(String),
    CreateBuilding(String),
    FloorDetail(String),
    CreateFloor(String),
    SpaceDetail(String),
    CreateSpace(String),
    RackDetail(String),
    CreateRack(String),
    DeviceDetail(String),
    CreateDevice(String),
}

#[component]
pub fn SitesTab(
    regions: Vec<Region>,
    sites: Vec<Site>,
    #[prop(default = vec![])] buildings: Vec<Building>,
    #[prop(default = vec![])] floors: Vec<Floor>,
    #[prop(default = vec![])] spaces: Vec<Space>,
    #[prop(default = vec![])] racks: Vec<Rack>,
    #[prop(default = vec![])] devices: Vec<Device>,
    geo_features: Vec<GeoFeature>,
    #[prop(default = vec![])] cached_country_paths: Vec<String>,
    #[prop(default = vec![])] cached_state_paths: Vec<String>,
    #[prop(default = vec![])] cached_globe_country_paths: Vec<String>,
    #[prop(default = vec![])] cached_globe_state_paths: Vec<String>,
    #[prop(default = GeoView::RegionList)] view: GeoView,
) -> impl IntoView {
    // Determine map center based on current view
    let map_center = match &view {
        GeoView::RegionDetail(id) | GeoView::CreateSite(id) => regions
            .iter()
            .find(|r| r.id.as_ref().map(|t| t.to_string()).unwrap_or_default() == *id)
            .map(|r| r.location),
        GeoView::SiteDetail(id) | GeoView::CreateBuilding(id) => {
            let site = sites
                .iter()
                .find(|s| s.id.as_ref().map(|t| t.to_string()).unwrap_or_default() == *id);
            site.map(|s| s.location)
        }
        _ => None,
    };

    // Count sites per region
    let site_counts: std::collections::HashMap<String, usize> = sites
        .iter()
        .filter_map(|s| s.region_id.as_ref().map(|t| t.to_string()))
        .fold(std::collections::HashMap::new(), |mut acc, rid| {
            *acc.entry(rid).or_insert(0) += 1;
            acc
        });

    // Count buildings per site
    let building_counts: std::collections::HashMap<String, usize> =
        buildings
            .iter()
            .fold(std::collections::HashMap::new(), |mut acc, b| {
                *acc.entry(b.site_id.to_string()).or_insert(0) += 1;
                acc
            });

    view! {
        <div class="sites-container">
            // Map visualizations
            <div class="map-views-container">
                <div class="card">
                    <h3>"2D Map"</h3>
                    <MapView
                        features=geo_features.clone()
                        regions=regions.clone()
                        center=map_center
                        cached_country_paths=cached_country_paths.clone()
                        cached_state_paths=cached_state_paths.clone()
                    />
                </div>
                <div class="card">
                    <h3>"3D Globe"</h3>
                    // Container for Bevy WASM viewer (will be initialized by JavaScript)
                    // Falls back to SVG GlobeView when GPU is unavailable
                    <div id="earth-viewer-container">
                        // Canvas for Bevy WASM to render into (required - Bevy looks for this element)
                        <canvas id="earth-canvas"></canvas>
                        // SVG fallback (shown initially and when CPU mode is detected)
                        <div class="globe-view" id="svg-globe-fallback">
                            <GlobeView
                                features=geo_features.clone()
                                regions=regions.clone()
                                center=map_center
                                cached_country_paths=cached_globe_country_paths.clone()
                                cached_state_paths=cached_globe_state_paths.clone()
                            />
                        </div>
                    </div>
                </div>
            </div>

            // Content based on view
            {match &view {
                GeoView::RegionList => render_region_list(regions.clone(), sites.clone(), site_counts, building_counts.clone()),
                GeoView::RegionDetail(id) => render_region_detail(id.clone(), regions.clone(), sites.clone(), building_counts.clone()),
                GeoView::CreateRegion => render_create_region(),
                GeoView::CreateSite(region_id) => render_create_site(region_id.clone(), regions.clone()),
                GeoView::SiteDetail(id) => render_site_detail(id.clone(), sites.clone(), regions.clone(), buildings.clone(), building_counts),
                GeoView::CreateBuilding(site_id) => render_create_building(site_id.clone(), sites.clone()),
                GeoView::BuildingDetail(id) => render_building_detail(id.clone(), buildings.clone(), sites.clone(), floors.clone()),
                GeoView::CreateFloor(building_id) => render_create_floor(building_id.clone(), buildings.clone()),
                GeoView::FloorDetail(id) => render_floor_detail(id.clone(), floors.clone(), buildings.clone(), spaces.clone()),
                GeoView::CreateSpace(floor_id) => render_create_space(floor_id.clone(), floors.clone()),
                GeoView::SpaceDetail(id) => render_space_detail(id.clone(), spaces.clone(), floors.clone(), racks.clone()),
                GeoView::CreateRack(space_id) => render_create_rack(space_id.clone(), spaces.clone()),
                GeoView::RackDetail(id) => render_rack_detail(id.clone(), racks.clone(), spaces.clone(), devices.clone()),
                GeoView::CreateDevice(rack_id) => render_create_device(rack_id.clone(), racks.clone()),
                GeoView::DeviceDetail(_) => view! { <div class="card"><p>"Device detail coming soon"</p></div> }.into_any(),
            }}
        </div>
    }
}

fn render_region_list(
    regions: Vec<Region>,
    sites: Vec<Site>,
    site_counts: std::collections::HashMap<String, usize>,
    building_counts: std::collections::HashMap<String, usize>,
) -> leptos::tachys::view::any_view::AnyView {
    // Calculate building counts per region (summing through sites)
    let mut region_building_counts: std::collections::HashMap<String, usize> =
        std::collections::HashMap::new();
    for site in &sites {
        if let Some(region_id) = site.region_id.as_ref().map(|t| t.to_string()) {
            let site_id = site.id.as_ref().map(|t| t.to_string()).unwrap_or_default();
            let site_buildings = building_counts.get(&site_id).copied().unwrap_or(0);
            *region_building_counts.entry(region_id).or_insert(0) += site_buildings;
        }
    }

    view! {
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
                <h2 style="margin: 0;">"Regions"</h2>
                <a href="/?tab=sites&view=create_region" class="btn btn-primary">"+ Create Region"</a>
            </div>
            <table class="data-table">
                <thead>
                    <tr><th>"Name"</th><th>"City"</th><th>"Country"</th><th>"Sites"</th><th>"Buildings"</th><th>"Actions"</th></tr>
                </thead>
                <tbody>
                    {regions.iter().map(|r| {
                        let id = r.id.as_ref().map(|t| t.to_string()).unwrap_or_default();
                        let site_count = site_counts.get(&id).copied().unwrap_or(0);
                        let building_count = region_building_counts.get(&id).copied().unwrap_or(0);
                        let href = format!("/?tab=sites&region_id={}", id);
                        view! {
                            <tr>
                                <td><strong>{r.name.clone()}</strong></td>
                                <td>{r.city.clone()}</td>
                                <td>{r.country.clone()}</td>
                                <td><span class="badge">{site_count}</span></td>
                                <td><span class="badge">{building_count}</span></td>
                                <td><a href=href class="btn btn-sm btn-secondary">"View"</a></td>
                            </tr>
                        }
                    }).collect_view()}
                </tbody>
            </table>
            {if regions.is_empty() {
                view! { <p class="text-muted text-center" style="padding: var(--space-6);">"No regions yet."</p> }.into_any()
            } else {
                view! { <div></div> }.into_any()
            }}
        </div>
    }.into_any()
}

fn render_region_detail(
    region_id: String,
    regions: Vec<Region>,
    sites: Vec<Site>,
    building_counts: std::collections::HashMap<String, usize>,
) -> leptos::tachys::view::any_view::AnyView {
    let region = regions
        .iter()
        .find(|r| r.id.as_ref().map(|t| t.to_string()).unwrap_or_default() == region_id)
        .cloned();
    let region_sites: Vec<_> = sites
        .iter()
        .filter(|s| {
            s.region_id
                .as_ref()
                .map(|t| t.to_string())
                .unwrap_or_default()
                == region_id
        })
        .cloned()
        .collect();

    if let Some(r) = region {
        view! {
            <div class="card">
                <nav style="margin-bottom: var(--space-4); font-size: 14px;">
                    <a href="/?tab=sites">"Regions"</a><span class="text-muted">" / "</span><span>{r.name.clone()}</span>
                </nav>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-5);">
                    <div>
                        <h2 style="margin: 0 0 var(--space-2) 0;">{r.name.clone()}</h2>
                        <p class="text-secondary" style="margin: 0;">{r.city.clone()}", "{r.country.clone()}</p>
                    </div>
                    <a href="/?tab=sites" class="btn btn-secondary">"← Back"</a>
                </div>
                <hr style="border: none; border-top: 1px solid var(--border-subtle); margin: var(--space-4) 0;"/>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3);">
                    <h3 style="margin: 0;">"Sites"</h3>
                    <a href={format!("/?tab=sites&view=create_site&region_id={}", region_id)} class="btn btn-primary btn-sm">"+ Add Site"</a>
                </div>
                <table class="data-table">
                    <thead><tr><th>"Name"</th><th>"Status"</th><th>"Buildings"</th><th>"Actions"</th></tr></thead>
                    <tbody>
                        {region_sites.iter().map(|s| {
                            let sid = s.id.as_ref().map(|t| t.to_string()).unwrap_or_default();
                            let bcount = building_counts.get(&sid).copied().unwrap_or(0);
                            view! { <tr><td><strong>{s.name.clone()}</strong></td><td>{s.status.clone()}</td><td><span class="badge">{bcount}</span></td><td><a href={format!("/?tab=sites&site_id={}", sid)} class="btn btn-sm btn-secondary">"View"</a></td></tr> }
                        }).collect_view()}
                    </tbody>
                </table>
                {if region_sites.is_empty() { view! { <p class="text-muted text-center" style="padding: var(--space-4);">"No sites yet."</p> }.into_any() } else { view! { <div></div> }.into_any() }}
            </div>
        }.into_any()
    } else {
        view! { <div class="card"><p class="text-muted">"Region not found."</p><a href="/?tab=sites" class="btn btn-secondary">"← Back"</a></div> }.into_any()
    }
}

fn render_create_region() -> leptos::tachys::view::any_view::AnyView {
    view! {
        <div class="card">
            <nav style="margin-bottom: var(--space-4); font-size: 14px;"><a href="/?tab=sites">"Regions"</a><span class="text-muted">" / Create"</span></nav>
            <h2>"Create Region"</h2>
            <form action="/regions/create" method="post" class="form-stack">
                <div class="form-group"><label for="city-search">"Search City"</label><input type="text" id="city-search" placeholder="Type to search cities..." autocomplete="off"/><div id="city-results" style="margin-top: var(--space-2);"></div></div>
                <div class="form-group"><label for="name">"Region Name"</label><input type="text" id="name" name="name" required placeholder="Custom name for this region"/></div>
                <div class="form-row"><div class="form-group"><label for="city">"City"</label><input type="text" id="city" name="city" readonly/></div><div class="form-group"><label for="country">"Country"</label><input type="text" id="country" name="country" readonly/></div></div>
                <input type="hidden" id="lat" name="lat"/><input type="hidden" id="lon" name="lon"/>
                <div style="display: flex; gap: var(--space-3); margin-top: var(--space-4);"><button type="submit" class="btn btn-primary">"Create Region"</button><a href="/?tab=sites" class="btn btn-secondary">"Cancel"</a></div>
            </form>
            <script>r#"(function(){const s=document.getElementById('city-search'),r=document.getElementById('city-results');let t;s.addEventListener('input',function(){clearTimeout(t);const q=this.value.trim();if(q.length<2){r.innerHTML='';return;}t=setTimeout(()=>{fetch('/api/cities/search?q='+encodeURIComponent(q)).then(x=>x.json()).then(c=>{r.innerHTML=c.slice(0,8).map(x=>`<div class="city-result" style="padding:8px 12px;cursor:pointer;border-radius:6px;background:var(--bg-hover);margin-bottom:4px;" data-name="${x.name}" data-country="${x.country}" data-lat="${x.location[1]}" data-lon="${x.location[0]}">${x.name}, ${x.country}</div>`).join('');r.querySelectorAll('.city-result').forEach(el=>{el.addEventListener('click',function(){document.getElementById('name').value=this.dataset.name;document.getElementById('city').value=this.dataset.name;document.getElementById('country').value=this.dataset.country;document.getElementById('lat').value=this.dataset.lat;document.getElementById('lon').value=this.dataset.lon;r.innerHTML='';s.value=this.dataset.name+', '+this.dataset.country;});});});},300);});})();"#</script>
        </div>
    }.into_any()
}

fn render_create_site(
    region_id: String,
    regions: Vec<Region>,
) -> leptos::tachys::view::any_view::AnyView {
    let region_name = regions
        .iter()
        .find(|r| r.id.as_ref().map(|t| t.to_string()).unwrap_or_default() == region_id)
        .map(|r| r.name.clone())
        .unwrap_or_else(|| "Region".to_string());
    view! {
        <div class="card">
            <nav style="margin-bottom: var(--space-4); font-size: 14px;"><a href="/?tab=sites">"Regions"</a><span class="text-muted">" / "</span><a href={format!("/?tab=sites&region_id={}", region_id)}>{region_name}</a><span class="text-muted">" / Create Site"</span></nav>
            <h2>"Add Site"</h2>
            <form action="/sites/create" method="post" class="form-stack">
                <input type="hidden" name="region_id" value=region_id.clone()/>
                <div class="form-group"><label for="name">"Site Name"</label><input type="text" id="name" name="name" required/></div>
                <div class="form-group"><label for="status">"Status"</label><select id="status" name="status"><option value="active">"Active"</option><option value="planned">"Planned"</option><option value="inactive">"Inactive"</option></select></div>
                <div style="display: flex; gap: var(--space-3); margin-top: var(--space-4);"><button type="submit" class="btn btn-primary">"Create Site"</button><a href={format!("/?tab=sites&region_id={}", region_id)} class="btn btn-secondary">"Cancel"</a></div>
            </form>
        </div>
    }.into_any()
}

fn render_site_detail(
    site_id: String,
    sites: Vec<Site>,
    regions: Vec<Region>,
    buildings: Vec<Building>,
    _building_counts: std::collections::HashMap<String, usize>,
) -> leptos::tachys::view::any_view::AnyView {
    let site = sites
        .iter()
        .find(|s| s.id.as_ref().map(|t| t.to_string()).unwrap_or_default() == site_id)
        .cloned();
    let site_buildings: Vec<_> = buildings
        .iter()
        .filter(|b| b.site_id.to_string() == site_id)
        .cloned()
        .collect();

    if let Some(s) = site {
        let region_id = s
            .region_id
            .as_ref()
            .map(|t| t.to_string())
            .unwrap_or_default();
        let region_name = regions
            .iter()
            .find(|r| r.id.as_ref().map(|t| t.to_string()).unwrap_or_default() == region_id)
            .map(|r| r.name.clone())
            .unwrap_or_else(|| "Region".to_string());
        view! {
            <div class="card">
                <nav style="margin-bottom: var(--space-4); font-size: 14px;"><a href="/?tab=sites">"Regions"</a><span class="text-muted">" / "</span><a href={format!("/?tab=sites&region_id={}", region_id)}>{region_name}</a><span class="text-muted">" / "</span><span>{s.name.clone()}</span></nav>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-5);">
                    <div><h2 style="margin: 0 0 var(--space-2) 0;">{s.name.clone()}</h2><p class="text-secondary" style="margin: 0;">"Status: "{s.status.clone()}</p></div>
                    <a href={format!("/?tab=sites&region_id={}", region_id)} class="btn btn-secondary">"← Back"</a>
                </div>
                <hr style="border: none; border-top: 1px solid var(--border-subtle); margin: var(--space-4) 0;"/>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3);"><h3 style="margin: 0;">"Buildings"</h3><a href={format!("/?tab=sites&view=create_building&site_id={}", site_id)} class="btn btn-primary btn-sm">"+ Add Building"</a></div>
                <table class="data-table"><thead><tr><th>"Name"</th><th>"Floors"</th><th>"Actions"</th></tr></thead><tbody>{site_buildings.iter().map(|b| { let bid = b.id.as_ref().map(|t| t.to_string()).unwrap_or_default(); let floor_count = 0; view! { <tr><td><strong>{b.name.clone()}</strong></td><td><span class="badge">{floor_count}</span></td><td><a href={format!("/?tab=sites&building_id={}", bid)} class="btn btn-sm btn-secondary">"View"</a></td></tr> } }).collect_view()}</tbody></table>
                {if site_buildings.is_empty() { view! { <p class="text-muted text-center" style="padding: var(--space-4);">"No buildings yet."</p> }.into_any() } else { view! { <div></div> }.into_any() }}
            </div>
        }.into_any()
    } else {
        view! { <div class="card"><p class="text-muted">"Site not found."</p><a href="/?tab=sites" class="btn btn-secondary">"← Back"</a></div> }.into_any()
    }
}

fn render_create_building(
    site_id: String,
    sites: Vec<Site>,
) -> leptos::tachys::view::any_view::AnyView {
    let site = sites
        .iter()
        .find(|s| s.id.as_ref().map(|t| t.to_string()).unwrap_or_default() == site_id)
        .cloned();
    let site_name = site
        .as_ref()
        .map(|s| s.name.clone())
        .unwrap_or_else(|| "Site".to_string());
    let _region_id = site
        .as_ref()
        .and_then(|s| s.region_id.as_ref().map(|t| t.to_string()))
        .unwrap_or_default();
    view! {
        <div class="card">
            <nav style="margin-bottom: var(--space-4); font-size: 14px;"><a href="/?tab=sites">"Regions"</a><span class="text-muted">" / ... / "</span><a href={format!("/?tab=sites&site_id={}", site_id)}>{site_name}</a><span class="text-muted">" / Create Building"</span></nav>
            <h2>"Add Building"</h2>
            <form action="/buildings/create" method="post" class="form-stack">
                <input type="hidden" name="site_id" value=site_id.clone()/>
                <div class="form-group"><label for="name">"Building Name"</label><input type="text" id="name" name="name" required/></div>
                <div style="display: flex; gap: var(--space-3); margin-top: var(--space-4);"><button type="submit" class="btn btn-primary">"Create Building"</button><a href={format!("/?tab=sites&site_id={}", site_id)} class="btn btn-secondary">"Cancel"</a></div>
            </form>
        </div>
    }.into_any()
}

fn render_building_detail(
    building_id: String,
    buildings: Vec<Building>,
    sites: Vec<Site>,
    floors: Vec<Floor>,
) -> leptos::tachys::view::any_view::AnyView {
    let building = buildings
        .iter()
        .find(|b| b.id.as_ref().map(|t| t.to_string()).unwrap_or_default() == building_id)
        .cloned();
    let building_floors: Vec<_> = floors
        .iter()
        .filter(|f| f.building_id.to_string() == building_id)
        .cloned()
        .collect();

    if let Some(b) = building {
        let site_id = b.site_id.to_string();
        let site_name = sites
            .iter()
            .find(|s| s.id.as_ref().map(|t| t.to_string()).unwrap_or_default() == site_id)
            .map(|s| s.name.clone())
            .unwrap_or_else(|| "Site".to_string());
        view! {
            <div class="card">
                <nav style="margin-bottom: var(--space-4); font-size: 14px;"><a href="/?tab=sites">"Regions"</a><span class="text-muted">" / ... / "</span><a href={format!("/?tab=sites&site_id={}", site_id)}>{site_name}</a><span class="text-muted">" / "</span><span>{b.name.clone()}</span></nav>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-5);">
                    <h2 style="margin: 0;">{b.name.clone()}</h2>
                    <a href={format!("/?tab=sites&site_id={}", site_id)} class="btn btn-secondary">"← Back"</a>
                </div>
                <hr style="border: none; border-top: 1px solid var(--border-subtle); margin: var(--space-4) 0;"/>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3);"><h3 style="margin: 0;">"Floors"</h3><a href={format!("/?tab=sites&view=create_floor&building_id={}", building_id)} class="btn btn-primary btn-sm">"+ Add Floor"</a></div>
                <table class="data-table"><thead><tr><th>"Name"</th><th>"Level"</th><th>"Actions"</th></tr></thead><tbody>{building_floors.iter().map(|f| { let fid = f.id.as_ref().map(|t| t.to_string()).unwrap_or_default(); view! { <tr><td><strong>{f.name.clone()}</strong></td><td>{f.level}</td><td><a href={format!("/?tab=sites&floor_id={}", fid)} class="btn btn-sm btn-secondary">"View"</a></td></tr> } }).collect_view()}</tbody></table>
                {if building_floors.is_empty() { view! { <p class="text-muted text-center" style="padding: var(--space-4);">"No floors yet."</p> }.into_any() } else { view! { <div></div> }.into_any() }}
            </div>
        }.into_any()
    } else {
        view! { <div class="card"><p class="text-muted">"Building not found."</p><a href="/?tab=sites" class="btn btn-secondary">"← Back"</a></div> }.into_any()
    }
}

fn render_create_floor(
    building_id: String,
    buildings: Vec<Building>,
) -> leptos::tachys::view::any_view::AnyView {
    let building_name = buildings
        .iter()
        .find(|b| b.id.as_ref().map(|t| t.to_string()).unwrap_or_default() == building_id)
        .map(|b| b.name.clone())
        .unwrap_or_else(|| "Building".to_string());
    view! {
        <div class="card">
            <nav style="margin-bottom: var(--space-4); font-size: 14px;"><a href="/?tab=sites">"Regions"</a><span class="text-muted">" / ... / "</span><a href={format!("/?tab=sites&building_id={}", building_id)}>{building_name}</a><span class="text-muted">" / Create Floor"</span></nav>
            <h2>"Add Floor"</h2>
            <form action="/floors/create" method="post" class="form-stack">
                <input type="hidden" name="building_id" value=building_id.clone()/>
                <div class="form-group"><label for="name">"Floor Name"</label><input type="text" id="name" name="name" required/></div>
                <div class="form-group"><label for="level">"Level"</label><input type="number" id="level" name="level" required placeholder="e.g. 1, -1 for basement"/></div>
                <div style="display: flex; gap: var(--space-3); margin-top: var(--space-4);"><button type="submit" class="btn btn-primary">"Create Floor"</button><a href={format!("/?tab=sites&building_id={}", building_id)} class="btn btn-secondary">"Cancel"</a></div>
            </form>
        </div>
    }.into_any()
}

fn render_floor_detail(
    floor_id: String,
    floors: Vec<Floor>,
    buildings: Vec<Building>,
    spaces: Vec<Space>,
) -> leptos::tachys::view::any_view::AnyView {
    let floor = floors
        .iter()
        .find(|f| f.id.as_ref().map(|t| t.to_string()).unwrap_or_default() == floor_id)
        .cloned();
    let floor_spaces: Vec<_> = spaces
        .iter()
        .filter(|s| s.floor_id.to_string() == floor_id)
        .cloned()
        .collect();

    if let Some(f) = floor {
        let building_id = f.building_id.to_string();
        let building_name = buildings
            .iter()
            .find(|b| b.id.as_ref().map(|t| t.to_string()).unwrap_or_default() == building_id)
            .map(|b| b.name.clone())
            .unwrap_or_else(|| "Building".to_string());
        view! {
            <div class="card">
                <nav style="margin-bottom: var(--space-4); font-size: 14px;"><a href="/?tab=sites">"Regions"</a><span class="text-muted">" / ... / "</span><a href={format!("/?tab=sites&building_id={}", building_id)}>{building_name}</a><span class="text-muted">" / "</span><span>{f.name.clone()}</span></nav>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-5);">
                    <div><h2 style="margin: 0 0 var(--space-2) 0;">{f.name.clone()}</h2><p class="text-secondary" style="margin: 0;">"Level: "{f.level}</p></div>
                    <a href={format!("/?tab=sites&building_id={}", building_id)} class="btn btn-secondary">"← Back"</a>
                </div>
                <hr style="border: none; border-top: 1px solid var(--border-subtle); margin: var(--space-4) 0;"/>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3);"><h3 style="margin: 0;">"Spaces"</h3><a href={format!("/?tab=sites&view=create_space&floor_id={}", floor_id)} class="btn btn-primary btn-sm">"+ Add Space"</a></div>
                <table class="data-table"><thead><tr><th>"Name"</th><th>"Locator"</th><th>"Type"</th><th>"Actions"</th></tr></thead><tbody>{floor_spaces.iter().map(|s| { let sid = s.id.as_ref().map(|t| t.to_string()).unwrap_or_default(); view! { <tr><td><strong>{s.name.clone()}</strong></td><td>{s.locator.clone()}</td><td>{s.space_type.clone().unwrap_or_default()}</td><td><a href={format!("/?tab=sites&space_id={}", sid)} class="btn btn-sm btn-secondary">"View"</a></td></tr> } }).collect_view()}</tbody></table>
                {if floor_spaces.is_empty() { view! { <p class="text-muted text-center" style="padding: var(--space-4);">"No spaces yet."</p> }.into_any() } else { view! { <div></div> }.into_any() }}
            </div>
        }.into_any()
    } else {
        view! { <div class="card"><p class="text-muted">"Floor not found."</p><a href="/?tab=sites" class="btn btn-secondary">"← Back"</a></div> }.into_any()
    }
}

fn render_create_space(
    floor_id: String,
    floors: Vec<Floor>,
) -> leptos::tachys::view::any_view::AnyView {
    let floor_name = floors
        .iter()
        .find(|f| f.id.as_ref().map(|t| t.to_string()).unwrap_or_default() == floor_id)
        .map(|f| f.name.clone())
        .unwrap_or_else(|| "Floor".to_string());
    view! {
        <div class="card">
            <nav style="margin-bottom: var(--space-4); font-size: 14px;"><a href="/?tab=sites">"Regions"</a><span class="text-muted">" / ... / "</span><a href={format!("/?tab=sites&floor_id={}", floor_id)}>{floor_name}</a><span class="text-muted">" / Create Space"</span></nav>
            <h2>"Add Space"</h2>
            <form action="/spaces/create" method="post" class="form-stack">
                <input type="hidden" name="floor_id" value=floor_id.clone()/>
                <div class="form-group"><label for="name">"Space Name"</label><input type="text" id="name" name="name" required/></div>
                <div class="form-group"><label for="locator">"Locator"</label><input type="text" id="locator" name="locator" required placeholder="e.g. 101, B01"/></div>
                <div class="form-group"><label for="space_type">"Type (optional)"</label><input type="text" id="space_type" name="space_type" placeholder="e.g. Server Room, Office"/></div>
                <div style="display: flex; gap: var(--space-3); margin-top: var(--space-4);"><button type="submit" class="btn btn-primary">"Create Space"</button><a href={format!("/?tab=sites&floor_id={}", floor_id)} class="btn btn-secondary">"Cancel"</a></div>
            </form>
        </div>
    }.into_any()
}

fn render_space_detail(
    space_id: String,
    spaces: Vec<Space>,
    floors: Vec<Floor>,
    racks: Vec<Rack>,
) -> leptos::tachys::view::any_view::AnyView {
    let space = spaces
        .iter()
        .find(|s| s.id.as_ref().map(|t| t.to_string()).unwrap_or_default() == space_id)
        .cloned();
    let space_racks: Vec<_> = racks
        .iter()
        .filter(|r| r.space_id.to_string() == space_id)
        .cloned()
        .collect();

    if let Some(s) = space {
        let floor_id = s.floor_id.to_string();
        let floor_name = floors
            .iter()
            .find(|f| f.id.as_ref().map(|t| t.to_string()).unwrap_or_default() == floor_id)
            .map(|f| f.name.clone())
            .unwrap_or_else(|| "Floor".to_string());
        view! {
            <div class="card">
                <nav style="margin-bottom: var(--space-4); font-size: 14px;"><a href="/?tab=sites">"Regions"</a><span class="text-muted">" / ... / "</span><a href={format!("/?tab=sites&floor_id={}", floor_id)}>{floor_name}</a><span class="text-muted">" / "</span><span>{s.name.clone()}</span></nav>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-5);">
                    <div><h2 style="margin: 0 0 var(--space-2) 0;">{s.name.clone()}</h2><p class="text-secondary" style="margin: 0;">"Locator: "{s.locator.clone()}" | "{s.space_type.clone().unwrap_or_else(|| "No type specified".to_string())}</p></div>
                    <a href={format!("/?tab=sites&floor_id={}", floor_id)} class="btn btn-secondary">"← Back"</a>
                </div>
                <hr style="border: none; border-top: 1px solid var(--border-subtle); margin: var(--space-4) 0;"/>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3);"><h3 style="margin: 0;">"Racks"</h3><a href={format!("/?tab=sites&view=create_rack&space_id={}", space_id)} class="btn btn-primary btn-sm">"+ Add Rack"</a></div>
                <table class="data-table"><thead><tr><th>"Name"</th><th>"Height (U)"</th><th>"Actions"</th></tr></thead><tbody>{space_racks.iter().map(|r| { let rid = r.id.as_ref().map(|t| t.to_string()).unwrap_or_default(); view! { <tr><td><strong>{r.name.clone()}</strong></td><td>{r.height_u}"U"</td><td><a href={format!("/?tab=sites&rack_id={}", rid)} class="btn btn-sm btn-secondary">"View"</a></td></tr> } }).collect_view()}</tbody></table>
                {if space_racks.is_empty() { view! { <p class="text-muted text-center" style="padding: var(--space-4);">"No racks yet."</p> }.into_any() } else { view! { <div></div> }.into_any() }}
            </div>
        }.into_any()
    } else {
        view! { <div class="card"><p class="text-muted">"Space not found."</p><a href="/?tab=sites" class="btn btn-secondary">"← Back"</a></div> }.into_any()
    }
}

fn render_create_rack(
    space_id: String,
    spaces: Vec<Space>,
) -> leptos::tachys::view::any_view::AnyView {
    let space_name = spaces
        .iter()
        .find(|s| s.id.as_ref().map(|t| t.to_string()).unwrap_or_default() == space_id)
        .map(|s| s.name.clone())
        .unwrap_or_else(|| "Space".to_string());
    view! {
        <div class="card">
            <nav style="margin-bottom: var(--space-4); font-size: 14px;"><a href="/?tab=sites">"Regions"</a><span class="text-muted">" / ... / "</span><a href={format!("/?tab=sites&space_id={}", space_id)}>{space_name}</a><span class="text-muted">" / Create Rack"</span></nav>
            <h2>"Add Rack"</h2>
            <form action="/racks/create" method="post" class="form-stack">
                <input type="hidden" name="space_id" value=space_id.clone()/>
                <div class="form-group"><label for="name">"Rack Name"</label><input type="text" id="name" name="name" required/></div>
                <div class="form-group"><label for="height_u">"Height (U)"</label><input type="number" id="height_u" name="height_u" required placeholder="e.g. 42"/></div>
                <div style="display: flex; gap: var(--space-3); margin-top: var(--space-4);"><button type="submit" class="btn btn-primary">"Create Rack"</button><a href={format!("/?tab=sites&space_id={}", space_id)} class="btn btn-secondary">"Cancel"</a></div>
            </form>
        </div>
    }.into_any()
}

fn render_rack_detail(
    rack_id: String,
    racks: Vec<Rack>,
    spaces: Vec<Space>,
    devices: Vec<Device>,
) -> leptos::tachys::view::any_view::AnyView {
    let rack = racks
        .iter()
        .find(|r| r.id.as_ref().map(|t| t.to_string()).unwrap_or_default() == rack_id)
        .cloned();
    let rack_devices: Vec<_> = devices
        .iter()
        .filter(|d| d.rack_id.to_string() == rack_id)
        .cloned()
        .collect();

    if let Some(r) = rack {
        let space_id = r.space_id.to_string();
        let space_name = spaces
            .iter()
            .find(|s| s.id.as_ref().map(|t| t.to_string()).unwrap_or_default() == space_id)
            .map(|s| s.name.clone())
            .unwrap_or_else(|| "Space".to_string());
        view! {
            <div class="card">
                <nav style="margin-bottom: var(--space-4); font-size: 14px;"><a href="/?tab=sites">"Regions"</a><span class="text-muted">" / ... / "</span><a href={format!("/?tab=sites&space_id={}", space_id)}>{space_name}</a><span class="text-muted">" / "</span><span>{r.name.clone()}</span></nav>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-5);">
                    <div><h2 style="margin: 0 0 var(--space-2) 0;">{r.name.clone()}</h2><p class="text-secondary" style="margin: 0;">{r.height_u}"U Rack"</p></div>
                    <a href={format!("/?tab=sites&space_id={}", space_id)} class="btn btn-secondary">"← Back"</a>
                </div>
                <hr style="border: none; border-top: 1px solid var(--border-subtle); margin: var(--space-4) 0;"/>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3);"><h3 style="margin: 0;">"Devices"</h3><a href={format!("/?tab=sites&view=create_device&rack_id={}", rack_id)} class="btn btn-primary btn-sm">"+ Add Device"</a></div>
                <table class="data-table"><thead><tr><th>"Name"</th><th>"Position (U)"</th><th>"Actions"</th></tr></thead><tbody>{rack_devices.iter().map(|d| { let did = d.id.as_ref().map(|t| t.to_string()).unwrap_or_default(); view! { <tr><td><strong>{d.name.clone()}</strong></td><td>"U"{d.position_u}</td><td><a href={format!("/?tab=sites&device_id={}", did)} class="btn btn-sm btn-secondary">"View"</a></td></tr> } }).collect_view()}</tbody></table>
                {if rack_devices.is_empty() { view! { <p class="text-muted text-center" style="padding: var(--space-4);">"No devices yet."</p> }.into_any() } else { view! { <div></div> }.into_any() }}
            </div>
        }.into_any()
    } else {
        view! { <div class="card"><p class="text-muted">"Rack not found."</p><a href="/?tab=sites" class="btn btn-secondary">"← Back"</a></div> }.into_any()
    }
}

fn render_create_device(
    rack_id: String,
    racks: Vec<Rack>,
) -> leptos::tachys::view::any_view::AnyView {
    let rack_name = racks
        .iter()
        .find(|r| r.id.as_ref().map(|t| t.to_string()).unwrap_or_default() == rack_id)
        .map(|r| r.name.clone())
        .unwrap_or_else(|| "Rack".to_string());
    view! {
        <div class="card">
            <nav style="margin-bottom: var(--space-4); font-size: 14px;"><a href="/?tab=sites">"Regions"</a><span class="text-muted">" / ... / "</span><a href={format!("/?tab=sites&rack_id={}", rack_id)}>{rack_name}</a><span class="text-muted">" / Create Device"</span></nav>
            <h2>"Add Device"</h2>
            <form action="/devices/create" method="post" class="form-stack">
                <input type="hidden" name="rack_id" value=rack_id.clone()/>
                <div class="form-group"><label for="name">"Device Name"</label><input type="text" id="name" name="name" required/></div>
                <div class="form-group"><label for="position_u">"Position (U)"</label><input type="number" id="position_u" name="position_u" required placeholder="e.g. 1"/></div>
                <div style="display: flex; gap: var(--space-3); margin-top: var(--space-4);"><button type="submit" class="btn btn-primary">"Create Device"</button><a href={format!("/?tab=sites&rack_id={}", rack_id)} class="btn btn-secondary">"Cancel"</a></div>
            </form>
        </div>
    }.into_any()
}
