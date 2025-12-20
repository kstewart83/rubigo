-- ============================================================================
-- 010_infrastructure.sql - IT Infrastructure, Components, and Assets
-- ============================================================================
-- Full data extracted from infrastructure.toml, components.toml, assets.toml

-- ============================================================================
-- SCHEMA
-- ============================================================================

CREATE TABLE IF NOT EXISTS infrastructure_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT
);

-- Physical infrastructure (racks, desks)
CREATE TABLE IF NOT EXISTS infrastructure (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('rack', 'desk')),
    space TEXT,
    capacity INTEGER,
    assigned_to TEXT
);

-- Network components (routers, switches, servers, workstations, etc.)
CREATE TABLE IF NOT EXISTS components (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    placement_type TEXT CHECK(placement_type IN ('Rack', 'Desk', 'Standalone')),
    rack_id TEXT,
    desk_id TEXT,
    u_position INTEGER,
    status TEXT DEFAULT 'active'
);

-- Physical network assets (switches, servers, etc.)
CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    manufacturer TEXT,
    model TEXT,
    serial_number TEXT UNIQUE,
    mac_address TEXT,
    status TEXT DEFAULT 'active',
    rack TEXT,
    position_u INTEGER,
    height_u INTEGER,
    space TEXT,
    storage_location TEXT,
    notes TEXT
);

-- Component connections (network topology)
CREATE TABLE IF NOT EXISTS component_connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_component_id TEXT NOT NULL REFERENCES components(id),
    to_component_id TEXT NOT NULL REFERENCES components(id),
    UNIQUE(from_component_id, to_component_id)
);

-- ============================================================================
-- DATA: Infrastructure Types
-- ============================================================================

INSERT INTO infrastructure_types (id, name, description) VALUES 
('rack', 'Server Rack', 'Standard 42U or smaller server rack'),
('desk', 'Workstation Desk', 'Office workstation location'),
('idf', 'IDF Closet', 'Intermediate Distribution Frame closet'),
('mdf', 'MDF Room', 'Main Distribution Frame room');

-- ============================================================================
-- DATA: Infrastructure (Racks & Desks from infrastructure.toml)
-- ============================================================================

-- Racks
INSERT INTO infrastructure (id, name, type, space, capacity) VALUES ('rack-001', 'DC-Rack-A1', 'rack', 'Data Center', 42);
INSERT INTO infrastructure (id, name, type, space, capacity) VALUES ('rack-002', 'DC-Rack-A2', 'rack', 'Data Center', 42);
INSERT INTO infrastructure (id, name, type, space, capacity) VALUES ('rack-003', 'DC-Rack-B1', 'rack', 'Data Center', 42);
INSERT INTO infrastructure (id, name, type, space, capacity) VALUES ('rack-004', 'IDF-HQ-B1', 'rack', 'Network Closet B1', 24);
INSERT INTO infrastructure (id, name, type, space, capacity) VALUES ('rack-005', 'IDF-Indy', 'rack', 'Indy Network Closet', 12);
INSERT INTO infrastructure (id, name, type, space, capacity) VALUES ('rack-006', 'IDF-Detroit', 'rack', 'Detroit Network Closet', 12);
INSERT INTO infrastructure (id, name, type, space, capacity) VALUES ('rack-007', 'IDF-Pittsburgh', 'rack', 'Pittsburgh Network Closet', 12);

