-- ============================================================================
-- 003_solution_space.sql - Solutions, Products, Services, Releases
-- ============================================================================
-- Source: projects.toml (solution space entities)

CREATE TABLE IF NOT EXISTS solutions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'catalog' CHECK(status IN ('pipeline', 'catalog', 'retired'))
);

CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    solution_id TEXT NOT NULL REFERENCES solutions(id),
    version TEXT,
    release_date TEXT
);

CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    solution_id TEXT NOT NULL REFERENCES solutions(id),
    service_level TEXT
);

CREATE TABLE IF NOT EXISTS releases (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id),
    version TEXT NOT NULL,
    release_date TEXT,
    status TEXT
);

-- ============================================================================
-- Solutions
-- ============================================================================

INSERT INTO solutions (id, name, description, status) VALUES
('a1b2c3', 'HVAC Solutions Platform', 'Core business solution encompassing design, manufacturing, installation, and maintenance of commercial HVAC systems', 'catalog');

INSERT INTO solutions (id, name, description, status) VALUES
('svc-hvac-equip', 'Commercial HVAC Equipment', 'Industrial and commercial heating, ventilation, and air conditioning units designed for reliability and energy efficiency', 'catalog');

INSERT INTO solutions (id, name, description, status) VALUES
('svc-hvac-parts', 'HVAC Parts & Components', 'Replacement parts, filters, and components for HVAC systems, available for direct purchase or through service contracts', 'catalog');

INSERT INTO solutions (id, name, description, status) VALUES
('svc-rubigo', 'Rubigo ERM Platform', 'Internal enterprise resource management platform providing strategic alignment visibility, project portfolio oversight, resource capacity planning, and operational metrics tracking', 'catalog');

-- ============================================================================
-- Products
-- ============================================================================

INSERT INTO products (id, solution_id, version) VALUES
('prod-hvac-equip', 'svc-hvac-equip', '2024.1');

INSERT INTO products (id, solution_id, version) VALUES
('prod-hvac-parts', 'svc-hvac-parts', '2024.2');

-- ============================================================================
-- Services
-- ============================================================================

INSERT INTO services (id, name, solution_id, service_level) VALUES
('svc-hvac-platform', 'HVAC Solutions Platform Service', 'a1b2c3', 'enterprise');

INSERT INTO services (id, name, solution_id, service_level) VALUES
('svc-rubigo-svc', 'Rubigo ERM Platform Service', 'svc-rubigo', 'internal');
