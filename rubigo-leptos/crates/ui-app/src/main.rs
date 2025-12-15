//! UI App - Refactored Leptos Application
//!
//! This is the new client-side rendered application using the refactored
//! component architecture.

use leptos::prelude::*;
use leptos_router::components::*;
use leptos_router::path;
use ui_core::features::user_session::{PersonaSwitcher, SignInScreen, UserInfo};
use ui_core::layout::{ConnectionStatus, Layout, NavItem};

fn main() {
    console_error_panic_hook::set_once();
    _ = console_log::init_with_level(log::Level::Debug);

    mount_to_body(App);
}

/// Navigation items for the sidebar
fn get_nav_items() -> Vec<NavItem> {
    vec![
        NavItem {
            id: "home",
            label: "Home",
            icon: "🏠",
            href: "/",
        },
        NavItem {
            id: "calendar",
            label: "Calendar",
            icon: "📅",
            href: "/calendar",
        },
        NavItem {
            id: "personnel",
            label: "Personnel",
            icon: "👥",
            href: "/personnel",
        },
        NavItem {
            id: "sites",
            label: "Sites",
            icon: "🌍",
            href: "/sites",
        },
        NavItem {
            id: "assets",
            label: "Assets",
            icon: "🖥️",
            href: "/assets",
        },
        NavItem {
            id: "connections",
            label: "Connections",
            icon: "🔗",
            href: "/connections",
        },
    ]
}

/// Load available people for persona selection
fn get_available_people() -> Vec<UserInfo> {
    use scenario_loader::embedded;

    embedded::personnel()
        .iter()
        .map(|p| {
            UserInfo::new(p.get_id(), p.name.clone())
                .with_title(p.title.clone())
                .with_department(p.department.clone())
        })
        .collect()
}

/// Main application component with user session management
#[component]
fn App() -> impl IntoView {
    let nav_items = get_nav_items();
    let available_people = get_available_people();

    // Helper to get localStorage
    let get_storage = || {
        web_sys::window()
            .and_then(|w| w.local_storage().ok())
            .flatten()
    };

    // Try to restore session from localStorage
    let initial_user = {
        let people = available_people.clone();
        get_storage()
            .and_then(|storage| storage.get_item("rubigo_user_id").ok().flatten())
            .and_then(|stored_id| people.iter().find(|p| p.id == stored_id).cloned())
    };

    // User session state (initialized from localStorage if available)
    let current_user: RwSignal<Option<UserInfo>> = RwSignal::new(initial_user);
    let persona_overlay_open = RwSignal::new(false);

    // Callbacks for session management
    let open_persona_switcher = Callback::new(move |_: ()| {
        log::info!("Opening persona switcher");
        persona_overlay_open.set(true);
    });

    let handle_sign_out = Callback::new(move |_: ()| {
        log::info!("Signing out");
        // Clear from localStorage
        if let Some(storage) = get_storage() {
            let _ = storage.remove_item("rubigo_user_id");
        }
        current_user.set(None);
    });

    let handle_persona_select = Callback::new(move |user: UserInfo| {
        log::info!("Selected persona: {}", user.name);
        // Save to localStorage
        if let Some(storage) = get_storage() {
            let _ = storage.set_item("rubigo_user_id", &user.id);
        }
        current_user.set(Some(user));
    });

    view! {
        // Persona switcher overlay - wrapped in reactive closure
        {move || {
            let people = available_people.clone();
            let user = current_user.get();
            view! {
                <PersonaSwitcher
                    open=persona_overlay_open
                    people=people
                    current_user=user
                    on_select=handle_persona_select
                />
            }
        }}

        // Show sign-in screen if no user, otherwise show main app
        {move || {
            if current_user.get().is_none() {
                // Show sign-in screen
                view! {
                    <SignInScreen on_sign_in=open_persona_switcher />
                }.into_any()
            } else {
                // Show main app
                let nav = nav_items.clone();
                let user = current_user.get();
                view! {
                    <Router>
                        <Layout
                            nav_items=nav
                            status=ConnectionStatus::Connected
                            current_user=user
                            on_switch_identity=open_persona_switcher
                            on_sign_out=handle_sign_out
                        >
                            <Routes fallback=|| view! { <PlaceholderPage title="404 - Not Found" /> }>
                                <Route path=path!("/") view=HomePage />
                                <Route path=path!("/calendar") view=CalendarPageWrapper />
                                <Route path=path!("/personnel") view=PersonnelPageWrapper />
                                <Route path=path!("/sites") view=SitesPageWrapper />
                                <Route path=path!("/assets") view=|| view! { <PlaceholderPage title="Assets" /> } />
                                <Route path=path!("/connections") view=|| view! { <PlaceholderPage title="Connections" /> } />
                            </Routes>
                        </Layout>
                    </Router>
                }.into_any()
            }
        }}
    }
}