-- Desks
INSERT INTO infrastructure (id, name, type, space, assigned_to) VALUES ('desk-001', 'IT-Desk-1', 'desk', 'IT Help Desk', 'Mike Chen');
INSERT INTO infrastructure (id, name, type, space, assigned_to) VALUES ('desk-002', 'IT-Desk-2', 'desk', 'IT Help Desk', 'Sarah Kim');
INSERT INTO infrastructure (id, name, type, space, assigned_to) VALUES ('desk-003', 'HR-Desk-1', 'desk', 'HR Suite', 'Patricia Martinez');
INSERT INTO infrastructure (id, name, type, space, assigned_to) VALUES ('desk-004', 'HR-Desk-2', 'desk', 'HR Suite', 'James Wilson');
INSERT INTO infrastructure (id, name, type, space, assigned_to) VALUES ('desk-005', 'ENG-Desk-1', 'desk', 'Engineering Open Plan', 'David Park');
INSERT INTO infrastructure (id, name, type, space, assigned_to) VALUES ('desk-006', 'ENG-Desk-2', 'desk', 'Engineering Open Plan', 'Jennifer Adams');
INSERT INTO infrastructure (id, name, type, space, assigned_to) VALUES ('desk-007', 'ENG-Desk-3', 'desk', 'Engineering Open Plan', 'Robert Thompson');
INSERT INTO infrastructure (id, name, type, space, assigned_to) VALUES ('desk-008', 'CAD-Desk-1', 'desk', 'CAD Lab', 'Lisa Chen');
INSERT INTO infrastructure (id, name, type, space, assigned_to) VALUES ('desk-009', 'CEO-Desk', 'desk', 'Executive Suite', 'Thomas Anderson');
INSERT INTO infrastructure (id, name, type, space, assigned_to) VALUES ('desk-010', 'CFO-Desk', 'desk', 'Executive Suite', 'Margaret Sullivan');
INSERT INTO infrastructure (id, name, type, space, assigned_to) VALUES ('desk-011', 'CTO-Desk', 'desk', 'Executive Suite', 'Richard Nakamura');
INSERT INTO infrastructure (id, name, type, space, assigned_to) VALUES ('desk-012', 'FIN-Desk-1', 'desk', 'Finance Department', 'Emily Rodriguez');
INSERT INTO infrastructure (id, name, type, space, assigned_to) VALUES ('desk-013', 'FIN-Desk-2', 'desk', 'Finance Department', 'Daniel Foster');
INSERT INTO infrastructure (id, name, type, space, assigned_to) VALUES ('desk-014', 'INDY-Desk-1', 'desk', 'Indy Open Office', 'Chris Miller');
INSERT INTO infrastructure (id, name, type, space, assigned_to) VALUES ('desk-015', 'INDY-Desk-2', 'desk', 'Indy Open Office', 'Amanda Johnson');
INSERT INTO infrastructure (id, name, type, space, assigned_to) VALUES ('desk-016', 'DET-Desk-1', 'desk', 'Detroit Open Office', 'Kevin O''Brien');
INSERT INTO infrastructure (id, name, type, space, assigned_to) VALUES ('desk-017', 'PIT-Desk-1', 'desk', 'Pittsburgh Open Office', 'Nicole Taylor');

-- ============================================================================
-- DATA: Components (from components.toml - 50 components)
-- ============================================================================

-- HQ Core Network
INSERT INTO components (id, name, type, placement_type, rack_id, u_position) VALUES ('1001', 'HQ-Edge-Router', 'Router', 'Rack', 'DC-Rack-A1', 40);
INSERT INTO components (id, name, type, placement_type, rack_id, u_position) VALUES ('1002', 'HQ-Core-Switch', 'Switch', 'Rack', 'DC-Rack-A1', 38);
INSERT INTO components (id, name, type, placement_type, rack_id, u_position) VALUES ('1003', 'HQ-Firewall', 'Firewall', 'Rack', 'DC-Rack-A1', 36);
INSERT INTO components (id, name, type, placement_type, rack_id, u_position) VALUES ('1004', 'HQ-WAN-Router', 'Router', 'Rack', 'DC-Rack-A1', 34);

-- HQ Servers
INSERT INTO components (id, name, type, placement_type, rack_id, u_position) VALUES ('2001', 'DC1-Server', 'Server', 'Rack', 'DC-Rack-A2', 40);
INSERT INTO components (id, name, type, placement_type, rack_id, u_position) VALUES ('2002', 'DC2-Server', 'Server', 'Rack', 'DC-Rack-A2', 38);
INSERT INTO components (id, name, type, placement_type, rack_id, u_position) VALUES ('2003', 'File-Server', 'Server', 'Rack', 'DC-Rack-A2', 36);
INSERT INTO components (id, name, type, placement_type, rack_id, u_position) VALUES ('2004', 'SQL-Server', 'Server', 'Rack', 'DC-Rack-A2', 34);
INSERT INTO components (id, name, type, placement_type, rack_id, u_position) VALUES ('2005', 'Backup-Server', 'Server', 'Rack', 'DC-Rack-A2', 32);
INSERT INTO components (id, name, type, placement_type, rack_id, u_position) VALUES ('2006', 'SAP-Server', 'Server', 'Rack', 'DC-Rack-B1', 40);
INSERT INTO components (id, name, type, placement_type, rack_id, u_position) VALUES ('2007', 'CallManager-Server', 'Server', 'Rack', 'DC-Rack-B1', 38);
INSERT INTO components (id, name, type, placement_type, rack_id, u_position) VALUES ('2008', 'Splunk-Server', 'Server', 'Rack', 'DC-Rack-B1', 36);

