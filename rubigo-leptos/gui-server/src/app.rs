//! App module - Page rendering with Leptos 0.8 SSR

use leptos::prelude::*;
use leptos::IntoView;

use crate::{Region, SimulationRun, Site};
use nexosim_hybrid::config::{ComponentConfig, ConnectionConfig};
use nexosim_hybrid::database::calendar::Meeting;
use nexosim_hybrid::database::geo::{Building, Device, Floor, GeoFeature, NetworkAsset, Rack, Space};
// Import components from the new module structure
use crate::components::assets_module::AssetsModule;
use crate::components::calendar_module::CalendarModule;
use crate::components::chat_module::ChatModule;
use crate::components::components_tab::ComponentsTab;
use crate::components::connections_tab::ConnectionsTab;
use crate::components::contracts_module::ContractsModule;
use crate::components::email_module::EmailModule;
use crate::components::finance_module::FinanceModule;
use crate::components::sites_tab::SitesTab;
use crate::components::meetings_module::MeetingsModule;
use crate::components::metrics_tab::MetricsTab;
use crate::components::persona_switcher::PersonaSwitcher;
use crate::components::personnel_module::{PersonnelModule, PersonnelModuleOrgChart};
use crate::components::sign_in_screen::SignInScreen;
use crate::components::user_session_widget::UserSessionWidget;
use crate::components::presentations_module::PresentationsModule;
use crate::components::requirements_module::RequirementsModule;
use crate::components::development_module::DevelopmentModule;
use crate::components::risk_module::RiskModule;
use crate::components::sidebar::Sidebar;
use crate::components::simulation_tab::SimulationTab;
use crate::components::tasks_module::TasksModule;
use crate::components::widgets::landing_page::LandingPage;

/// Data needed to render the page
pub struct PageData {
    pub components: Vec<ComponentConfig>,
    pub connections: Vec<ConnectionConfig>,
    pub regions: Vec<Region>,
    pub sites: Vec<Site>,
    pub buildings: Vec<Building>,
    pub floors: Vec<Floor>,
    pub spaces: Vec<Space>,
    pub racks: Vec<Rack>,
    pub devices: Vec<Device>,
    pub assets: Vec<NetworkAsset>,
    pub runs: Vec<SimulationRun>,
    pub geo_features: Vec<GeoFeature>,
    pub cached_country_paths: Vec<String>,
    pub cached_state_paths: Vec<String>,
    pub cached_globe_country_paths: Vec<String>,
    pub cached_globe_state_paths: Vec<String>,
    pub active_tab: String,
    pub view: Option<String>,
    pub workweek: Option<String>,
    pub geo_view: crate::components::sites_tab::GeoView,
    #[allow(dead_code)]
    pub run_id: Option<String>,
    pub month: Option<u32>,
    pub year: Option<i32>,
    pub modal: Option<String>,

    // Persona system fields
    #[allow(dead_code)]
    pub dev_mode: bool,
    pub current_persona: Option<String>,
    pub people: Vec<nexosim_hybrid::database::geo::Person>,
    pub meetings: Vec<Meeting>,
}

/// Render the complete HTML page using Leptos 0.8 SSR
pub fn render_page(data: PageData) -> String {
    // Create a reactive owner for SSR context
    let owner = Owner::new();
    owner.set();

    // Use the reactive owner to render
    let html = owner.with(|| {
        use leptos::tachys::view::RenderHtml;
        let view = view! { <HomePage data=data /> }.into_view();
        let mut buf = String::new();
        view.to_html_with_buf(&mut buf, &mut Default::default(), true, false, vec![]);
        buf
    });

    // Wrap in DOCTYPE
    format!("<!DOCTYPE html>{}", html)
}

#[component]
fn HomePage(data: PageData) -> impl IntoView {
    let active_tab = data.active_tab.clone();

    view! {
        <html lang="en">
            <head>
                <meta charset="UTF-8"/>
                <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                <title>"Rubigo"</title>
                <link rel="stylesheet" href="/assets/style.css"/>
            </head>
            <body>
                <div class="app-container">
                    <header class="app-header">
                        <div class="header-brand">
                            <img src="/assets/rubigo-logo.svg" alt="Rubigo" class="header-logo"/>
                            <h1>"Rubigo"</h1>
                        </div>
                        <div class="header-status">
                            <div id="render-mode-pill" class="render-mode-pill" title="Detecting rendering capabilities...">
                                <span class="render-mode-icon">"⏳"</span>
                                <span>"Detecting"</span>
                            </div>
                            <div id="sse-status" class="sse-status">"Connecting..."</div>
                            <UserSessionWidget current_persona=data.current_persona.clone() />
                        </div>
                    </header>

                    <div class="app-layout">
                        {if data.current_persona.is_some() {
                            view! { <Sidebar active_tab=active_tab.clone() /> }.into_any()
                        } else {
                            view! { <span></span> }.into_any()
                        }}
                        
                        <main class="main-content">
                            {render_tab(&data)}
                        </main>
                    </div>

                    <PersonaSwitcher
                        current_persona=data.current_persona.clone()
                        people=data.people.clone()
                    />
                </div>

                <script>
                    r#"
                    (function() {
                        const statusEl = document.getElementById('sse-status');
                        let wasDisconnected = false;
                        let reconnectAttempts = 0;
                        const justReloaded = sessionStorage.getItem('sse-reloading') === 'true';
                        let showingReloaded = false;
                        
                        // Clear the reload flag
                        sessionStorage.removeItem('sse-reloading');
                        
                        function updateStatus(status, className) {
                            statusEl.textContent = status;
                            statusEl.className = 'sse-status ' + className;
                        }
                        
                        // If just reloaded, show Reloaded immediately (before SSE even connects)
                        if (justReloaded) {
                            showingReloaded = true;
                            updateStatus('Reloaded!', 'reloaded');
                            setTimeout(() => {
                                showingReloaded = false;
                                updateStatus('Connected', 'connected');
                            }, 3000);
                        }
                        
                        function connect() {
                            const evtSource = new EventSource('/sse');
                            
                            evtSource.onopen = function() {
                                if (wasDisconnected) {
                                    // Server is back up after rebuild - set flag and reload
                                    sessionStorage.setItem('sse-reloading', 'true');
                                    updateStatus('Reloading...', 'reloading');
                                    setTimeout(() => location.reload(), 500);
                                } else if (!showingReloaded) {
                                    updateStatus('Connected', 'connected');
                                }
                                reconnectAttempts = 0;
                            };
                            
                            evtSource.onmessage = function(event) {
                                // Don't override Reloaded state
                                if (!showingReloaded) {
                                    updateStatus('Connected', 'connected');
                                }
                            };
                            
                            evtSource.onerror = function() {
                                wasDisconnected = true;
                                evtSource.close();
                                reconnectAttempts++;
                                updateStatus('Reconnecting... (' + reconnectAttempts + ')', 'reconnecting');
                                setTimeout(connect, 1000);
                            };
                        }
                        
                        connect();
                    })();
                    "#
                </script>
                <script src="/assets/script.js"></script>
            </body>
        </html>
    }
}