/// Home page - the first migrated module
#[component]
fn HomePage() -> impl IntoView {
    use ui_core::primitives::*;

    view! {
        <div class="home-page">
            <h1>"Welcome to Network Simulation"</h1>
            <p class="subtitle">"Refactored with Leptos 0.8 and reactive architecture"</p>

            <div class="stats-grid">
                <StatCard title="Sites" value="24" icon="🌍" />
                <StatCard title="Assets" value="156" icon="🖥️" />
                <StatCard title="Personnel" value="89" icon="👥" />
                <StatCard title="Connections" value="42" icon="🔗" />
            </div>

            <div class="quick-actions">
                <h2>"Quick Actions"</h2>
                <div class="action-buttons">
                    <Button variant=ButtonVariant::Primary>"Add Site"</Button>
                    <Button variant=ButtonVariant::Secondary>"Add Asset"</Button>
                    <Button variant=ButtonVariant::Secondary>"View Calendar"</Button>
                </div>
            </div>
        </div>
    }
}

/// Stat card component
#[component]
fn StatCard(title: &'static str, value: &'static str, icon: &'static str) -> impl IntoView {
    view! {
        <div class="stat-card">
            <span class="stat-icon">{icon}</span>
            <div class="stat-content">
                <span class="stat-value">{value}</span>
                <span class="stat-title">{title}</span>
            </div>
        </div>
    }
}

/// Placeholder for tabs not yet migrated
#[component]
fn PlaceholderPage(title: &'static str) -> impl IntoView {
    view! {
        <div class="placeholder-page">
            <h1>{title}</h1>
            <p>"This module is being migrated to the new architecture."</p>
            <p class="hint">"Coming soon..."</p>
        </div>
    }
}

/// Personnel page with embedded scenario data
#[component]
fn PersonnelPageWrapper() -> impl IntoView {
    use scenario_loader::embedded;
    use ui_core::features::personnel::{Employee, PersonnelPage};

    // Load embedded MMC personnel data
    let people = embedded::personnel();

    // Convert scenario Person to ui-core Employee
    let employees: Vec<Employee> = people
        .iter()
        .map(|p| {
            // Convert photo_data (base64) to data URL, or fallback to photo URL
            let photo_url = p
                .photo_data
                .as_ref()
                .map(|data| format!("data:image/jpeg;base64,{}", data))
                .or_else(|| p.photo.clone());

            Employee {
                id: p.get_id(),
                name: p.name.clone(),
                title: p.title.clone(),
                department: p.department.clone(),
                email: p.email.clone(),
                building: p.building.clone(),
                floor: p.level.map(|l| format!("Level {}", l)),
                desk: p.space.clone(),
                phone: p.desk_phone.clone().or_else(|| p.cell_phone.clone()),
                photo_url,
                bio: p.bio.clone(),
            }
        })
        .collect();

    view! {
        <PersonnelPage employees=employees />
    }
}

