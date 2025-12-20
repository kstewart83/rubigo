-- ============================================================================
-- 001_personnel.sql - Personnel table definition
-- ============================================================================
-- Source: personnel.toml (23 people: 18 regular + 5 test)

CREATE TABLE IF NOT EXISTS personnel (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    title TEXT,
    department TEXT,
    site TEXT,
    building TEXT,
    level INTEGER,
    space TEXT,
    manager TEXT,
    photo TEXT,
    desk_phone TEXT,
    cell_phone TEXT,
    bio TEXT
);

-- ============================================================================
-- Executive Team
-- ============================================================================

INSERT INTO personnel (id, name, email, title, department, site, building, level, space, photo, desk_phone, cell_phone, bio) VALUES
('241a6d', 'Thomas Anderson', 'tanderson@mmc.com', 'Chief Executive Officer', 'Executive', 'MMC Headquarters', 'HQ Main Building', 3, '300', 'headshots/thomas_anderson_241a6d.png', '614-555-1001', '614-555-8001', 'Thomas founded MMC in 1998 after 15 years in industrial manufacturing. He holds an MBA from Ohio State and is known for his hands-on leadership style. Outside work, he volunteers with Junior Achievement and enjoys restoring classic cars.');

INSERT INTO personnel (id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio) VALUES
('cdb964', 'Margaret Sullivan', 'msullivan@mmc.com', 'Chief Financial Officer', 'Executive', 'MMC Headquarters', 'HQ Main Building', 3, '300', 'Thomas Anderson', 'headshots/margaret_sullivan_cdb964.png', '614-555-1002', '614-555-8002', 'Margaret joined MMC in 2008 from Deloitte, bringing 20 years of financial expertise. A CPA with a focus on manufacturing operations, she led the company''s successful ERP implementation.');

INSERT INTO personnel (id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio) VALUES
('714fd4', 'Richard Nakamura', 'rnakamura@mmc.com', 'Chief Technology Officer', 'Executive', 'MMC Headquarters', 'HQ Main Building', 3, '300', 'Thomas Anderson', 'headshots/richard_nakamura_714fd4.png', '614-555-1003', '614-555-8003', 'Richard oversees all technology initiatives and digital transformation at MMC. Previously at Rockwell Automation, he specializes in industrial IoT and smart manufacturing.');

-- ============================================================================
-- IT Department
-- ============================================================================

INSERT INTO personnel (id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio) VALUES
('1ea074', 'Mike Chen', 'mchen@mmc.com', 'IT Director', 'IT', 'MMC Headquarters', 'HQ Main Building', 1, '102', 'Richard Nakamura', 'headshots/mike_chen_1ea074.png', '614-555-2001', '614-555-8201', 'Mike manages the IT infrastructure across all MMC locations. With 12 years at the company, he led the network modernization project. Certified in Cisco and Microsoft technologies.');

INSERT INTO personnel (id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio) VALUES
('7aa0d4', 'Sarah Kim', 'skim@mmc.com', 'Network Administrator', 'IT', 'MMC Headquarters', 'HQ Main Building', 1, '102', 'Mike Chen', 'headshots/sarah_kim_7aa0d4.png', '614-555-2002', '614-555-8202', 'Sarah maintains the company''s network infrastructure and security systems. She joined MMC after graduating from Purdue and is passionate about cybersecurity.');

INSERT INTO personnel (id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio) VALUES
('d62d4d', 'Jason Wright', 'jwright@mmc.com', 'Systems Administrator', 'IT', 'MMC Headquarters', 'HQ Main Building', 1, '102', 'Mike Chen', 'headshots/jason_wright_d62d4d.png', '614-555-2003', '614-555-8203', 'Jason handles server management and cloud operations with expertise in Windows Server, VMware, and Azure. He''s working toward his CISSP certification.');

-- ============================================================================
-- HR Department
-- ============================================================================