-- HQ Distribution & Access
INSERT INTO components (id, name, type, placement_type, rack_id, u_position) VALUES ('3001', 'HQ-Dist-SW-1', 'Switch', 'Rack', 'IDF-HQ-B1', 22);
INSERT INTO components (id, name, type, placement_type, rack_id, u_position) VALUES ('3002', 'HQ-Dist-SW-2', 'Switch', 'Rack', 'IDF-HQ-B1', 20);
INSERT INTO components (id, name, type, placement_type, rack_id, u_position) VALUES ('3003', 'HQ-Access-SW-1', 'Switch', 'Rack', 'IDF-HQ-B1', 18);
INSERT INTO components (id, name, type, placement_type, rack_id, u_position) VALUES ('3004', 'HQ-Access-SW-2', 'Switch', 'Rack', 'IDF-HQ-B1', 16);

-- HQ Wireless
INSERT INTO components (id, name, type, placement_type) VALUES ('3101', 'HQ-AP-Lobby', 'AccessPoint', 'Standalone');
INSERT INTO components (id, name, type, placement_type) VALUES ('3102', 'HQ-AP-Eng', 'AccessPoint', 'Standalone');
INSERT INTO components (id, name, type, placement_type) VALUES ('3103', 'HQ-AP-Exec', 'AccessPoint', 'Standalone');

-- HQ Workstations
INSERT INTO components (id, name, type, placement_type, desk_id) VALUES ('4001', 'WS-IT-MikeChen', 'Workstation', 'Desk', 'IT-Desk-1');
INSERT INTO components (id, name, type, placement_type, desk_id) VALUES ('4002', 'WS-IT-SarahKim', 'Workstation', 'Desk', 'IT-Desk-2');
INSERT INTO components (id, name, type, placement_type, desk_id) VALUES ('4003', 'WS-HR-PatriciaMartinez', 'Workstation', 'Desk', 'HR-Desk-1');
INSERT INTO components (id, name, type, placement_type, desk_id) VALUES ('4004', 'WS-ENG-DavidPark', 'Workstation', 'Desk', 'ENG-Desk-1');
INSERT INTO components (id, name, type, placement_type, desk_id) VALUES ('4005', 'WS-ENG-JenniferAdams', 'Workstation', 'Desk', 'ENG-Desk-2');
INSERT INTO components (id, name, type, placement_type, desk_id) VALUES ('4006', 'WS-CAD-LisaChen', 'Workstation', 'Desk', 'CAD-Desk-1');
INSERT INTO components (id, name, type, placement_type, desk_id) VALUES ('4007', 'WS-CEO-ThomasAnderson', 'Workstation', 'Desk', 'CEO-Desk');
INSERT INTO components (id, name, type, placement_type, desk_id) VALUES ('4008', 'WS-CFO-MargaretSullivan', 'Workstation', 'Desk', 'CFO-Desk');
INSERT INTO components (id, name, type, placement_type, desk_id) VALUES ('4009', 'WS-FIN-EmilyRodriguez', 'Workstation', 'Desk', 'FIN-Desk-1');

-- HQ Printers
INSERT INTO components (id, name, type, placement_type) VALUES ('5001', 'PRN-HQ-Floor1', 'Printer', 'Standalone');
INSERT INTO components (id, name, type, placement_type) VALUES ('5002', 'PRN-HQ-Engineering', 'Printer', 'Standalone');
INSERT INTO components (id, name, type, placement_type) VALUES ('5003', 'PRN-HQ-Executive', 'Printer', 'Standalone');

-- Indianapolis
INSERT INTO components (id, name, type, placement_type, rack_id, u_position) VALUES ('6001', 'INDY-Router', 'Router', 'Rack', 'IDF-Indy', 10);
INSERT INTO components (id, name, type, placement_type, rack_id, u_position) VALUES ('6002', 'INDY-Switch-1', 'Switch', 'Rack', 'IDF-Indy', 8);
INSERT INTO components (id, name, type, placement_type) VALUES ('6003', 'INDY-AP', 'AccessPoint', 'Standalone');
INSERT INTO components (id, name, type, placement_type, desk_id) VALUES ('6004', 'WS-INDY-ChrisMiller', 'Workstation', 'Desk', 'INDY-Desk-1');
INSERT INTO components (id, name, type, placement_type, desk_id) VALUES ('6005', 'WS-INDY-AmandaJohnson', 'Workstation', 'Desk', 'INDY-Desk-2');
INSERT INTO components (id, name, type, placement_type) VALUES ('6006', 'PRN-INDY', 'Printer', 'Standalone');