#[allow(dead_code, unused)]
#[component]
fn TabLink(tab: &'static str, active: String, label: &'static str) -> impl IntoView {
    let is_active = active == tab;
    let class = if is_active {
        "tab-link active"
    } else {
        "tab-link"
    };
    let href = format!("/?tab={}", tab);

    view! {
        <a href=href class=class>{label}</a>
    }
}

fn render_tab(data: &PageData) -> impl IntoView {
    // If no persona selected, show sign-in screen
    if data.current_persona.is_none() {
        return view! { <SignInScreen /> }.into_any();
    }

    // Get current persona from people list
    let current_persona = data.current_persona.as_ref().and_then(|name| {
        data.people.iter().find(|p| &p.name == name).cloned()
    });
    
    match data.active_tab.as_str() {
        "home" => view! { <LandingPage 
            current_persona=current_persona
            component_count=data.components.len()
            region_count=data.regions.len()
            site_count=data.sites.len()
            building_count=data.buildings.len()
        /> }.into_any(),
        "components" => view! { <ComponentsTab components=data.components.clone()/> }.into_any(),
        "connections" => view! { <ConnectionsTab connections=data.connections.clone() components=data.components.clone()/> }.into_any(),
        "simulation" => view! { <SimulationTab runs=data.runs.clone()/> }.into_any(),
        "metrics" => view! { <MetricsTab/> }.into_any(),
        "sites" => view! { <SitesTab regions=data.regions.clone() sites=data.sites.clone() buildings=data.buildings.clone() floors=data.floors.clone() spaces=data.spaces.clone() racks=data.racks.clone() devices=data.devices.clone() geo_features=data.geo_features.clone() cached_country_paths=data.cached_country_paths.clone() cached_state_paths=data.cached_state_paths.clone() cached_globe_country_paths=data.cached_globe_country_paths.clone() cached_globe_state_paths=data.cached_globe_state_paths.clone() view=data.geo_view.clone()/> }.into_any(),
        // New module stubs  
        "personnel" => {
            if data.view.as_deref() == Some("orgchart") {
                view! { <PersonnelModuleOrgChart people=data.people.clone() /> }.into_any()
            } else {
                view! { <PersonnelModule
                    people=data.people.clone()
                    spaces=data.spaces.clone()
                    floors=data.floors.clone()
                    buildings=data.buildings.clone()
                /> }.into_any()
            }
        },
        "assets" => view! { <AssetsModule
            assets=data.assets.clone()
            racks=data.racks.clone()
            spaces=data.spaces.clone()
        /> }.into_any(),
        "tasks" => view! { <TasksModule/> }.into_any(),
        "contracts" => view! { <ContractsModule/> }.into_any(),
        "finance" => view! { <FinanceModule/> }.into_any(),
        "risk" => view! { <RiskModule/> }.into_any(),
        "requirements" => view! { <RequirementsModule/> }.into_any(),
        "development" => view! { <DevelopmentModule/> }.into_any(),
        "calendar" => view! { 
            <CalendarModule 
                month=data.month 
                year=data.year 
                modal=data.modal.clone()
                view=data.view.clone()
                workweek=data.workweek.clone()
                buildings=data.buildings.clone()
                floors=data.floors.clone()
                spaces=data.spaces.clone()
                people=data.people.clone()
                meetings=data.meetings.clone()
            /> 
        }.into_any(),




        "chat" => view! { <ChatModule/> }.into_any(),
        "email" => view! { <EmailModule/> }.into_any(),
        "meetings" => view! { <MeetingsModule/> }.into_any(),
        "presentations" => view! { <PresentationsModule/> }.into_any(),
        _ => view! { <LandingPage 
            current_persona=current_persona
            component_count=data.components.len()
            region_count=data.regions.len()
            site_count=data.sites.len()
            building_count=data.buildings.len()
        /> }.into_any(),
    }
}