INSERT INTO personnel (id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio) VALUES
('4f6f43', 'Patricia Martinez', 'pmartinez@mmc.com', 'HR Director', 'HR', 'MMC Headquarters', 'HQ Main Building', 1, '101', 'Thomas Anderson', 'headshots/patricia_martinez_4f6f43.png', '614-555-3001', '614-555-8301', 'Patricia leads all human resources functions including talent acquisition and employee development. With 18 years in HR, she implemented MMC''s apprenticeship program.');

INSERT INTO personnel (id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, bio) VALUES
('f73c1c', 'James Wilson', 'jwilson@mmc.com', 'HR Specialist', 'HR', 'MMC Headquarters', 'HQ Main Building', 1, '101', 'Patricia Martinez', 'headshots/james_wilson_f73c1c.png', '614-555-3002', 'James focuses on employee relations and benefits administration. He''s been with MMC for 5 years and is known for his approachable manner.');

-- ============================================================================
-- Engineering Department
-- ============================================================================

INSERT INTO personnel (id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio) VALUES
('d827cb', 'David Park', 'dpark@mmc.com', 'Engineering Manager', 'Engineering', 'MMC Headquarters', 'HQ Main Building', 2, '201-OP', 'Richard Nakamura', 'headshots/david_park_d827cb.png', '614-555-4001', '614-555-8401', 'David leads the mechanical engineering team developing HVAC systems. A licensed PE with 15 years of experience, he holds multiple patents.');

INSERT INTO personnel (id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio) VALUES
('f9c8d7', 'Jennifer Adams', 'jadams@mmc.com', 'Senior Mechanical Engineer', 'Engineering', 'MMC Headquarters', 'HQ Main Building', 2, '201-OP', 'David Park', 'headshots/jennifer_adams_f9c8d7.png', '614-555-4002', '614-555-8402', 'Jennifer specializes in thermal systems and energy efficiency. She''s led several product development projects that reduced energy consumption by 30%.');

INSERT INTO personnel (id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, bio) VALUES
('8a0c57', 'Robert Thompson', 'rthompson@mmc.com', 'Mechanical Engineer', 'Engineering', 'MMC Headquarters', 'HQ Main Building', 2, '201-OP', 'David Park', 'headshots/robert_thompson_8a0c57.png', '614-555-4003', 'Robert focuses on product testing and quality assurance. He joined MMC after completing his master''s at University of Michigan.');

INSERT INTO personnel (id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, bio) VALUES
('8f3a18', 'Lisa Chen', 'lchen@mmc.com', 'CAD Designer', 'Engineering', 'MMC Headquarters', 'HQ Main Building', 2, '202', 'David Park', 'headshots/lisa_chen_8f3a18.png', '614-555-4004', 'Lisa creates technical drawings and 3D models for HVAC components. Expert in SolidWorks and AutoCAD with an eye for both form and function.');

-- ============================================================================
-- Finance Department
-- ============================================================================

INSERT INTO personnel (id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio) VALUES
('4fcdf6', 'Emily Rodriguez', 'erodriguez@mmc.com', 'Finance Manager', 'Finance', 'MMC Headquarters', 'HQ Main Building', 3, '301', 'Margaret Sullivan', 'headshots/emily_rodriguez_4fcdf6.png', '614-555-5001', '614-555-8501', 'Emily manages day-to-day financial operations and reporting. A CPA who streamlined the monthly close process from 10 days to 3.');

INSERT INTO personnel (id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, bio) VALUES
('c1eddc', 'Daniel Foster', 'dfoster@mmc.com', 'Senior Accountant', 'Finance', 'MMC Headquarters', 'HQ Main Building', 3, '301', 'Emily Rodriguez', 'headshots/daniel_foster_c1eddc.png', '614-555-5002', 'Daniel handles accounts payable, receivable, and cost accounting. He''s been with MMC for 7 years and is the go-to person for SAP questions.');

-- ============================================================================
-- Sales - Regional
-- ============================================================================