-- Detroit
INSERT INTO components (id, name, type, placement_type, rack_id, u_position) VALUES ('7001', 'DET-Router', 'Router', 'Rack', 'IDF-Detroit', 10);
INSERT INTO components (id, name, type, placement_type, rack_id, u_position) VALUES ('7002', 'DET-Switch-1', 'Switch', 'Rack', 'IDF-Detroit', 8);
INSERT INTO components (id, name, type, placement_type) VALUES ('7003', 'DET-AP', 'AccessPoint', 'Standalone');
INSERT INTO components (id, name, type, placement_type, desk_id) VALUES ('7004', 'WS-DET-KevinOBrien', 'Workstation', 'Desk', 'DET-Desk-1');
INSERT INTO components (id, name, type, placement_type) VALUES ('7005', 'PRN-DET', 'Printer', 'Standalone');

-- Pittsburgh
INSERT INTO components (id, name, type, placement_type, rack_id, u_position) VALUES ('8001', 'PIT-Router', 'Router', 'Rack', 'IDF-Pittsburgh', 10);
INSERT INTO components (id, name, type, placement_type, rack_id, u_position) VALUES ('8002', 'PIT-Switch-1', 'Switch', 'Rack', 'IDF-Pittsburgh', 8);
INSERT INTO components (id, name, type, placement_type) VALUES ('8003', 'PIT-AP', 'AccessPoint', 'Standalone');
INSERT INTO components (id, name, type, placement_type, desk_id) VALUES ('8004', 'WS-PIT-NicoleTaylor', 'Workstation', 'Desk', 'PIT-Desk-1');
INSERT INTO components (id, name, type, placement_type) VALUES ('8005', 'PRN-PIT', 'Printer', 'Standalone');

-- ============================================================================
-- DATA: Assets (from assets.toml - 32 physical assets)
-- ============================================================================

-- Core Network
INSERT INTO assets (id, name, category, manufacturer, model, serial_number, mac_address, status, rack, position_u, height_u) VALUES ('asset-001', 'HQ-Core-SW-01', 'Network', 'Cisco', 'Catalyst 9500-48X', 'FXS2345Q0AB', '00:1A:2B:3C:4D:01', 'installed:active', 'DC-Rack-A1', 40, 1);
INSERT INTO assets (id, name, category, manufacturer, model, serial_number, mac_address, status, rack, position_u, height_u) VALUES ('asset-002', 'HQ-Core-SW-02', 'Network', 'Cisco', 'Catalyst 9500-48X', 'FXS2345Q0AC', '00:1A:2B:3C:4D:02', 'installed:active', 'DC-Rack-A1', 39, 1);
INSERT INTO assets (id, name, category, manufacturer, model, serial_number, mac_address, status, rack, position_u, height_u) VALUES ('asset-003', 'HQ-FW-01', 'Network', 'Palo Alto', 'PA-3220', 'PA3220-0012345', '00:1B:17:00:01:A1', 'installed:active', 'DC-Rack-A1', 38, 1);
INSERT INTO assets (id, name, category, manufacturer, model, serial_number, mac_address, status, rack, position_u, height_u, notes) VALUES ('asset-004', 'HQ-FW-02', 'Network', 'Palo Alto', 'PA-3220', 'PA3220-0012346', '00:1B:17:00:01:A2', 'installed:active', 'DC-Rack-A1', 37, 1, 'HA pair with HQ-FW-01');

