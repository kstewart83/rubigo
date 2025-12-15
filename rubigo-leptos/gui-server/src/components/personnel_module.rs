//! Personnel Module
//!
//! Employee directory with search, department filter, photos, and bios.

use leptos::prelude::*;
use leptos::IntoView;
use nexosim_hybrid::database::geo::{Building, Floor, Person, Space};
use std::collections::HashMap;

/// Personnel module main component
#[component]
pub fn PersonnelModule(
    people: Vec<Person>,
    spaces: Vec<Space>,
    floors: Vec<Floor>,
    buildings: Vec<Building>,
) -> impl IntoView {
    // Build lookups for location resolution
    let space_map: HashMap<String, Space> = spaces
        .into_iter()
        .filter_map(|s| {
            let id = s.id.as_ref()?.to_string();
            Some((id, s))
        })
        .collect();

    // Debug: log space map contents
    tracing::info!("PersonnelModule: space_map has {} entries", space_map.len());
    if let Some((k, v)) = space_map.iter().next() {
        tracing::info!("  Sample space key: '{}', name: '{}'", k, v.name);
    }

    let floor_map: HashMap<String, Floor> = floors
        .into_iter()
        .filter_map(|f| {
            let id = f.id.as_ref()?.to_string();
            Some((id, f))
        })
        .collect();

    let building_map: HashMap<String, Building> = buildings
        .into_iter()
        .filter_map(|b| {
            let id = b.id.as_ref()?.to_string();
            Some((id, b))
        })
        .collect();

    // Get unique departments for filter
    let departments: Vec<String> = {
        let mut deps: Vec<String> = people.iter().map(|p| p.department.clone()).collect();
        deps.sort();
        deps.dedup();
        deps
    };

    view! {
        <div class="personnel-module">
            <div class="personnel-header">
                <h1 class="personnel-title">"👥 Personnel"</h1>
                <div class="personnel-stats">
                    <span class="stat-item">{people.len()}" employees"</span>
                    <span class="stat-item">{departments.len()}" departments"</span>
                </div>
            </div>

            <div class="personnel-filters">
                <div class="filter-group">
                    <input
                        type="text"
                        placeholder="Search by name, title, or email..."
                        class="search-input"
                        id="employee-search"
                        oninput="filterEmployees()"
                    />
                </div>
                <div class="filter-group">
                    <select class="department-filter" id="department-filter" onchange="filterEmployees()">
                        <option value="">"All Departments"</option>
                        {departments.iter().map(|dept| {
                            view! { <option value=dept.clone()>{dept.clone()}</option> }
                        }).collect_view()}
                    </select>
                </div>
            </div>

            <div class="employee-grid" id="employee-grid">
                {people.iter().map(|person| {
                    // Resolve location components separately
                    let (building_name, floor_name, locator, space_type) = if let Some(sid) = &person.space_id {
                        if let Some(space) = space_map.get(&sid.to_string()) {
                            let floor_name = floor_map.get(&space.floor_id.to_string())
                                .map(|f| f.name.clone())
                                .unwrap_or_else(|| "Unknown".to_string());

                            let building_name = if let Some(floor) = floor_map.get(&space.floor_id.to_string()) {
                                building_map.get(&floor.building_id.to_string())
                                    .map(|b| b.name.clone())
                                    .unwrap_or_else(|| "Unknown".to_string())
                            } else {
                                "Unknown".to_string()
                            };

                            let space_type = space.space_type.clone().unwrap_or_default();
                            (building_name, floor_name, space.locator.clone(), space_type)
                        } else {
                            ("Not assigned".to_string(), String::new(), String::new(), String::new())
                        }
                    } else {
                        ("Remote / Unassigned".to_string(), String::new(), String::new(), String::new())
                    };

                    view! { <EmployeeCard person=person.clone() building=building_name floor=floor_name locator=locator space_type=space_type /> }
                }).collect_view()}
            </div>

            // Details panel
            <div class="panel-overlay" id="panel-overlay" onclick="closeDetailsPanel()"></div>
            <aside class="details-panel" id="details-panel">
                <div class="panel-header">
                    <button class="panel-close" onclick="closeDetailsPanel()">"×"</button>
                    <div class="panel-avatar-large" id="panel-avatar">
                        <span class="avatar-initials" id="panel-initials"></span>
                    </div>
                    <h2 class="panel-name" id="panel-name"></h2>
                    <p class="panel-title" id="panel-title"></p>
                </div>
                <div class="panel-content">
                    <div class="detail-row">
                        <span class="detail-label">"Department"</span>
                        <span class="detail-value" id="panel-department"></span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">"Building"</span>
                        <span class="detail-value" id="panel-building"></span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">"Floor"</span>
                        <span class="detail-value" id="panel-floor"></span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">"Office / Desk"</span>
                        <span class="detail-value" id="panel-locator"></span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">"Email"</span>
                        <a href="#" class="detail-value detail-link" id="panel-email"></a>
                    </div>
                    <div class="detail-row" id="panel-desk-row" style="display:none">
                        <span class="detail-label">"Desk Phone"</span>
                        <a href="#" class="detail-value detail-link" id="panel-desk-phone"></a>
                    </div>
                    <div class="detail-row" id="panel-cell-row" style="display:none">
                        <span class="detail-label">"Cell Phone"</span>
                        <a href="#" class="detail-value detail-link" id="panel-cell-phone"></a>
                    </div>
                    <div class="panel-bio" id="panel-bio-section" style="display:none">
                        <h3 class="bio-label">"About"</h3>
                        <p class="bio-text" id="panel-bio"></p>
                    </div>
                </div>
            </aside>

            <script>{r#"
                function filterEmployees() {
                    const searchTerm = document.getElementById('employee-search').value.toLowerCase();
                    const deptFilter = document.getElementById('department-filter').value;
                    
                    document.querySelectorAll('.employee-card').forEach(card => {
                        const name = card.querySelector('.employee-name').textContent.toLowerCase();
                        const title = card.querySelector('.employee-title').textContent.toLowerCase();
                        const dept = card.querySelector('.employee-department').textContent;
                        const email = card.querySelector('.employee-email')?.title?.toLowerCase() || '';
                        
                        const matchesSearch = !searchTerm || 
                            name.includes(searchTerm) || 
                            title.includes(searchTerm) || 
                            email.includes(searchTerm);
                        
                        const matchesDept = !deptFilter || dept === deptFilter;
                        
                        card.style.display = (matchesSearch && matchesDept) ? '' : 'none';
                    });
                }
                
                function openDetailsPanel(card) {
                    const name = card.querySelector('.employee-name').textContent;
                    const title = card.querySelector('.employee-title').textContent;
                    const dept = card.querySelector('.employee-department').textContent;
                    const initials = card.querySelector('.avatar-initials').textContent;
                    const emailLink = card.querySelector('.employee-email');
                    const email = emailLink ? emailLink.title : '';
                    const bio = card.dataset.bio || '';
                    const photo = card.dataset.photo || '';
                    const deskPhone = card.dataset.deskPhone || '';
                    const cellPhone = card.dataset.cellPhone || '';
                    const building = card.dataset.building || '';
                    const floor = card.dataset.floor || '';
                    const locator = card.dataset.locator || '';
                    const spaceType = card.dataset.spaceType || '';
                    
                    document.getElementById('panel-name').textContent = name;
                    document.getElementById('panel-title').textContent = title;
                    document.getElementById('panel-department').textContent = dept;
                    document.getElementById('panel-building').textContent = building;
                    document.getElementById('panel-floor').textContent = floor;
                    document.getElementById('panel-locator').textContent = locator + (spaceType ? ' (' + spaceType + ')' : '');
                    document.getElementById('panel-initials').textContent = initials;
                    document.getElementById('panel-email').textContent = email;
                    document.getElementById('panel-email').href = 'mailto:' + email;
                    
                    // Handle desk phone
                    const deskRow = document.getElementById('panel-desk-row');
                    if (deskPhone) {
                        document.getElementById('panel-desk-phone').textContent = deskPhone;
                        document.getElementById('panel-desk-phone').href = 'tel:' + deskPhone;
                        deskRow.style.display = '';
                    } else {
                        deskRow.style.display = 'none';
                    }
                    
                    // Handle cell phone
                    const cellRow = document.getElementById('panel-cell-row');
                    if (cellPhone) {
                        document.getElementById('panel-cell-phone').textContent = cellPhone;
                        document.getElementById('panel-cell-phone').href = 'tel:' + cellPhone;
                        cellRow.style.display = '';
                    } else {
                        cellRow.style.display = 'none';
                    }
                    
                    // Handle bio
                    const bioSection = document.getElementById('panel-bio-section');
                    if (bio) {
                        document.getElementById('panel-bio').textContent = bio;
                        bioSection.style.display = 'block';
                    } else {
                        bioSection.style.display = 'none';
                    }
                    
                    // Handle photo in panel - photo is now the full API URL
                    const avatar = document.getElementById('panel-avatar');
                    if (photo && photo.startsWith('/api/')) {
                        avatar.style.backgroundImage = 'url(' + photo + ')';
                        avatar.classList.add('has-photo');
                    } else {
                        avatar.style.backgroundImage = '';
                        avatar.classList.remove('has-photo');
                    }
                    
                    document.getElementById('details-panel').classList.add('open');
                    document.getElementById('panel-overlay').classList.add('open');
                }
                
                function closeDetailsPanel() {
                    document.getElementById('details-panel').classList.remove('open');
                    document.getElementById('panel-overlay').classList.remove('open');
                }
                
                document.addEventListener('DOMContentLoaded', function() {
                    document.querySelectorAll('.employee-card').forEach(card => {
                        card.addEventListener('click', function(e) {
                            if (!e.target.closest('.employee-email')) {
                                openDetailsPanel(this);
                            }
                        });
                    });
                    
                    document.addEventListener('keydown', function(e) {
                        if (e.key === 'Escape') closeDetailsPanel();
                    });
                });
            "#}</script>
        </div>
    }
}

/// Org chart placeholder
#[component]
pub fn PersonnelModuleOrgChart(#[allow(unused)] people: Vec<Person>) -> impl IntoView {
    view! {
        <div class="personnel-module">
            <p>"Org chart coming soon."</p>
            <a href="/?tab=personnel">"← Back to Directory"</a>
        </div>
    }
}

/// Employee card component with photo support
#[component]
fn EmployeeCard(
    person: Person,
    building: String,
    floor: String,
    locator: String,
    space_type: String,
) -> impl IntoView {
    let initials = person
        .name
        .split_whitespace()
        .filter_map(|w| w.chars().next())
        .take(2)
        .collect::<String>();

    // Check if photo data is available (either photo filename or photo_data in DB)
    let has_photo = person.photo.is_some() || person.photo_data.is_some();

    // Use API endpoint for photo - extract ID from Thing
    let person_id = person
        .id
        .as_ref()
        .map(|t| t.id.to_raw())
        .unwrap_or_default();
    let photo_url = format!("/api/people/{}/photo", person_id);

    let bio = person.bio.clone().unwrap_or_default();
    let desk_phone = person.desk_phone.clone().unwrap_or_default();
    let cell_phone = person.cell_phone.clone().unwrap_or_default();

    let avatar_style = if has_photo {
        format!("background-image: url('{}')", photo_url)
    } else {
        String::new()
    };

    let avatar_class = if has_photo {
        "employee-avatar has-photo"
    } else {
        "employee-avatar"
    };

    view! {
        <div class="employee-card" data-bio=bio data-photo=photo_url.clone() data-desk-phone=desk_phone data-cell-phone=cell_phone data-building=building data-floor=floor data-locator=locator data-space-type=space_type>
            <div class=avatar_class style=avatar_style>
                <span class="avatar-initials">{initials}</span>
            </div>
            <div class="employee-info">
                <h3 class="employee-name">{person.name.clone()}</h3>
                <p class="employee-title">{person.title.clone()}</p>
                <p class="employee-department">{person.department.clone()}</p>
            </div>
            <a href=format!("mailto:{}", person.email) class="employee-email" title=person.email.clone()>
                "📧"
            </a>
        </div>
    }
}
