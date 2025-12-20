-- ============================================================================
-- 010_infrastructure.sql - Infrastructure, Components, Assets
-- ============================================================================
-- Source: infrastructure.toml, components.toml, assets.toml

CREATE TABLE IF NOT EXISTS infrastructure_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    description TEXT
);

CREATE TABLE IF NOT EXISTS components (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    component_type TEXT,
    manufacturer TEXT,
    model TEXT,
    description TEXT
);

CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    component_id TEXT REFERENCES components(id),
    serial_number TEXT,
    location_space TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'maintenance', 'retired')),
    ip_address TEXT,
    mac_address TEXT,
    installed_date TEXT,
    warranty_end TEXT
);

-- ============================================================================
-- Infrastructure Types
-- ============================================================================

INSERT INTO infrastructure_types (id, name, category, description) VALUES
('infra-network', 'Network Infrastructure', 'IT', 'Switches, routers, firewalls, and network equipment');

INSERT INTO infrastructure_types (id, name, category, description) VALUES
('infra-compute', 'Compute Infrastructure', 'IT', 'Servers, virtual machines, and compute resources');

INSERT INTO infrastructure_types (id, name, category, description) VALUES
('infra-storage', 'Storage Infrastructure', 'IT', 'SAN, NAS, and storage systems');

INSERT INTO infrastructure_types (id, name, category, description) VALUES
('infra-security', 'Security Infrastructure', 'IT', 'Cameras, access control, and security systems');

-- ============================================================================
-- Sample Components
-- ============================================================================

INSERT INTO components (id, name, component_type, manufacturer, model, description) VALUES
('comp-switch-core', 'Core Network Switch', 'network-switch', 'Cisco', 'Catalyst 9300', '48-port core switch for data center');

INSERT INTO components (id, name, component_type, manufacturer, model, description) VALUES
('comp-firewall', 'Enterprise Firewall', 'firewall', 'Palo Alto', 'PA-3260', 'Next-gen firewall for perimeter security');

INSERT INTO components (id, name, component_type, manufacturer, model, description) VALUES
('comp-server-app', 'Application Server', 'server', 'Dell', 'PowerEdge R750', 'Primary application server');

INSERT INTO components (id, name, component_type, manufacturer, model, description) VALUES
('comp-ap-wifi', 'Wireless Access Point', 'access-point', 'Cisco', 'Meraki MR46', 'Enterprise WiFi 6 access point');

-- ============================================================================
-- Sample Assets
-- ============================================================================

INSERT INTO assets (id, name, component_id, serial_number, location_space, status, ip_address, installed_date) VALUES
('asset-core-sw-01', 'HQ-CORE-SW-01', 'comp-switch-core', 'FCW2145H0AB', 'B01', 'active', '10.1.1.1', '2023-06-15');

INSERT INTO assets (id, name, component_id, serial_number, location_space, status, ip_address, installed_date) VALUES
('asset-fw-01', 'HQ-FW-01', 'comp-firewall', 'PA3260-001234', 'B01', 'active', '10.1.1.254', '2023-06-15');

INSERT INTO assets (id, name, component_id, serial_number, location_space, status, ip_address, installed_date) VALUES
('asset-app-01', 'HQ-APP-01', 'comp-server-app', 'DELL-PE750-0001', 'B01', 'active', '10.1.10.10', '2024-01-10');