-- ESXi Hosts
INSERT INTO assets (id, name, category, manufacturer, model, serial_number, mac_address, status, rack, position_u, height_u) VALUES ('asset-005', 'HQ-ESX-01', 'Server', 'Dell', 'PowerEdge R750', 'DELL-7X8K2M3', '24:6E:96:AA:BB:01', 'installed:active', 'DC-Rack-A2', 38, 2);
INSERT INTO assets (id, name, category, manufacturer, model, serial_number, mac_address, status, rack, position_u, height_u) VALUES ('asset-006', 'HQ-ESX-02', 'Server', 'Dell', 'PowerEdge R750', 'DELL-7X8K2M4', '24:6E:96:AA:BB:02', 'installed:active', 'DC-Rack-A2', 36, 2);
INSERT INTO assets (id, name, category, manufacturer, model, serial_number, mac_address, status, rack, position_u, height_u) VALUES ('asset-007', 'HQ-ESX-03', 'Server', 'Dell', 'PowerEdge R750', 'DELL-7X8K2M5', '24:6E:96:AA:BB:03', 'installed:active', 'DC-Rack-A2', 34, 2);
INSERT INTO assets (id, name, category, manufacturer, model, serial_number, mac_address, status, rack, position_u, height_u) VALUES ('asset-008', 'HQ-ESX-04', 'Server', 'Dell', 'PowerEdge R750', 'DELL-7X8K2M6', '24:6E:96:AA:BB:04', 'installed:active', 'DC-Rack-A2', 32, 2);
INSERT INTO assets (id, name, category, manufacturer, model, serial_number, mac_address, status, rack, position_u, height_u) VALUES ('asset-009', 'HQ-ESX-05', 'Server', 'Dell', 'PowerEdge R750', 'DELL-7X8K2M7', '24:6E:96:AA:BB:05', 'installed:active', 'DC-Rack-A2', 30, 2);
INSERT INTO assets (id, name, category, manufacturer, model, serial_number, mac_address, status, rack, position_u, height_u) VALUES ('asset-010', 'HQ-ESX-06', 'Server', 'Dell', 'PowerEdge R750', 'DELL-7X8K2M8', '24:6E:96:AA:BB:06', 'installed:active', 'DC-Rack-A2', 28, 2);

-- Storage
INSERT INTO assets (id, name, category, manufacturer, model, serial_number, mac_address, status, rack, position_u, height_u, notes) VALUES ('asset-011', 'HQ-NAS-01', 'Storage', 'NetApp', 'FAS8200', 'NTA-8200-123456', '02:0C:29:00:00:01', 'installed:active', 'DC-Rack-B1', 36, 4, 'Primary storage - 50TB usable');
INSERT INTO assets (id, name, category, manufacturer, model, serial_number, mac_address, status, rack, position_u, height_u, notes) VALUES ('asset-012', 'HQ-NAS-02', 'Storage', 'NetApp', 'FAS8200', 'NTA-8200-123457', '02:0C:29:00:00:02', 'installed:active', 'DC-Rack-B1', 32, 4, 'DR replication target');
INSERT INTO assets (id, name, category, manufacturer, model, serial_number, mac_address, status, rack, position_u, height_u, notes) VALUES ('asset-013', 'HQ-BKP-01', 'Server', 'Dell', 'PowerEdge R650', 'DELL-BKP0001', '24:6E:96:CC:DD:01', 'installed:active', 'DC-Rack-B1', 28, 1, 'Veeam Backup & Replication server');

-- Domain Controllers
INSERT INTO assets (id, name, category, manufacturer, model, serial_number, mac_address, status, rack, position_u, height_u, notes) VALUES ('asset-014', 'HQ-DC-01', 'Server', 'Dell', 'PowerEdge R450', 'DELL-DC001', '24:6E:96:DD:EE:01', 'installed:active', 'DC-Rack-A1', 34, 1, 'Primary Domain Controller');
INSERT INTO assets (id, name, category, manufacturer, model, serial_number, mac_address, status, rack, position_u, height_u, notes) VALUES ('asset-015', 'HQ-DC-02', 'Server', 'Dell', 'PowerEdge R450', 'DELL-DC002', '24:6E:96:DD:EE:02', 'installed:active', 'DC-Rack-A1', 33, 1, 'Secondary Domain Controller');

-- IDF Switches
INSERT INTO assets (id, name, category, manufacturer, model, serial_number, mac_address, status, rack, position_u, height_u, notes) VALUES ('asset-016', 'HQ-IDF-SW-B1', 'Network', 'Cisco', 'Catalyst 9200-24P', 'FXS1234B1A1', '00:1A:2B:3C:5D:01', 'installed:active', 'IDF-HQ-B1', 20, 1, 'Basement floor access switch');

