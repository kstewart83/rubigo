-- REGIONS
INSERT INTO regions (profile_id, id, name, description) VALUES ('mmc', NULL, 'Columbus HQ', NULL);
INSERT INTO regions (profile_id, id, name, description) VALUES ('mmc', NULL, 'Indianapolis', NULL);
INSERT INTO regions (profile_id, id, name, description) VALUES ('mmc', NULL, 'Detroit', NULL);
INSERT INTO regions (profile_id, id, name, description) VALUES ('mmc', NULL, 'Pittsburgh', NULL);

-- SITES
INSERT INTO sites (profile_id, id, name, region_id, address, city, state, zip, country) VALUES ('mmc', NULL, 'MMC Headquarters', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO sites (profile_id, id, name, region_id, address, city, state, zip, country) VALUES ('mmc', NULL, 'Indianapolis Regional Office', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO sites (profile_id, id, name, region_id, address, city, state, zip, country) VALUES ('mmc', NULL, 'Detroit Regional Office', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO sites (profile_id, id, name, region_id, address, city, state, zip, country) VALUES ('mmc', NULL, 'Pittsburgh Regional Office', NULL, NULL, NULL, NULL, NULL, NULL);

-- BUILDINGS
INSERT INTO buildings (profile_id, id, name, site_id, floors) VALUES ('mmc', NULL, 'HQ Main Building', NULL, NULL);
INSERT INTO buildings (profile_id, id, name, site_id, floors) VALUES ('mmc', NULL, 'HQ Annex', NULL, NULL);
INSERT INTO buildings (profile_id, id, name, site_id, floors) VALUES ('mmc', NULL, 'Indy Office Building', NULL, NULL);
INSERT INTO buildings (profile_id, id, name, site_id, floors) VALUES ('mmc', NULL, 'Detroit Office Building', NULL, NULL);
INSERT INTO buildings (profile_id, id, name, site_id, floors) VALUES ('mmc', NULL, 'Pittsburgh Office Building', NULL, NULL);

-- SPACES
INSERT INTO spaces (profile_id, id, name, building_id, floor, space_type, capacity) VALUES ('mmc', 1, 'Data Center', NULL, NULL, NULL, NULL);
INSERT INTO spaces (profile_id, id, name, building_id, floor, space_type, capacity) VALUES ('mmc', 2, 'Network Closet B1', NULL, NULL, NULL, NULL);
INSERT INTO spaces (profile_id, id, name, building_id, floor, space_type, capacity) VALUES ('mmc', 3, 'Reception Area', NULL, NULL, NULL, NULL);
INSERT INTO spaces (profile_id, id, name, building_id, floor, space_type, capacity) VALUES ('mmc', 4, 'HR Suite', NULL, NULL, NULL, NULL);
INSERT INTO spaces (profile_id, id, name, building_id, floor, space_type, capacity) VALUES ('mmc', 5, 'IT Help Desk', NULL, NULL, NULL, NULL);
INSERT INTO spaces (profile_id, id, name, building_id, floor, space_type, capacity) VALUES ('mmc', 6, 'Engineering Open Plan', NULL, NULL, NULL, NULL);
INSERT INTO spaces (profile_id, id, name, building_id, floor, space_type, capacity) VALUES ('mmc', 7, 'CAD Lab', NULL, NULL, NULL, NULL);
INSERT INTO spaces (profile_id, id, name, building_id, floor, space_type, capacity) VALUES ('mmc', 8, 'Conference Room 2A', NULL, NULL, NULL, NULL);
INSERT INTO spaces (profile_id, id, name, building_id, floor, space_type, capacity) VALUES ('mmc', 9, 'Executive Suite', NULL, NULL, NULL, NULL);
INSERT INTO spaces (profile_id, id, name, building_id, floor, space_type, capacity) VALUES ('mmc', 10, 'Finance Department', NULL, NULL, NULL, NULL);
INSERT INTO spaces (profile_id, id, name, building_id, floor, space_type, capacity) VALUES ('mmc', 11, 'Board Room', NULL, NULL, NULL, NULL);
INSERT INTO spaces (profile_id, id, name, building_id, floor, space_type, capacity) VALUES ('mmc', 12, 'Indy Open Office', NULL, NULL, NULL, NULL);
INSERT INTO spaces (profile_id, id, name, building_id, floor, space_type, capacity) VALUES ('mmc', 13, 'Indy Network Closet', NULL, NULL, NULL, NULL);
INSERT INTO spaces (profile_id, id, name, building_id, floor, space_type, capacity) VALUES ('mmc', 14, 'Detroit Open Office', NULL, NULL, NULL, NULL);
INSERT INTO spaces (profile_id, id, name, building_id, floor, space_type, capacity) VALUES ('mmc', 15, 'Detroit Network Closet', NULL, NULL, NULL, NULL);
INSERT INTO spaces (profile_id, id, name, building_id, floor, space_type, capacity) VALUES ('mmc', 16, 'Pittsburgh Open Office', NULL, NULL, NULL, NULL);
INSERT INTO spaces (profile_id, id, name, building_id, floor, space_type, capacity) VALUES ('mmc', 17, 'Pittsburgh Network Closet', NULL, NULL, NULL, NULL);