INSERT INTO personnel (id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio) VALUES
('1e4e5c', 'Chris Miller', 'cmiller@mmc.com', 'Regional Sales Manager - Midwest', 'Sales', 'Indianapolis Regional Office', 'Indy Office Building', 1, '101', 'Thomas Anderson', 'headshots/chris_miller_1e4e5c.png', '317-555-6001', '317-555-8601', 'Chris leads sales across Indiana, Illinois, and Wisconsin. A 10-year MMC veteran, he''s grown the Midwest territory by 40%.');

INSERT INTO personnel (id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio) VALUES
('e8a466', 'Amanda Johnson', 'ajohnson@mmc.com', 'Sales Representative', 'Sales', 'Indianapolis Regional Office', 'Indy Office Building', 1, '101', 'Chris Miller', 'headshots/amanda_johnson_e8a466.png', '317-555-6002', '317-555-8602', 'Amanda handles inside sales and customer support for the Midwest region. She recently earned President''s Club recognition.');

INSERT INTO personnel (id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio) VALUES
('4d9154', 'Kevin O''Brien', 'kobrien@mmc.com', 'Regional Sales Manager - North', 'Sales', 'Detroit Regional Office', 'Detroit Office Building', 1, '101', 'Thomas Anderson', 'headshots/kevin_obrien_4d9154.png', '313-555-7001', '313-555-8701', 'Kevin manages sales in Michigan, Minnesota, and the Great Lakes region. With 15 years in industrial sales, he''s developed key automotive accounts.');

INSERT INTO personnel (id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio) VALUES
('5eedf9', 'Nicole Taylor', 'ntaylor@mmc.com', 'Regional Sales Manager - East', 'Sales', 'Pittsburgh Regional Office', 'Pittsburgh Office Building', 1, '101', 'Thomas Anderson', 'headshots/nicole_taylor_5eedf9.png', '412-555-7101', '412-555-8711', 'Nicole covers Pennsylvania, New York, and the Eastern seaboard. She has an engineering background that helps her consult on complex projects.');

-- ============================================================================
-- Test Personnel (for E2E testing)
-- ============================================================================

INSERT INTO personnel (id, name, email, title, department, site, building, level, space, manager, desk_phone, bio) VALUES
('test01', 'Alex Chen', 'achen@mmc.com', 'QA Engineer', 'IT', 'MMC Headquarters', 'HQ Main Building', 1, '102', 'Mike Chen', '614-555-2010', 'Alex joined the IT department to focus on quality assurance and automated testing. Previously worked at a fintech startup.');

INSERT INTO personnel (id, name, email, title, department, site, building, level, space, manager, desk_phone, bio) VALUES
('test02', 'Jordan Smith', 'jsmith@mmc.com', 'Sales Associate', 'Sales', 'Indianapolis Regional Office', 'Indy Office Building', 1, '101', 'Chris Miller', '317-555-6010', 'Jordan is a rising star in the Midwest sales team, bringing energy and fresh ideas to client relationships.');

INSERT INTO personnel (id, name, email, title, department, site, building, level, space, manager, desk_phone, bio) VALUES
('test03', 'Morgan Davis', 'mdavis@mmc.com', 'Product Designer', 'Engineering', 'MMC Headquarters', 'HQ Main Building', 2, '202', 'David Park', '614-555-4010', 'Morgan brings a user-centered design perspective to the engineering team, bridging the gap between form and function.');

INSERT INTO personnel (id, name, email, title, department, site, building, level, space, manager, desk_phone, cell_phone, bio) VALUES
('test04', 'Taylor Brown', 'tbrown@mmc.com', 'Project Manager', 'Executive', 'MMC Headquarters', 'HQ Main Building', 3, '300', 'Thomas Anderson', '614-555-1010', '614-555-8010', 'Taylor coordinates cross-functional projects and ensures smooth communication between departments.');

INSERT INTO personnel (id, name, email, title, department, site, building, level, space, manager, desk_phone, bio) VALUES
('test05', 'Casey Wilson', 'cwilson@mmc.com', 'Support Specialist', 'IT', 'MMC Headquarters', 'HQ Main Building', 1, '102', 'Mike Chen', '614-555-2011', 'Casey provides front-line support for internal systems and is known for their patience and problem-solving skills.');