-- Indianapolis
INSERT INTO assets (id, name, category, manufacturer, model, serial_number, mac_address, status, rack, position_u, height_u, notes) VALUES ('asset-017', 'INDY-RTR-01', 'Network', 'Cisco', 'ISR 4331', 'FTX2101ABCD', '00:1A:2B:4C:01:01', 'installed:active', 'IDF-Indy', 10, 1, 'WAN router - 100Mbps circuit');
INSERT INTO assets (id, name, category, manufacturer, model, serial_number, mac_address, status, rack, position_u, height_u) VALUES ('asset-018', 'INDY-SW-01', 'Network', 'Cisco', 'Meraki MS120-24P', 'Q2QN-1234-ABCD', '00:18:0A:11:22:01', 'installed:active', 'IDF-Indy', 8, 1);
INSERT INTO assets (id, name, category, manufacturer, model, serial_number, mac_address, status, space, storage_location) VALUES ('asset-019', 'INDY-AP-01', 'Network', 'Cisco', 'Meraki MR46', 'Q2MD-2345-BCDE', '00:18:0A:AA:11:01', 'installed:active', 'Indy Open Office', 'Ceiling mount - main area');

-- Detroit
INSERT INTO assets (id, name, category, manufacturer, model, serial_number, mac_address, status, rack, position_u, height_u) VALUES ('asset-020', 'DET-RTR-01', 'Network', 'Cisco', 'ISR 4331', 'FTX2102EFGH', '00:1A:2B:4C:02:01', 'installed:active', 'IDF-Detroit', 10, 1);
INSERT INTO assets (id, name, category, manufacturer, model, serial_number, mac_address, status, rack, position_u, height_u) VALUES ('asset-021', 'DET-SW-01', 'Network', 'Cisco', 'Meraki MS120-24P', 'Q2QN-2345-EFGH', '00:18:0A:22:33:01', 'installed:active', 'IDF-Detroit', 8, 1);
INSERT INTO assets (id, name, category, manufacturer, model, serial_number, mac_address, status, space, storage_location) VALUES ('asset-022', 'DET-AP-01', 'Network', 'Cisco', 'Meraki MR46', 'Q2MD-3456-CDEF', '00:18:0A:BB:22:01', 'installed:active', 'Detroit Open Office', 'Ceiling mount - main area');

-- Pittsburgh
INSERT INTO assets (id, name, category, manufacturer, model, serial_number, mac_address, status, rack, position_u, height_u) VALUES ('asset-023', 'PIT-RTR-01', 'Network', 'Cisco', 'ISR 4331', 'FTX2103IJKL', '00:1A:2B:4C:03:01', 'installed:active', 'IDF-Pittsburgh', 10, 1);
INSERT INTO assets (id, name, category, manufacturer, model, serial_number, mac_address, status, rack, position_u, height_u) VALUES ('asset-024', 'PIT-SW-01', 'Network', 'Cisco', 'Meraki MS120-24P', 'Q2QN-3456-IJKL', '00:18:0A:33:44:01', 'installed:active', 'IDF-Pittsburgh', 8, 1);
INSERT INTO assets (id, name, category, manufacturer, model, serial_number, mac_address, status, space, storage_location) VALUES ('asset-025', 'PIT-AP-01', 'Network', 'Cisco', 'Meraki MR46', 'Q2MD-4567-DEFG', '00:18:0A:CC:33:01', 'installed:active', 'Pittsburgh Open Office', 'Ceiling mount - main area');

-- HQ Wireless APs
INSERT INTO assets (id, name, category, manufacturer, model, serial_number, mac_address, status, space, storage_location) VALUES ('asset-026', 'HQ-AP-LOBBY', 'Network', 'Cisco', 'Aironet 9120AX', 'FCW2433L001', '00:3A:7D:01:01:01', 'installed:active', 'Reception Area', 'Ceiling mount - lobby entrance');
INSERT INTO assets (id, name, category, manufacturer, model, serial_number, mac_address, status, space, storage_location) VALUES ('asset-027', 'HQ-AP-ENG', 'Network', 'Cisco', 'Aironet 9120AX', 'FCW2433L002', '00:3A:7D:01:01:02', 'installed:active', 'Engineering Open Plan', 'Ceiling mount - center');
INSERT INTO assets (id, name, category, manufacturer, model, serial_number, mac_address, status, space, storage_location) VALUES ('asset-028', 'HQ-AP-EXEC', 'Network', 'Cisco', 'Aironet 9120AX', 'FCW2433L003', '00:3A:7D:01:01:03', 'installed:active', 'Executive Suite', 'Ceiling mount - conference area');

