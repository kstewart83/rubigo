//! Assets Module
//!
//! Network infrastructure asset management with search, filter, and CRUD operations.

use leptos::prelude::*;
use leptos::IntoView;
use nexosim_hybrid::database::geo::{AssetCategory, AssetStatus, NetworkAsset, Rack, Space};
use std::collections::HashMap;

/// Assets module main component
#[component]
pub fn AssetsModule(
    assets: Vec<NetworkAsset>,
    racks: Vec<Rack>,
    spaces: Vec<Space>,
) -> impl IntoView {
    // Build lookups for location resolution
    let rack_map: HashMap<String, Rack> = racks
        .into_iter()
        .filter_map(|r| {
            let id = r.id.as_ref()?.to_string();
            Some((id, r))
        })
        .collect();

    let space_map: HashMap<String, Space> = spaces
        .into_iter()
        .filter_map(|s| {
            let id = s.id.as_ref()?.to_string();
            Some((id, s))
        })
        .collect();

    // Get unique categories and statuses for filters
    let categories: Vec<String> = {
        let mut cats: Vec<String> = assets.iter().map(|a| a.category.to_string()).collect();
        cats.sort();
        cats.dedup();
        cats
    };

    let statuses: Vec<String> = {
        let mut stats: Vec<String> = assets.iter().map(|a| a.status.to_string()).collect();
        stats.sort();
        stats.dedup();
        stats
    };

    // Count by category
    let network_count = assets
        .iter()
        .filter(|a| matches!(a.category, AssetCategory::Network))
        .count();
    let server_count = assets
        .iter()
        .filter(|a| matches!(a.category, AssetCategory::Server))
        .count();
    let storage_count = assets
        .iter()
        .filter(|a| matches!(a.category, AssetCategory::Storage))
        .count();
    let endpoint_count = assets
        .iter()
        .filter(|a| matches!(a.category, AssetCategory::Endpoint))
        .count();

    view! {
        <div class="assets-module">
            <div class="assets-header">
                <h1 class="assets-title">"📦 Network Assets"</h1>
                <div class="assets-stats">
                    <span class="stat-item stat-network">{network_count}" Network"</span>
                    <span class="stat-item stat-server">{server_count}" Server"</span>
                    <span class="stat-item stat-storage">{storage_count}" Storage"</span>
                    <span class="stat-item stat-endpoint">{endpoint_count}" Endpoint"</span>
                    <span class="stat-item stat-total">{assets.len()}" Total"</span>
                </div>
            </div>

            <div class="assets-toolbar">
                <div class="filter-group">
                    <input
                        type="text"
                        placeholder="Search by name, model, serial, or MAC..."
                        class="search-input"
                        id="asset-search"
                        oninput="filterAssets()"
                    />
                </div>
                <div class="filter-group">
                    <select class="category-filter" id="category-filter" onchange="filterAssets()">
                        <option value="">"All Categories"</option>
                        {categories.iter().map(|cat| {
                            view! { <option value=cat.clone()>{cat.clone()}</option> }
                        }).collect_view()}
                    </select>
                </div>
                <div class="filter-group">
                    <select class="status-filter" id="status-filter" onchange="filterAssets()">
                        <option value="">"All Statuses"</option>
                        {statuses.iter().map(|status| {
                            view! { <option value=status.clone()>{status.clone()}</option> }
                        }).collect_view()}
                    </select>
                </div>
                <div class="filter-group">
                    <a href="/?tab=assets&action=create" class="btn btn-primary">"+ Add Asset"</a>
                </div>
            </div>

            <div class="assets-table-container">
                <table class="assets-table" id="assets-table">
                    <thead>
                        <tr>
                            <th data-sort="name">"Name"</th>
                            <th data-sort="category">"Category"</th>
                            <th data-sort="manufacturer">"Manufacturer"</th>
                            <th data-sort="model">"Model"</th>
                            <th data-sort="serial">"Serial"</th>
                            <th data-sort="status">"Status"</th>
                            <th data-sort="location">"Location"</th>
                            <th>"Actions"</th>
                        </tr>
                    </thead>
                    <tbody id="assets-tbody">
                        {assets.iter().map(|asset| {
                            let location = if let Some(rack_id) = &asset.rack_id {
                                let rack_name = rack_map.get(&rack_id.to_string())
                                    .map(|r| r.name.clone())
                                    .unwrap_or_else(|| "Unknown Rack".to_string());
                                let position = asset.position_u.unwrap_or(0);
                                let height = asset.height_u.unwrap_or(1);
                                if height > 1 {
                                    format!("{} U{}-{}", rack_name, position, position + height - 1)
                                } else {
                                    format!("{} U{}", rack_name, position)
                                }
                            } else if let Some(space_id) = &asset.space_id {
                                let space_name = space_map.get(&space_id.to_string())
                                    .map(|s| s.name.clone())
                                    .unwrap_or_else(|| "Unknown Space".to_string());
                                if let Some(loc) = &asset.storage_location {
                                    format!("{} - {}", space_name, loc)
                                } else {
                                    space_name
                                }
                            } else {
                                "Unassigned".to_string()
                            };

                            let location_display = location.clone();

                            let category_class = match asset.category {
                                AssetCategory::Network => "category-network",
                                AssetCategory::Server => "category-server",
                                AssetCategory::Storage => "category-storage",
                                AssetCategory::Endpoint => "category-endpoint",
                            };

                            let status_class = match asset.status {
                                AssetStatus::Storage => "status-storage",
                                AssetStatus::InstalledActive => "status-active",
                                AssetStatus::InstalledInactive => "status-inactive",
                            };

                            let asset_id = asset.id.as_ref()
                                .map(|t| t.id.to_raw())
                                .unwrap_or_default();

                            view! {
                                <tr class="asset-row"
                                    data-name=asset.name.clone()
                                    data-category=asset.category.to_string()
                                    data-status=asset.status.to_string()
                                    data-model=asset.model.clone()
                                    data-serial=asset.serial_number.clone()
                                    data-mac=asset.mac_address.clone().unwrap_or_default()
                                    data-manufacturer=asset.manufacturer.clone()
                                    data-location=location
                                    data-notes=asset.notes.clone().unwrap_or_default()
                                    data-id=asset_id.clone()
                                >
                                    <td class="asset-name">{asset.name.clone()}</td>
                                    <td><span class={format!("category-badge {}", category_class)}>{asset.category.to_string()}</span></td>
                                    <td class="asset-manufacturer">{asset.manufacturer.clone()}</td>
                                    <td class="asset-model">{asset.model.clone()}</td>
                                    <td class="asset-serial"><code>{asset.serial_number.clone()}</code></td>
                                    <td><span class={format!("status-badge {}", status_class)}>{asset.status.to_string()}</span></td>
                                    <td class="asset-location">{location_display}</td>
                                    <td class="asset-actions">
                                        <button class="btn btn-sm btn-view" onclick="openAssetDetails(this.closest('tr'))">"View"</button>
                                        <a href={format!("/?tab=assets&action=edit&id={}", asset_id)} class="btn btn-sm btn-edit">"Edit"</a>
                                    </td>
                                </tr>
                            }
                        }).collect_view()}
                    </tbody>
                </table>

                // Empty state (hidden by default)
                <div class="assets-empty" id="assets-empty" style="display: none;">
                    <div class="assets-empty-icon">"🔍"</div>
                    <h3>"No assets found"</h3>
                    <p>"Try adjusting your search or filter criteria"</p>
                </div>
            </div>

            // Pagination controls
            <div class="assets-pagination" id="assets-pagination">
                <div class="pagination-info">
                    "Showing "<strong id="pagination-start">"1"</strong>"-"<strong id="pagination-end">"10"</strong>" of "<strong id="pagination-total">{assets.len()}</strong>" assets"
                </div>
                <div class="pagination-controls">
                    <select class="page-size-select" id="page-size" onchange="changePageSize()">
                        <option value="10">"10 per page"</option>
                        <option value="25">"25 per page"</option>
                        <option value="50">"50 per page"</option>
                        <option value="100">"100 per page"</option>
                    </select>
                    <button class="pagination-btn" id="prev-page" onclick="prevPage()" disabled>"◀"</button>
                    <div class="pagination-pages" id="pagination-pages">
                        // Page buttons generated by JS
                    </div>
                    <button class="pagination-btn" id="next-page" onclick="nextPage()">"▶"</button>
                </div>
            </div>

            // Details panel (slide-out)
            <div class="panel-overlay" id="asset-panel-overlay" onclick="closeAssetDetails()"></div>
            <aside class="details-panel" id="asset-details-panel">
                <div class="panel-header">
                    <button class="panel-close" onclick="closeAssetDetails()">"×"</button>
                    <div class="panel-icon" id="asset-panel-icon">"📦"</div>
                    <h2 class="panel-name" id="asset-panel-name"></h2>
                    <p class="panel-subtitle" id="asset-panel-model"></p>
                </div>
                <div class="panel-content">
                    <div class="detail-section">
                        <h3>"Identification"</h3>
                        <div class="detail-row">
                            <span class="detail-label">"Category"</span>
                            <span class="detail-value" id="asset-panel-category"></span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">"Manufacturer"</span>
                            <span class="detail-value" id="asset-panel-manufacturer"></span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">"Model"</span>
                            <span class="detail-value" id="asset-panel-model-detail"></span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">"Serial Number"</span>
                            <span class="detail-value" id="asset-panel-serial"></span>
                        </div>
                        <div class="detail-row" id="asset-panel-mac-row">
                            <span class="detail-label">"MAC Address"</span>
                            <span class="detail-value" id="asset-panel-mac"></span>
                        </div>
                    </div>
                    <div class="detail-section">
                        <h3>"Status & Location"</h3>
                        <div class="detail-row">
                            <span class="detail-label">"Status"</span>
                            <span class="detail-value" id="asset-panel-status"></span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">"Location"</span>
                            <span class="detail-value" id="asset-panel-location"></span>
                        </div>
                    </div>
                    <div class="detail-section" id="asset-panel-notes-section" style="display:none">
                        <h3>"Notes"</h3>
                        <p class="notes-text" id="asset-panel-notes"></p>
                    </div>
                    <div class="panel-actions">
                        <a href="#" id="asset-panel-edit-link" class="btn btn-primary">"Edit Asset"</a>
                        <button class="btn btn-danger" id="asset-panel-delete" onclick="confirmDeleteAsset()">"Delete"</button>
                    </div>
                </div>
            </aside>

            <script>{r#"
                // Pagination state
                let currentPage = 1;
                let pageSize = 10;
                let filteredRows = [];
                let sortColumn = null;
                let sortDirection = 'asc';

                // Get all rows and apply filtering
                function getFilteredRows() {
                    const searchTerm = document.getElementById('asset-search').value.toLowerCase();
                    const categoryFilter = document.getElementById('category-filter').value;
                    const statusFilter = document.getElementById('status-filter').value;

                    const allRows = Array.from(document.querySelectorAll('.asset-row'));

                    return allRows.filter(row => {
                        const name = row.dataset.name.toLowerCase();
                        const model = row.dataset.model.toLowerCase();
                        const serial = row.dataset.serial.toLowerCase();
                        const mac = row.dataset.mac.toLowerCase();
                        const manufacturer = row.dataset.manufacturer.toLowerCase();
                        const category = row.dataset.category;
                        const status = row.dataset.status;

                        const matchesSearch = !searchTerm ||
                            name.includes(searchTerm) ||
                            model.includes(searchTerm) ||
                            serial.includes(searchTerm) ||
                            mac.includes(searchTerm) ||
                            manufacturer.includes(searchTerm);

                        const matchesCategory = !categoryFilter || category === categoryFilter;
                        const matchesStatus = !statusFilter || status === statusFilter;

                        return matchesSearch && matchesCategory && matchesStatus;
                    });
                }

                // Sort rows by column
                function sortRows(rows, column, direction) {
                    return rows.sort((a, b) => {
                        const aVal = (a.dataset[column] || '').toLowerCase();
                        const bVal = (b.dataset[column] || '').toLowerCase();
                        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
                        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
                        return 0;
                    });
                }

                // Update display
                function updateDisplay() {
                    filteredRows = getFilteredRows();

                    // Apply sorting if set
                    if (sortColumn) {
                        filteredRows = sortRows(filteredRows, sortColumn, sortDirection);
                    }

                    const totalRows = filteredRows.length;
                    const totalPages = Math.ceil(totalRows / pageSize);

                    // Clamp current page
                    if (currentPage > totalPages) currentPage = Math.max(1, totalPages);

                    const start = (currentPage - 1) * pageSize;
                    const end = Math.min(start + pageSize, totalRows);

                    // Hide all rows first
                    document.querySelectorAll('.asset-row').forEach(row => {
                        row.style.display = 'none';
                    });

                    // Show only rows for current page
                    for (let i = start; i < end; i++) {
                        filteredRows[i].style.display = '';
                    }

                    // Update pagination info
                    document.getElementById('pagination-start').textContent = totalRows > 0 ? start + 1 : 0;
                    document.getElementById('pagination-end').textContent = end;
                    document.getElementById('pagination-total').textContent = totalRows;

                    // Update pagination buttons
                    document.getElementById('prev-page').disabled = currentPage <= 1;
                    document.getElementById('next-page').disabled = currentPage >= totalPages;

                    // Generate page buttons
                    const pagesContainer = document.getElementById('pagination-pages');
                    pagesContainer.innerHTML = '';

                    const maxButtons = 5;
                    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
                    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
                    if (endPage - startPage < maxButtons - 1) {
                        startPage = Math.max(1, endPage - maxButtons + 1);
                    }

                    for (let i = startPage; i <= endPage; i++) {
                        const btn = document.createElement('button');
                        btn.className = 'page-btn' + (i === currentPage ? ' active' : '');
                        btn.textContent = i;
                        btn.onclick = () => goToPage(i);
                        pagesContainer.appendChild(btn);
                    }

                    // Show/hide empty state
                    const emptyState = document.getElementById('assets-empty');
                    const table = document.getElementById('assets-table');
                    if (totalRows === 0) {
                        emptyState.style.display = 'flex';
                        table.style.display = 'none';
                    } else {
                        emptyState.style.display = 'none';
                        table.style.display = '';
                    }

                    // Update filter indicators
                    const searchInput = document.getElementById('asset-search');
                    const categorySelect = document.getElementById('category-filter');
                    const statusSelect = document.getElementById('status-filter');

                    searchInput.parentElement.classList.toggle('filter-active', searchInput.value.length > 0);
                    categorySelect.parentElement.classList.toggle('filter-active', categorySelect.value !== '');
                    statusSelect.parentElement.classList.toggle('filter-active', statusSelect.value !== '');
                }

                function filterAssets() {
                    currentPage = 1; // Reset to first page on filter change
                    updateDisplay();
                }

                function changePageSize() {
                    pageSize = parseInt(document.getElementById('page-size').value);
                    currentPage = 1;
                    updateDisplay();
                }

                function goToPage(page) {
                    currentPage = page;
                    updateDisplay();
                }

                function prevPage() {
                    if (currentPage > 1) {
                        currentPage--;
                        updateDisplay();
                    }
                }

                function nextPage() {
                    const totalPages = Math.ceil(filteredRows.length / pageSize);
                    if (currentPage < totalPages) {
                        currentPage++;
                        updateDisplay();
                    }
                }

                // Column sorting
                function handleSort(column) {
                    if (sortColumn === column) {
                        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                    } else {
                        sortColumn = column;
                        sortDirection = 'asc';
                    }

                    // Update header classes
                    document.querySelectorAll('.assets-table th').forEach(th => {
                        th.classList.remove('sort-asc', 'sort-desc');
                        if (th.dataset.sort === column) {
                            th.classList.add(sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
                        }
                    });

                    updateDisplay();
                }

                function openAssetDetails(row) {
                    const name = row.dataset.name;
                    const category = row.dataset.category;
                    const manufacturer = row.dataset.manufacturer;
                    const model = row.dataset.model;
                    const serial = row.dataset.serial;
                    const mac = row.dataset.mac;
                    const status = row.dataset.status;
                    const location = row.dataset.location;
                    const notes = row.dataset.notes;
                    const id = row.dataset.id;

                    document.getElementById('asset-panel-name').textContent = name;
                    document.getElementById('asset-panel-model').textContent = manufacturer + ' ' + model;
                    document.getElementById('asset-panel-category').textContent = category;
                    document.getElementById('asset-panel-manufacturer').textContent = manufacturer;
                    document.getElementById('asset-panel-model-detail').textContent = model;
                    document.getElementById('asset-panel-serial').textContent = serial;
                    document.getElementById('asset-panel-status').textContent = status;
                    document.getElementById('asset-panel-location').textContent = location;
                    document.getElementById('asset-panel-edit-link').href = '/?tab=assets&action=edit&id=' + id;

                    // MAC address
                    const macRow = document.getElementById('asset-panel-mac-row');
                    if (mac) {
                        document.getElementById('asset-panel-mac').textContent = mac;
                        macRow.style.display = '';
                    } else {
                        macRow.style.display = 'none';
                    }

                    // Notes
                    const notesSection = document.getElementById('asset-panel-notes-section');
                    if (notes) {
                        document.getElementById('asset-panel-notes').textContent = notes;
                        notesSection.style.display = 'block';
                    } else {
                        notesSection.style.display = 'none';
                    }

                    // Icon based on category
                    const icon = document.getElementById('asset-panel-icon');
                    switch(category) {
                        case 'Network': icon.textContent = '🌐'; break;
                        case 'Server': icon.textContent = '🖥️'; break;
                        case 'Storage': icon.textContent = '💾'; break;
                        case 'Endpoint': icon.textContent = '💻'; break;
                        default: icon.textContent = '📦';
                    }

                    document.getElementById('asset-details-panel').classList.add('open');
                    document.getElementById('asset-panel-overlay').classList.add('open');
                }

                function closeAssetDetails() {
                    document.getElementById('asset-details-panel').classList.remove('open');
                    document.getElementById('asset-panel-overlay').classList.remove('open');
                }

                function confirmDeleteAsset() {
                    if (confirm('Are you sure you want to delete this asset?')) {
                        // TODO: Implement delete via form POST
                        alert('Delete not yet implemented');
                    }
                }

                document.addEventListener('DOMContentLoaded', function() {
                    // Initialize pagination
                    updateDisplay();

                    // Double-click to open details
                    document.querySelectorAll('.asset-row').forEach(row => {
                        row.addEventListener('dblclick', function() {
                            openAssetDetails(this);
                        });
                    });

                    // Column sorting
                    document.querySelectorAll('.assets-table th[data-sort]').forEach(th => {
                        th.addEventListener('click', function() {
                            handleSort(this.dataset.sort);
                        });
                    });

                    // Escape to close panel
                    document.addEventListener('keydown', function(e) {
                        if (e.key === 'Escape') closeAssetDetails();
                    });
                });
            "#}</script>
        </div>
    }
}

/// Asset create/edit form component
#[component]
pub fn AssetForm(
    asset: Option<NetworkAsset>,
    racks: Vec<Rack>,
    spaces: Vec<Space>,
) -> impl IntoView {
    let is_edit = asset.is_some();
    let title = if is_edit {
        "Edit Asset"
    } else {
        "Create Asset"
    };
    let action = if is_edit {
        "/assets/update"
    } else {
        "/assets/create"
    };

    let asset = asset.unwrap_or(NetworkAsset {
        id: None,
        name: String::new(),
        asset_tag: None,
        category: AssetCategory::Network,
        manufacturer: String::new(),
        model: String::new(),
        serial_number: String::new(),
        mac_address: None,
        status: AssetStatus::Storage,
        rack_id: None,
        position_u: None,
        height_u: Some(1),
        space_id: None,
        storage_location: None,
        notes: None,
    });

    let asset_id = asset.id.as_ref().map(|t| t.id.to_raw()).unwrap_or_default();

    view! {
        <div class="assets-module">
            <div class="form-header">
                <a href="/?tab=assets" class="back-link">"← Back to Assets"</a>
                <h1>{title}</h1>
            </div>

            <form action=action method="POST" class="asset-form">
                {if is_edit {
                    view! { <input type="hidden" name="id" value=asset_id /> }.into_any()
                } else {
                    view! { <span></span> }.into_any()
                }}

                <div class="form-section">
                    <h3>"Basic Information"</h3>
                    <div class="form-row">
                        <label for="name">"Asset Name"</label>
                        <input type="text" id="name" name="name" value=asset.name.clone() required=true />
                    </div>
                    <div class="form-row">
                        <label for="asset_tag">"Asset Tag"</label>
                        <input type="text" id="asset_tag" name="asset_tag" value=asset.asset_tag.clone().unwrap_or_default() />
                    </div>
                    <div class="form-row">
                        <label for="category">"Category"</label>
                        <select id="category" name="category">
                            <option value="Network" selected={matches!(asset.category, AssetCategory::Network)}>"Network"</option>
                            <option value="Server" selected={matches!(asset.category, AssetCategory::Server)}>"Server"</option>
                            <option value="Storage" selected={matches!(asset.category, AssetCategory::Storage)}>"Storage"</option>
                            <option value="Endpoint" selected={matches!(asset.category, AssetCategory::Endpoint)}>"Endpoint"</option>
                        </select>
                    </div>
                </div>

                <div class="form-section">
                    <h3>"Hardware Details"</h3>
                    <div class="form-row">
                        <label for="manufacturer">"Manufacturer"</label>
                        <input type="text" id="manufacturer" name="manufacturer" value=asset.manufacturer.clone() required=true />
                    </div>
                    <div class="form-row">
                        <label for="model">"Model"</label>
                        <input type="text" id="model" name="model" value=asset.model.clone() required=true />
                    </div>
                    <div class="form-row">
                        <label for="serial_number">"Serial Number"</label>
                        <input type="text" id="serial_number" name="serial_number" value=asset.serial_number.clone() required=true />
                    </div>
                    <div class="form-row">
                        <label for="mac_address">"MAC Address"</label>
                        <input type="text" id="mac_address" name="mac_address" value=asset.mac_address.clone().unwrap_or_default() placeholder="00:00:00:00:00:00" />
                    </div>
                </div>

                <div class="form-section">
                    <h3>"Status & Location"</h3>
                    <div class="form-row">
                        <label for="status">"Status"</label>
                        <select id="status" name="status">
                            <option value="storage" selected={matches!(asset.status, AssetStatus::Storage)}>"Storage"</option>
                            <option value="installed:active" selected={matches!(asset.status, AssetStatus::InstalledActive)}>"Installed (Active)"</option>
                            <option value="installed:inactive" selected={matches!(asset.status, AssetStatus::InstalledInactive)}>"Installed (Inactive)"</option>
                        </select>
                    </div>
                    <div class="form-row">
                        <label for="rack">"Rack (for racked equipment)"</label>
                        <select id="rack" name="rack">
                            <option value="">"-- Not Racked --"</option>
                            {racks.iter().map(|r| {
                                let rack_id = r.id.as_ref().map(|t| t.to_string()).unwrap_or_default();
                                let is_selected = asset.rack_id.as_ref().map(|id| id.to_string() == rack_id).unwrap_or(false);
                                view! { <option value=r.name.clone() selected=is_selected>{r.name.clone()}" ("{r.height_u}"U)"</option> }
                            }).collect_view()}
                        </select>
                    </div>
                    <div class="form-row">
                        <label for="position_u">"Rack Position (U)"</label>
                        <input type="number" id="position_u" name="position_u" min="1" max="48" value=asset.position_u.unwrap_or(1).to_string() />
                    </div>
                    <div class="form-row">
                        <label for="height_u">"Height (U)"</label>
                        <input type="number" id="height_u" name="height_u" min="1" max="48" value=asset.height_u.unwrap_or(1).to_string() />
                    </div>
                    <div class="form-row">
                        <label for="space">"Space (for non-racked equipment)"</label>
                        <select id="space" name="space">
                            <option value="">"-- Select Space --"</option>
                            {spaces.iter().map(|s| {
                                let space_id = s.id.as_ref().map(|t| t.to_string()).unwrap_or_default();
                                let is_selected = asset.space_id.as_ref().map(|id| id.to_string() == space_id).unwrap_or(false);
                                view! { <option value=s.name.clone() selected=is_selected>{s.name.clone()}</option> }
                            }).collect_view()}
                        </select>
                    </div>
                    <div class="form-row">
                        <label for="storage_location">"Storage Location (description)"</label>
                        <input type="text" id="storage_location" name="storage_location" value=asset.storage_location.clone().unwrap_or_default() placeholder="e.g., Shelf A, Ceiling mount" />
                    </div>
                </div>

                <div class="form-section">
                    <h3>"Notes"</h3>
                    <div class="form-row">
                        <textarea id="notes" name="notes" rows="4">{asset.notes.clone().unwrap_or_default()}</textarea>
                    </div>
                </div>

                <div class="form-actions">
                    <a href="/?tab=assets" class="btn btn-secondary">"Cancel"</a>
                    <button type="submit" class="btn btn-primary">{if is_edit { "Update Asset" } else { "Create Asset" }}</button>
                </div>
            </form>
        </div>
    }
}
