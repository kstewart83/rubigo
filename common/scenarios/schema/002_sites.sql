-- ============================================================================
-- 002_sites.sql - Regions, Sites, Buildings, Spaces
-- ============================================================================
-- Source: sites.toml

CREATE TABLE IF NOT EXISTS regions (
    name TEXT PRIMARY KEY,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    lat REAL,
    lon REAL
);

CREATE TABLE IF NOT EXISTS sites (
    name TEXT PRIMARY KEY,
    region TEXT NOT NULL REFERENCES regions(name),
    status TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS buildings (
    name TEXT PRIMARY KEY,
    site TEXT NOT NULL REFERENCES sites(name),
    address TEXT,
    floors_min INTEGER,
    floors_max INTEGER,
    floor_names TEXT  -- JSON array
);

CREATE TABLE IF NOT EXISTS spaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    locator TEXT NOT NULL,
    building TEXT NOT NULL REFERENCES buildings(name),
    level INTEGER NOT NULL,
    type TEXT,
    UNIQUE(building, locator)
);

-- ============================================================================
-- Regions
-- ============================================================================

INSERT INTO regions (name, city, country, lat, lon) VALUES
('Columbus HQ', 'Columbus', 'United States', 39.9612, -82.9988);

INSERT INTO regions (name, city, country, lat, lon) VALUES
('Indianapolis', 'Indianapolis', 'United States', 39.7684, -86.1581);

INSERT INTO regions (name, city, country, lat, lon) VALUES
('Detroit', 'Detroit', 'United States', 42.3314, -83.0458);

INSERT INTO regions (name, city, country, lat, lon) VALUES
('Pittsburgh', 'Pittsburgh', 'United States', 40.4406, -79.9959);

-- ============================================================================
-- Sites
-- ============================================================================

INSERT INTO sites (name, region, status) VALUES
('MMC Headquarters', 'Columbus HQ', 'active');

INSERT INTO sites (name, region, status) VALUES
('Indianapolis Regional Office', 'Indianapolis', 'active');

INSERT INTO sites (name, region, status) VALUES
('Detroit Regional Office', 'Detroit', 'active');

INSERT INTO sites (name, region, status) VALUES
('Pittsburgh Regional Office', 'Pittsburgh', 'active');

-- ============================================================================
-- Buildings
-- ============================================================================

INSERT INTO buildings (name, site, address, floors_min, floors_max, floor_names) VALUES
('HQ Main Building', 'MMC Headquarters', '1000 Industrial Parkway, Columbus, OH 43215', -1, 3, '["Basement Services", "Reception & Services", "Engineering", "Executive & Finance"]');

INSERT INTO buildings (name, site, address, floors_min, floors_max, floor_names) VALUES
('HQ Annex', 'MMC Headquarters', '1010 Industrial Parkway, Columbus, OH 43215', 1, 1, '["Main Floor"]');

INSERT INTO buildings (name, site, address, floors_min, floors_max, floor_names) VALUES
('Indy Office Building', 'Indianapolis Regional Office', '500 Commerce Drive, Indianapolis, IN 46204', 1, 1, '["Main Floor"]');

INSERT INTO buildings (name, site, address, floors_min, floors_max, floor_names) VALUES
('Detroit Office Building', 'Detroit Regional Office', '200 Tech Center Drive, Detroit, MI 48226', 1, 1, '["Main Floor"]');

INSERT INTO buildings (name, site, address, floors_min, floors_max, floor_names) VALUES
('Pittsburgh Office Building', 'Pittsburgh Regional Office', '300 Steel Plaza, Pittsburgh, PA 15222', 1, 1, '["Main Floor"]');

-- ============================================================================
-- Spaces - HQ Main Building
-- ============================================================================

INSERT INTO spaces (name, locator, building, level, type) VALUES
('Data Center', 'B01', 'HQ Main Building', -1, 'Data Center');

INSERT INTO spaces (name, locator, building, level, type) VALUES
('Network Closet B1', 'B02', 'HQ Main Building', -1, 'Closet');

INSERT INTO spaces (name, locator, building, level, type) VALUES
('Reception Area', '100', 'HQ Main Building', 1, 'Common Area');

INSERT INTO spaces (name, locator, building, level, type) VALUES
('HR Suite', '101', 'HQ Main Building', 1, 'Office');

INSERT INTO spaces (name, locator, building, level, type) VALUES
('IT Help Desk', '102', 'HQ Main Building', 1, 'Office');

INSERT INTO spaces (name, locator, building, level, type) VALUES
('Engineering Open Plan', '201-OP', 'HQ Main Building', 2, 'Office');

INSERT INTO spaces (name, locator, building, level, type) VALUES
('CAD Lab', '202', 'HQ Main Building', 2, 'Office');

INSERT INTO spaces (name, locator, building, level, type) VALUES
('Conference Room 2A', '2A', 'HQ Main Building', 2, 'Meeting Room');

INSERT INTO spaces (name, locator, building, level, type) VALUES
('Executive Suite', '300', 'HQ Main Building', 3, 'Office');

INSERT INTO spaces (name, locator, building, level, type) VALUES
('Finance Department', '301', 'HQ Main Building', 3, 'Office');

INSERT INTO spaces (name, locator, building, level, type) VALUES
('Board Room', '302', 'HQ Main Building', 3, 'Meeting Room');

-- ============================================================================
-- Spaces - Regional Offices
-- ============================================================================

INSERT INTO spaces (name, locator, building, level, type) VALUES
('Indy Open Office', '101', 'Indy Office Building', 1, 'Office');

INSERT INTO spaces (name, locator, building, level, type) VALUES
('Indy Network Closet', '102', 'Indy Office Building', 1, 'Closet');

INSERT INTO spaces (name, locator, building, level, type) VALUES
('Detroit Open Office', '101', 'Detroit Office Building', 1, 'Office');

INSERT INTO spaces (name, locator, building, level, type) VALUES
('Detroit Network Closet', '102', 'Detroit Office Building', 1, 'Closet');

INSERT INTO spaces (name, locator, building, level, type) VALUES
('Pittsburgh Open Office', '101', 'Pittsburgh Office Building', 1, 'Office');

INSERT INTO spaces (name, locator, building, level, type) VALUES
('Pittsburgh Network Closet', '102', 'Pittsburgh Office Building', 1, 'Closet');