-- Spare Equipment
INSERT INTO assets (id, name, category, manufacturer, model, serial_number, mac_address, status, space, storage_location, notes) VALUES ('asset-029', 'SPARE-SW-01', 'Network', 'Cisco', 'Catalyst 9200-24P', 'FXS9999SP01', '00:1A:2B:99:99:01', 'storage', 'Data Center', 'Spare parts shelf A', 'Cold spare for IDF switches');
INSERT INTO assets (id, name, category, manufacturer, model, serial_number, mac_address, status, space, storage_location, notes) VALUES ('asset-030', 'SPARE-AP-01', 'Network', 'Cisco', 'Aironet 9120AX', 'FCW9999SP01', '00:3A:7D:99:99:01', 'storage', 'Data Center', 'Spare parts shelf A', 'Cold spare for wireless APs');
INSERT INTO assets (id, name, category, manufacturer, model, serial_number, mac_address, status, space, storage_location, notes) VALUES ('asset-031', 'SPARE-SRV-01', 'Server', 'Dell', 'PowerEdge R450', 'DELL-SP001', '24:6E:96:99:99:01', 'storage', 'Data Center', 'Spare parts shelf B', 'Emergency replacement server');

-- Decommissioned
INSERT INTO assets (id, name, category, manufacturer, model, serial_number, mac_address, status, rack, position_u, height_u, notes) VALUES ('asset-032', 'OLD-FW-01', 'Network', 'Palo Alto', 'PA-850', 'PA850-OLD001', '00:1B:17:OLD:01:A1', 'installed:inactive', 'DC-Rack-B1', 5, 1, 'Replaced by PA-3220 pair - pending decommission');

-- ============================================================================
-- DATA: Component Connections (Network Topology)
-- ============================================================================

-- HQ Core Fabric
INSERT INTO component_connections (from_component_id, to_component_id) VALUES ('1001', '1003');
INSERT INTO component_connections (from_component_id, to_component_id) VALUES ('1003', '1002');
INSERT INTO component_connections (from_component_id, to_component_id) VALUES ('1002', '1004');

-- Core to Distribution
INSERT INTO component_connections (from_component_id, to_component_id) VALUES ('1002', '3001');
INSERT INTO component_connections (from_component_id, to_component_id) VALUES ('1002', '3002');

-- Distribution to Access
INSERT INTO component_connections (from_component_id, to_component_id) VALUES ('3001', '3003');
INSERT INTO component_connections (from_component_id, to_component_id) VALUES ('3002', '3004');

-- Servers to Core
INSERT INTO component_connections (from_component_id, to_component_id) VALUES ('2001', '1002');
INSERT INTO component_connections (from_component_id, to_component_id) VALUES ('2002', '1002');
INSERT INTO component_connections (from_component_id, to_component_id) VALUES ('2003', '1002');
INSERT INTO component_connections (from_component_id, to_component_id) VALUES ('2004', '1002');
INSERT INTO component_connections (from_component_id, to_component_id) VALUES ('2005', '1002');
INSERT INTO component_connections (from_component_id, to_component_id) VALUES ('2006', '1002');
INSERT INTO component_connections (from_component_id, to_component_id) VALUES ('2007', '1002');
INSERT INTO component_connections (from_component_id, to_component_id) VALUES ('2008', '1002');

-- WAN Connections (HQ to Satellites via MPLS)
INSERT INTO component_connections (from_component_id, to_component_id) VALUES ('1004', '6001');
INSERT INTO component_connections (from_component_id, to_component_id) VALUES ('1004', '7001');
INSERT INTO component_connections (from_component_id, to_component_id) VALUES ('1004', '8001');

-- Indianapolis Internal
INSERT INTO component_connections (from_component_id, to_component_id) VALUES ('6001', '6002');
INSERT INTO component_connections (from_component_id, to_component_id) VALUES ('6002', '6004');
INSERT INTO component_connections (from_component_id, to_component_id) VALUES ('6002', '6005');

-- Detroit Internal
INSERT INTO component_connections (from_component_id, to_component_id) VALUES ('7001', '7002');
INSERT INTO component_connections (from_component_id, to_component_id) VALUES ('7002', '7004');

-- Pittsburgh Internal
INSERT INTO component_connections (from_component_id, to_component_id) VALUES ('8001', '8002');
INSERT INTO component_connections (from_component_id, to_component_id) VALUES ('8002', '8004');