/// Calendar page with sample events
#[component]
fn CalendarPageWrapper() -> impl IntoView {
    use chrono::{NaiveDateTime, TimeZone, Utc};
    use scenario_loader::embedded;
    use ui_core::features::calendar::{
        CalendarEvent, CalendarPage, EventType, RecurrenceFrequency,
    };
    use ui_core::primitives::PersonOption;

    // Convert scenario Event to ui-core CalendarEvent
    fn convert_event(e: &scenario_loader::Event, idx: usize) -> CalendarEvent {
        // Parse start/end times
        let start = NaiveDateTime::parse_from_str(&e.start_time, "%Y-%m-%dT%H:%M:%S")
            .ok()
            .map(|dt| Utc.from_utc_datetime(&dt))
            .unwrap_or_else(Utc::now);
        let end = NaiveDateTime::parse_from_str(&e.end_time, "%Y-%m-%dT%H:%M:%S")
            .ok()
            .map(|dt| Utc.from_utc_datetime(&dt))
            .unwrap_or_else(Utc::now);

        // Map event type
        let event_type = match e.event_type.as_deref() {
            Some("standup") => EventType::Standup,
            Some("all-hands") => EventType::AllHands,
            Some("1:1") => EventType::OneOnOne,
            Some("training") => EventType::Training,
            Some("interview") => EventType::Interview,
            Some("holiday") => EventType::Holiday,
            Some("conference") => EventType::Conference,
            Some("review") => EventType::Review,
            Some("planning") => EventType::Planning,
            Some("appointment") => EventType::Appointment,
            Some("reminder") => EventType::Reminder,
            Some("out-of-office") => EventType::OutOfOffice,
            _ => EventType::Meeting,
        };

        // Map recurrence
        let recurrence = match e.recurrence.as_deref() {
            Some("daily") => RecurrenceFrequency::Daily,
            Some("weekly") => RecurrenceFrequency::Weekly,
            Some("monthly") => RecurrenceFrequency::Monthly,
            Some("yearly") => RecurrenceFrequency::Yearly,
            _ => RecurrenceFrequency::None,
        };

        // Parse recurrence until date
        let recurrence_until = e.recurrence_until.as_ref().and_then(|s| {
            NaiveDateTime::parse_from_str(&format!("{}T00:00:00", s), "%Y-%m-%dT%H:%M:%S")
                .ok()
                .map(|dt| Utc.from_utc_datetime(&dt))
        });

        let mut cal_event =
            CalendarEvent::new(format!("event_{}", idx), e.title.clone(), start, end);
        cal_event.description = e.description.clone();
        cal_event.location = e.location.clone().or_else(|| e.virtual_url.clone());
        cal_event.event_type = event_type;
        cal_event.recurrence = recurrence;
        cal_event.recurrence_days = e.recurrence_days.clone().unwrap_or_default();
        cal_event.recurrence_until = recurrence_until;
        cal_event
    }

    // Load events from embedded scenario data
    let events: Vec<CalendarEvent> = embedded::events()
        .iter()
        .enumerate()
        .map(|(idx, e)| convert_event(e, idx))
        .collect();

    // Load personnel for organizer/participant selection
    let people: Vec<PersonOption> = embedded::personnel()
        .iter()
        .map(|p| PersonOption::new(p.get_id(), p.name.clone()).with_title(p.title.clone()))
        .collect();

    view! {
        <CalendarPage initial_events=events available_people=people />
    }
}

/// Sites page with 3D Bevy globe visualization
#[component]
fn SitesPageWrapper() -> impl IntoView {
    use bevy::prelude::*;
    use leptos_bevy_canvas::prelude::*;

    // Initialize the Bevy app for the globe viewer
    fn init_bevy_app() -> App {
        let mut app = App::new();

        // Add EmbeddedAssetPlugin BEFORE DefaultPlugins for WASM asset loading
        app.add_plugins(bevy_embedded_assets::EmbeddedAssetPlugin::default());

        app.add_plugins(
            DefaultPlugins
                .set(WindowPlugin {
                    primary_window: Some(Window {
                        // leptos-bevy-canvas creates a canvas with this default ID
                        canvas: Some("#bevy_canvas".into()),
                        fit_canvas_to_parent: true,
                        prevent_default_event_handling: true,
                        transparent: true, // Enable transparent canvas background
                        ..default()
                    }),
                    ..default()
                })
                .set(bevy::asset::AssetPlugin {
                    file_path: "assets".into(),
                    ..default()
                }),
        );

        // Add our viewer plugins
        app.add_plugins(bevy_viewer::BevyViewerPlugin);

        app
    }

    view! {
        <div class="sites-page">
            <div class="sites-header">
                <h1>"Sites"</h1>
                <p class="sites-subtitle">"Global site locations and infrastructure"</p>
            </div>

            <div class="globe-container">
                <BevyCanvas
                    init=init_bevy_app
                    attr:id="bevy_canvas"
                />
            </div>

            <div class="sites-info">
                <p>"🌍 Interactive 3D globe visualization"</p>
                <p class="info-hint">"Drag to rotate • Scroll to zoom"</p>
            </div>
        </div>
    }
}
