-- PERSONNEL with security/ABAC fields
-- clearance_level: public, low, moderate, high
-- compartment_clearances: JSON array like ["moderate:🍎", "low:🍌"]
-- access_roles: JSON array like ["employee", "manager", "administrator"]

-- EXECUTIVES - High clearance, all tenants, executive + administrator roles
INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES ('mmc', '241a6d', 'Thomas Anderson', 'tanderson@mmc.com', 'Chief Executive Officer', 'Executive', 'MMC Headquarters', 'HQ Main Building', 3, '300', NULL, 'headshots/thomas_anderson_241a6d.png', '614-555-1001', '614-555-8001', 'Thomas founded MMC in 1998 after 15 years in industrial manufacturing. He holds an MBA from Ohio State and is known for his hands-on leadership style. Outside work, he volunteers with Junior Achievement and enjoys restoring classic cars.', 'high', '["high:🍎", "high:🍌", "high:🍊", "high:🍇", "high:🍓"]', '["executive", "administrator"]');

INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES ('mmc', 'cdb964', 'Margaret Sullivan', 'msullivan@mmc.com', 'Chief Financial Officer', 'Executive', 'MMC Headquarters', 'HQ Main Building', 3, '300', 'Thomas Anderson', 'headshots/margaret_sullivan_cdb964.png', '614-555-1002', '614-555-8002', 'Margaret joined MMC in 2008 from Deloitte, bringing 20 years of financial expertise. A CPA with a focus on manufacturing operations, she led the company''s successful ERP implementation.', 'high', '["high:🍌", "high:🍊", "high:🍇"]', '["executive", "administrator"]');

INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES ('mmc', '714fd4', 'Richard Nakamura', 'rnakamura@mmc.com', 'Chief Technology Officer', 'Executive', 'MMC Headquarters', 'HQ Main Building', 3, '300', 'Thomas Anderson', 'headshots/richard_nakamura_714fd4.png', '614-555-1003', '614-555-8003', 'Richard oversees all technology initiatives and digital transformation at MMC. Previously at Rockwell Automation, he specializes in industrial IoT and smart manufacturing.', 'high', '["high:🍎", "high:🍇", "high:🍓"]', '["executive", "administrator"]');

-- IT DEPARTMENT - Moderate to high clearance, security role for network admin
INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES ('mmc', '1ea074', 'Mike Chen', 'mchen@mmc.com', 'IT Director', 'IT', 'MMC Headquarters', 'HQ Main Building', 1, '102', 'Richard Nakamura', 'headshots/mike_chen_1ea074.png', '614-555-2001', '614-555-8201', 'Mike manages the IT infrastructure across all MMC locations. With 12 years at the company, he led the network modernization project. Certified in Cisco and Microsoft technologies.', 'high', '["high:🔧", "high:🍎"]', '["manager", "administrator", "security"]');

INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES ('mmc', '7aa0d4', 'Sarah Kim', 'skim@mmc.com', 'Network Administrator', 'IT', 'MMC Headquarters', 'HQ Main Building', 1, '102', 'Mike Chen', 'headshots/sarah_kim_7aa0d4.png', '614-555-2002', '614-555-8202', 'Sarah maintains the company''s network infrastructure and security systems. She joined MMC after graduating from Purdue and is passionate about cybersecurity.', 'moderate', '["moderate:🔧"]', '["employee", "security"]');

INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES ('mmc', 'd62d4d', 'Jason Wright', 'jwright@mmc.com', 'Systems Administrator', 'IT', 'MMC Headquarters', 'HQ Main Building', 1, '102', 'Mike Chen', 'headshots/jason_wright_d62d4d.png', '614-555-2003', '614-555-8203', 'Jason handles server management and cloud operations with expertise in Windows Server, VMware, and Azure. He''s working toward his CISSP certification.', 'moderate', '["moderate:🔧"]', '["employee", "security"]');

-- HR DEPARTMENT - Moderate clearance (handles sensitive employee info)
INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES ('mmc', '4f6f43', 'Patricia Martinez', 'pmartinez@mmc.com', 'HR Director', 'HR', 'MMC Headquarters', 'HQ Main Building', 1, '101', 'Thomas Anderson', 'headshots/patricia_martinez_4f6f43.png', '614-555-3001', '614-555-8301', 'Patricia leads all human resources functions including talent acquisition and employee development. With 18 years in HR, she implemented MMC''s apprenticeship program.', 'high', '["high:🍊"]', '["manager", "administrator"]');

INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES ('mmc', 'f73c1c', 'James Wilson', 'jwilson@mmc.com', 'HR Specialist', 'HR', 'MMC Headquarters', 'HQ Main Building', 1, '101', 'Patricia Martinez', 'headshots/james_wilson_f73c1c.png', '614-555-3002', NULL, 'James focuses on employee relations and benefits administration. He''s been with MMC for 5 years and is known for his approachable manner.', 'moderate', '["moderate:🍊"]', '["employee"]');

-- ENGINEERING DEPARTMENT - Moderate clearance for R&D work
INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES ('mmc', 'd827cb', 'David Park', 'dpark@mmc.com', 'Engineering Manager', 'Engineering', 'MMC Headquarters', 'HQ Main Building', 2, '201-OP', 'Richard Nakamura', 'headshots/david_park_d827cb.png', '614-555-4001', '614-555-8401', 'David leads the mechanical engineering team developing HVAC systems. A licensed PE with 15 years of experience, he holds multiple patents.', 'high', '["high:🍎", "high:🍓"]', '["manager"]');

INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES ('mmc', 'f9c8d7', 'Jennifer Adams', 'jadams@mmc.com', 'Senior Mechanical Engineer', 'Engineering', 'MMC Headquarters', 'HQ Main Building', 2, '201-OP', 'David Park', 'headshots/jennifer_adams_f9c8d7.png', '614-555-4002', '614-555-8402', 'Jennifer specializes in thermal systems and energy efficiency. She''s led several product development projects that reduced energy consumption by 30%.', 'moderate', '["moderate:🍎", "moderate:🍓"]', '["employee"]');

INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES ('mmc', '8a0c57', 'Robert Thompson', 'rthompson@mmc.com', 'Mechanical Engineer', 'Engineering', 'MMC Headquarters', 'HQ Main Building', 2, '201-OP', 'David Park', 'headshots/robert_thompson_8a0c57.png', '614-555-4003', NULL, 'Robert focuses on product testing and quality assurance. He joined MMC after completing his master''s at University of Michigan.', 'low', '["low:🍎"]', '["employee"]');

INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES ('mmc', '8f3a18', 'Lisa Chen', 'lchen@mmc.com', 'CAD Designer', 'Engineering', 'MMC Headquarters', 'HQ Main Building', 2, '202', 'David Park', 'headshots/lisa_chen_8f3a18.png', '614-555-4004', NULL, 'Lisa creates technical drawings and 3D models for HVAC components. Expert in SolidWorks and AutoCAD with an eye for both form and function.', 'low', '["low:🍎"]', '["employee"]');

-- FINANCE DEPARTMENT - Moderate clearance for financial data
INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES ('mmc', '4fcdf6', 'Emily Rodriguez', 'erodriguez@mmc.com', 'Finance Manager', 'Finance', 'MMC Headquarters', 'HQ Main Building', 3, '301', 'Margaret Sullivan', 'headshots/emily_rodriguez_4fcdf6.png', '614-555-5001', '614-555-8501', 'Emily manages day-to-day financial operations and reporting. A CPA who streamlined the monthly close process from 10 days to 3.', 'moderate', '["moderate:🍌"]', '["manager"]');

INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES ('mmc', 'c1eddc', 'Daniel Foster', 'dfoster@mmc.com', 'Senior Accountant', 'Finance', 'MMC Headquarters', 'HQ Main Building', 3, '301', 'Emily Rodriguez', 'headshots/daniel_foster_c1eddc.png', '614-555-5002', NULL, 'Daniel handles accounts payable, receivable, and cost accounting. He''s been with MMC for 7 years and is the go-to person for SAP questions.', 'moderate', '["moderate:🍌"]', '["employee"]');

-- SALES DEPARTMENT - Low clearance, sales role
INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES ('mmc', '1e4e5c', 'Chris Miller', 'cmiller@mmc.com', 'Regional Sales Manager - Midwest', 'Sales', 'Indianapolis Regional Office', 'Indy Office Building', 1, '101', 'Thomas Anderson', 'headshots/chris_miller_1e4e5c.png', '317-555-6001', '317-555-8601', 'Chris leads sales across Indiana, Illinois, and Wisconsin. A 10-year MMC veteran, he''s grown the Midwest territory by 40%.', 'moderate', '["moderate:🍌"]', '["manager"]');

INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES ('mmc', 'e8a466', 'Amanda Johnson', 'ajohnson@mmc.com', 'Sales Representative', 'Sales', 'Indianapolis Regional Office', 'Indy Office Building', 1, '101', 'Chris Miller', 'headshots/amanda_johnson_e8a466.png', '317-555-6002', '317-555-8602', 'Amanda handles inside sales and customer support for the Midwest region. She recently earned President''s Club recognition.', 'low', '["low:🍌"]', '["employee"]');

INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES ('mmc', '4d9154', 'Kevin O''Brien', 'kobrien@mmc.com', 'Regional Sales Manager - North', 'Sales', 'Detroit Regional Office', 'Detroit Office Building', 1, '101', 'Thomas Anderson', 'headshots/kevin_obrien_4d9154.png', '313-555-7001', '313-555-8701', 'Kevin manages sales in Michigan, Minnesota, and the Great Lakes region. With 15 years in industrial sales, he''s developed key automotive accounts.', 'moderate', '["moderate:🍌"]', '["manager"]');

INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES ('mmc', '5eedf9', 'Nicole Taylor', 'ntaylor@mmc.com', 'Regional Sales Manager - East', 'Sales', 'Pittsburgh Regional Office', 'Pittsburgh Office Building', 1, '101', 'Thomas Anderson', 'headshots/nicole_taylor_5eedf9.png', '412-555-7101', '412-555-8711', 'Nicole covers Pennsylvania, New York, and the Eastern seaboard. She has an engineering background that helps her consult on complex projects.', 'moderate', '["moderate:🍌"]', '["manager"]');

-- TEST USERS - Low clearance, employee role
INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES ('mmc', 'test01', 'Alex Chen', 'achen@mmc.com', 'QA Engineer', 'IT', 'MMC Headquarters', 'HQ Main Building', 1, '102', 'Mike Chen', 'headshots/alex_chen_test01.png', '614-555-2010', NULL, 'Alex joined the IT department to focus on quality assurance and automated testing. Previously worked at a fintech startup.', 'low', '["low:🔧"]', '["employee"]');

INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES ('mmc', 'test02', 'Jordan Smith', 'jsmith@mmc.com', 'Sales Associate', 'Sales', 'Indianapolis Regional Office', 'Indy Office Building', 1, '101', 'Chris Miller', 'headshots/jordan_smith_test02.png', '317-555-6010', NULL, 'Jordan is a rising star in the Midwest sales team, bringing energy and fresh ideas to client relationships.', 'low', '["low:🍌"]', '["employee"]');

INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES ('mmc', 'test03', 'Morgan Davis', 'mdavis@mmc.com', 'Product Designer', 'Engineering', 'MMC Headquarters', 'HQ Main Building', 2, '202', 'David Park', 'headshots/morgan_davis_test03.png', '614-555-4010', NULL, 'Morgan brings a user-centered design perspective to the engineering team, bridging the gap between form and function.', 'low', '["low:🍎"]', '["employee"]');

INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES ('mmc', 'test04', 'Taylor Brown', 'tbrown@mmc.com', 'Project Manager', 'Executive', 'MMC Headquarters', 'HQ Main Building', 3, '300', 'Thomas Anderson', 'headshots/taylor_brown_test04.png', '614-555-1010', '614-555-8010', 'Taylor coordinates cross-functional projects and ensures smooth communication between departments.', 'moderate', '["moderate:🍎", "moderate:🍌", "moderate:🍇"]', '["manager"]');

INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES ('mmc', 'test05', 'Casey Wilson', 'cwilson@mmc.com', 'Support Specialist', 'IT', 'MMC Headquarters', 'HQ Main Building', 1, '102', 'Mike Chen', 'headshots/casey_wilson_test05.png', '614-555-2011', NULL, 'Casey provides front-line support for internal systems and is known for their patience and problem-solving skills.', 'low', '["low:🔧"]', '["employee"]');

-- CUSTOMER SERVICE DEPARTMENT - Customer-facing support team
INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES ('mmc', 'cs001', 'Rachel Green', 'rgreen@mmc.com', 'Customer Service Manager', 'Customer Service', 'MMC Headquarters', 'HQ Main Building', 1, '105', 'Thomas Anderson', 'headshots/rachel_green_cs001.png', '614-555-9001', '614-555-9901', 'Rachel leads the customer service team with 10 years of experience in client relations.', 'moderate', '["moderate:🍓"]', '["manager"]');

INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES ('mmc', 'cs002', 'Marcus Johnson', 'marjohnson@mmc.com', 'Customer Support Specialist', 'Customer Service', 'MMC Headquarters', 'HQ Main Building', 1, '105', 'Rachel Green', 'headshots/marcus_johnson_cs002.png', '614-555-9002', NULL, 'Marcus handles technical support inquiries with product expertise.', 'low', '["low:🍓"]', '["employee"]');

INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES ('mmc', 'cs003', 'Sophia Lee', 'slee@mmc.com', 'Customer Support Specialist', 'Customer Service', 'MMC Headquarters', 'HQ Main Building', 1, '105', 'Rachel Green', 'headshots/sophia_lee_cs003.png', '614-555-9003', NULL, 'Sophia specializes in warranty claims and parts ordering.', 'low', '["low:🍓"]', '["employee"]');

-- MANUFACTURING DEPARTMENT - Production and quality control
INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES ('mmc', 'mf001', 'Jennifer Walsh', 'jwalsh@mmc.com', 'Plant Manager', 'Manufacturing', 'MMC Headquarters', 'Manufacturing Plant', 1, 'MP-100', 'Thomas Anderson', 'headshots/jennifer_walsh_mf001.png', '614-555-8001', '614-555-8801', 'Jennifer oversees all manufacturing operations with 20 years in industrial production.', 'moderate', '["moderate:🍇"]', '["manager"]');

INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES ('mmc', 'mf002', 'Carlos Rodriguez', 'crodriguez@mmc.com', 'Production Supervisor', 'Manufacturing', 'MMC Headquarters', 'Manufacturing Plant', 1, 'MP-101', 'Jennifer Walsh', 'headshots/carlos_rodriguez_mf002.png', '614-555-8002', NULL, 'Carlos manages the day shift production line with expertise in CNC machining.', 'low', '["low:🍇"]', '["employee"]');

INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES ('mmc', 'mf003', 'Maria Santos', 'msantos@mmc.com', 'Quality Control Inspector', 'Manufacturing', 'MMC Headquarters', 'Manufacturing Plant', 1, 'MP-102', 'Jennifer Walsh', 'headshots/maria_santos_mf003.png', '614-555-8003', NULL, 'Maria ensures all products meet quality standards. Certified in Six Sigma.', 'low', '["low:🍇"]', '["employee"]');

INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES ('mmc', 'mf004', 'Derek Williams', 'dewilliams@mmc.com', 'Assembly Technician', 'Manufacturing', 'MMC Headquarters', 'Manufacturing Plant', 1, 'MP-103', 'Carlos Rodriguez', 'headshots/derek_williams_mf004.png', '614-555-8004', NULL, 'Derek is a skilled technician with expertise in HVAC system assembly.', 'low', '["low:🍇"]', '["employee"]');

-- OPERATIONS DEPARTMENT - Warehouse and logistics
INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES ('mmc', 'op001', 'Brian Mitchell', 'bmitchell@mmc.com', 'Operations Manager', 'Operations', 'MMC Headquarters', 'Distribution Center', 1, 'DC-100', 'Thomas Anderson', 'headshots/brian_mitchell_op001.png', '614-555-7001', '614-555-7701', 'Brian manages warehouse operations and logistics with 99.5% on-time delivery.', 'moderate', '["moderate:🍌"]', '["manager"]');

INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES ('mmc', 'op002', 'Linda Chen', 'lnchen@mmc.com', 'Warehouse Supervisor', 'Operations', 'MMC Headquarters', 'Distribution Center', 1, 'DC-101', 'Brian Mitchell', NULL, '614-555-7002', NULL, 'Linda oversees inventory management and order fulfillment.', 'low', '["low:🍌"]', '["employee"]');

INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES ('mmc', 'op003', 'Steve Harris', 'sharris@mmc.com', 'Logistics Coordinator', 'Operations', 'MMC Headquarters', 'Distribution Center', 1, 'DC-102', 'Brian Mitchell', NULL, '614-555-7003', NULL, 'Steve coordinates shipping with carriers and manages freight logistics.', 'low', '["low:🍌"]', '["employee"]');


-- ============================================================================
-- PHASE 2 EXPANSION - ADDITIONAL PERSONNEL (~60 users)
-- ============================================================================

-- ENGINEERING EXPANSION (+10)
INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES 
('mmc', 'eng006', 'Michael Torres', 'mtorres@mmc.com', 'Senior Engineer', 'Engineering', 'MMC Headquarters', 'HQ Main Building', 2, '203', 'David Park', NULL, '614-555-4101', NULL, 'Michael specializes in automation systems and robotics integration.', 'moderate', '["moderate:🍎"]', '["employee"]'),
('mmc', 'eng007', 'Priya Sharma', 'psharma@mmc.com', 'Electrical Engineer', 'Engineering', 'MMC Headquarters', 'HQ Main Building', 2, '203', 'David Park', NULL, '614-555-4102', NULL, 'Priya focuses on control systems and circuit design for HVAC units.', 'moderate', '["moderate:🍎"]', '["employee"]'),
('mmc', 'eng008', 'Kevin Zhang', 'kzhang@mmc.com', 'R&D Engineer', 'Engineering', 'MMC Headquarters', 'HQ Main Building', 2, '203', 'David Park', NULL, '614-555-4103', NULL, 'Kevin leads prototyping efforts for next-gen product lines.', 'high', '["high:🍎", "high:🍓"]', '["employee"]'),
('mmc', 'eng009', 'Sarah Johnson', 'sjohnson@mmc.com', 'Structural Engineer', 'Engineering', 'MMC Headquarters', 'HQ Main Building', 2, '204', 'David Park', NULL, '614-555-4104', NULL, 'Sarah ensures structural integrity of large-scale industrial units.', 'low', '["low:🍎"]', '["employee"]'),
('mmc', 'eng010', 'Marcus Williams', 'mwilliams@mmc.com', 'Systems Engineer', 'Engineering', 'MMC Headquarters', 'HQ Main Building', 2, '204', 'David Park', NULL, '614-555-4105', NULL, 'Marcus integrates mechanical and electrical subsystems.', 'moderate', '["moderate:🍎"]', '["employee"]'),
('mmc', 'eng011', 'Elena Vasquez', 'evasquez@mmc.com', 'Project Engineer', 'Engineering', 'MMC Headquarters', 'HQ Main Building', 2, '204', 'David Park', NULL, '614-555-4106', NULL, 'Elena manages timeline and deliverables for key engineering projects.', 'low', '["low:🍎"]', '["employee"]'),
('mmc', 'eng012', 'James O''Connell', 'joconnell@mmc.com', 'Junior Engineer', 'Engineering', 'MMC Headquarters', 'HQ Main Building', 2, '205', 'Jennifer Adams', NULL, '614-555-4107', NULL, 'James supports the senior team with drafting and testing.', 'low', '["low:🍎"]', '["employee"]'),
('mmc', 'eng013', 'Fatima Al-Sayed', 'falsayed@mmc.com', 'CAD Technician', 'Engineering', 'MMC Headquarters', 'HQ Main Building', 2, '205', 'Lisa Chen', NULL, '614-555-4108', NULL, 'Fatima assists with detailed modeling and documentation.', 'low', '["low:🍎"]', '["employee"]'),
('mmc', 'eng014', 'Robert Chang', 'rchang@mmc.com', 'Test Engineer', 'Engineering', 'MMC Headquarters', 'HQ Main Building', 2, '205', 'Robert Thompson', NULL, '614-555-4109', NULL, 'Robert runs durability and performance tests in the lab.', 'moderate', '["moderate:🍎"]', '["employee"]'),
('mmc', 'eng015', 'Amanda White', 'awhite@mmc.com', 'Process Engineer', 'Engineering', 'MMC Headquarters', 'HQ Main Building', 2, '205', 'David Park', NULL, '614-555-4110', NULL, 'Amanda optimizes engineering workflows and toolsets.', 'moderate', '["moderate:🍎"]', '["employee"]');

-- MANUFACTURING EXPANSION (+11)
INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES 
('mmc', 'mfg005', 'Paul Miller', 'pmiller@mmc.com', 'Production Lead', 'Manufacturing', 'MMC Headquarters', 'Manufacturing Plant', 1, 'MP-105', 'Jennifer Walsh', NULL, '614-555-8101', NULL, 'Paul supervises the evening shift production team.', 'moderate', '["moderate:🍇"]', '["manager"]'),
('mmc', 'mfg006', 'Quentin Baker', 'qbaker@mmc.com', 'Machine Operator', 'Manufacturing', 'MMC Headquarters', 'Manufacturing Plant', 1, 'MP-106', 'Paul Miller', NULL, '614-555-8102', NULL, 'Quentin operates CNC milling machines.', 'low', '["low:🍇"]', '["employee"]'),
('mmc', 'mfg007', 'Rachel Scott', 'rscott@mmc.com', 'Assembly Tech', 'Manufacturing', 'MMC Headquarters', 'Manufacturing Plant', 1, 'MP-106', 'Paul Miller', NULL, '614-555-8103', NULL, 'Rachel specializes in final assembly of HVAC units.', 'low', '["low:🍇"]', '["employee"]'),
('mmc', 'mfg008', 'Samuel Green', 'sgreen@mmc.com', 'Material Handler', 'Manufacturing', 'MMC Headquarters', 'Manufacturing Plant', 1, 'MP-107', 'Paul Miller', NULL, '614-555-8104', NULL, 'Samuel ensures parts are stocked at assembly stations.', 'low', '["low:🍇"]', '["employee"]'),
('mmc', 'mfg009', 'Tina Turner', 'tturner@mmc.com', 'Quality Inspector', 'Manufacturing', 'MMC Headquarters', 'Manufacturing Plant', 1, 'MP-107', 'Maria Santos', NULL, '614-555-8105', NULL, 'Tina performs visual and functional inspections.', 'low', '["low:🍇"]', '["employee"]'),
('mmc', 'mfg010', 'Umar Khan', 'ukhan@mmc.com', 'Maintenance Tech', 'Manufacturing', 'MMC Headquarters', 'Manufacturing Plant', 1, 'MP-108', 'Jennifer Walsh', NULL, '614-555-8106', NULL, 'Umar performs preventative maintenance on plant equipment.', 'low', '["low:🍇"]', '["employee"]'),
('mmc', 'mfg011', 'Victor Hugo', 'vhugo@mmc.com', 'Safety Officer', 'Manufacturing', 'MMC Headquarters', 'Manufacturing Plant', 1, 'MP-108', 'Jennifer Walsh', NULL, '614-555-8107', NULL, 'Victor ensures compliance with OSHA regulations.', 'moderate', '["moderate:🍇"]', '["manager"]'),
('mmc', 'mfg012', 'Wendy Li', 'wli@mmc.com', 'Production Planner', 'Manufacturing', 'MMC Headquarters', 'Manufacturing Plant', 1, 'MP-109', 'Jennifer Walsh', NULL, '614-555-8108', NULL, 'Wendy schedules production runs based on demand.', 'low', '["low:🍇"]', '["employee"]'),
('mmc', 'mfg013', 'Xavier Rhodes', 'xrhodes@mmc.com', 'Assembly Tech', 'Manufacturing', 'MMC Headquarters', 'Manufacturing Plant', 1, 'MP-110', 'Carlos Rodriguez', NULL, '614-555-8109', NULL, 'Xavier works on the sub-assembly line.', 'low', '["low:🍇"]', '["employee"]'),
('mmc', 'mfg014', 'Yara Shah', 'yshah@mmc.com', 'Machine Operator', 'Manufacturing', 'MMC Headquarters', 'Manufacturing Plant', 1, 'MP-110', 'Carlos Rodriguez', NULL, '614-555-8110', NULL, 'Yara operates stamping presses and metal forming tools.', 'low', '["low:🍇"]', '["employee"]'),
('mmc', 'mfg015', 'Zachary Stone', 'zstone@mmc.com', 'Logistics Liaison', 'Manufacturing', 'MMC Headquarters', 'Manufacturing Plant', 1, 'MP-111', 'Jennifer Walsh', NULL, '614-555-8111', NULL, 'Zachary coordinates with operations for material flow.', 'low', '["low:🍇"]', '["employee"]');

-- SALES EXPANSION (+6)
INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES 
('mmc', 'sales07', 'Daniel LaRusso', 'dlarusso@mmc.com', 'Sales Rep - West', 'Sales', 'Los Angeles Field Office', 'LA Office', 1, '100', 'Thomas Anderson', NULL, '310-555-6101', '310-555-8611', 'Daniel manages key accounts in California and Nevada.', 'low', '["low:🍌"]', '["employee"]'),
('mmc', 'sales08', 'Eleanor Rigby', 'erigby@mmc.com', 'Account Manager', 'Sales', 'MMC Headquarters', 'HQ Main Building', 1, '103', 'Chris Miller', NULL, '614-555-6102', NULL, 'Eleanor handles national key accounts and contracts.', 'moderate', '["moderate:🍌"]', '["employee"]'),
('mmc', 'sales09', 'Frank Castle', 'fcastle@mmc.com', 'Sales Engineer', 'Sales', 'MMC Headquarters', 'HQ Main Building', 1, '103', 'Chris Miller', NULL, '614-555-6103', NULL, 'Frank provides technical support during the sales process.', 'low', '["low:🍌"]', '["employee"]'),
('mmc', 'sales10', 'Gina Torres', 'gtorres@mmc.com', 'Business Development', 'Sales', 'MMC Headquarters', 'HQ Main Building', 1, '103', 'Chris Miller', NULL, '614-555-6104', NULL, 'Gina identifies new market opportunities in the health sector.', 'low', '["low:🍌"]', '["employee"]'),
('mmc', 'sales11', 'Harry Kim', 'hkim@mmc.com', 'Sales Associate', 'Sales', 'Indianapolis Regional Office', 'Indy Office Building', 1, '101', 'Chris Miller', NULL, '317-555-6105', NULL, 'Harry supports the Midwest team with lead generation.', 'low', '["low:🍌"]', '["employee"]'),
('mmc', 'sales12', 'Iris West', 'iwest@mmc.com', 'Sales Coordinator', 'Sales', 'MMC Headquarters', 'HQ Main Building', 1, '103', 'Chris Miller', NULL, '614-555-6106', NULL, 'Iris manages sales data and CRM updates.', 'low', '["low:🍌"]', '["employee"]');

-- OPERATIONS EXPANSION (+6)
INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES 
('mmc', 'ops004', 'Jack Ryan', 'jryan@mmc.com', 'Logistics Analyst', 'Operations', 'MMC Headquarters', 'Distribution Center', 1, 'DC-103', 'Brian Mitchell', NULL, '614-555-7101', NULL, 'Jack analyzes shipping routes for cost optimization.', 'low', '["low:🍌"]', '["employee"]'),
('mmc', 'ops005', 'Kara Danvers', 'kdanvers@mmc.com', 'Warehouse Lead', 'Operations', 'MMC Headquarters', 'Distribution Center', 1, 'DC-103', 'Linda Chen', NULL, '614-555-7102', NULL, 'Kara organizes shift schedules and safety training.', 'low', '["low:🍌"]', '["employee"]'),
('mmc', 'ops006', 'Luke Cage', 'lcage@mmc.com', 'Inventory Specialist', 'Operations', 'MMC Headquarters', 'Distribution Center', 1, 'DC-104', 'Linda Chen', NULL, '614-555-7103', NULL, 'Luke manages cycle counts and inventory reconciliations.', 'low', '["low:🍌"]', '["employee"]'),
('mmc', 'ops007', 'Matt Murdock', 'mmurdock@mmc.com', 'Operations Coordinator', 'Operations', 'MMC Headquarters', 'Distribution Center', 1, 'DC-104', 'Brian Mitchell', NULL, '614-555-7104', NULL, 'Matt handles compliance and regulatory documentation.', 'low', '["low:🍌"]', '["employee"]'),
('mmc', 'ops008', 'Natasha Roman', 'nroman@mmc.com', 'Supply Chain Coord', 'Operations', 'MMC Headquarters', 'Distribution Center', 1, 'DC-105', 'Steve Harris', NULL, '614-555-7105', NULL, 'Natasha tracks inbound shipments from suppliers.', 'low', '["low:🍌"]', '["employee"]'),
('mmc', 'ops009', 'Oliver Queen', 'oqueen@mmc.com', 'Fleet Manager', 'Operations', 'MMC Headquarters', 'Distribution Center', 1, 'DC-105', 'Brian Mitchell', NULL, '614-555-7106', NULL, 'Oliver manages the company truck fleet and maintenance.', 'moderate', '["moderate:🍌"]', '["employee"]');

-- IT EXPANSION (+4)
INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES 
('mmc', 'it007', 'David Kim', 'dkim@mmc.com', 'Security Analyst', 'IT', 'MMC Headquarters', 'HQ Main Building', 1, '102', 'Sarah Kim', NULL, '614-555-2101', NULL, 'David monitors SIEM logs for security anomalies.', 'moderate', '["moderate:🔧", "moderate:🍎"]', '["employee", "security"]'),
('mmc', 'it008', 'Elena Rodriguez', 'erodriguez2@mmc.com', 'IT Support Specialist', 'IT', 'MMC Headquarters', 'HQ Main Building', 1, '102', 'Casey Wilson', NULL, '614-555-2102', NULL, 'Elena assists users with hardware and software issues.', 'low', '["low:🔧"]', '["employee"]'),
('mmc', 'it009', 'Frank Wright', 'fwright@mmc.com', 'Network Engineer', 'IT', 'MMC Headquarters', 'HQ Main Building', 1, '102', 'Sarah Kim', NULL, '614-555-2103', NULL, 'Frank supports network upgrades and cabling.', 'low', '["low:🔧"]', '["employee"]'),
('mmc', 'it010', 'Grace Lee', 'glee@mmc.com', 'Database Administrator', 'IT', 'MMC Headquarters', 'HQ Main Building', 1, '102', 'Mike Chen', NULL, '614-555-2104', NULL, 'Grace manages SQL Server and PostgreSQL instances.', 'high', '["high:🔧", "high:🍎"]', '["employee"]');

-- CUSTOMER SERVICE EXPANSION (+7)
INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES 
('mmc', 'cs004', 'Hannah Jordan', 'hjordan@mmc.com', 'CS Rep', 'Customer Service', 'MMC Headquarters', 'HQ Main Building', 1, '105', 'Rachel Green', NULL, '614-555-9101', NULL, 'Hannah handles general inquiries and order tracking.', 'low', '["low:🍓"]', '["employee"]'),
('mmc', 'cs005', 'Ian Vance', 'ivance@mmc.com', 'Tech Support', 'Customer Service', 'MMC Headquarters', 'HQ Main Building', 1, '105', 'Marcus Johnson', NULL, '614-555-9102', NULL, 'Ian walks customers through troubleshooting steps.', 'low', '["low:🍓"]', '["employee"]'),
('mmc', 'cs006', 'Jessica Jones', 'jjones@mmc.com', 'Support Specialist', 'Customer Service', 'MMC Headquarters', 'HQ Main Building', 1, '105', 'Marcus Johnson', NULL, '614-555-9103', NULL, 'Jessica handles complex billing and account issues.', 'low', '["low:🍓"]', '["employee"]'),
('mmc', 'cs007', 'Kate Bishop', 'kbishop@mmc.com', 'CS Team Lead', 'Customer Service', 'MMC Headquarters', 'HQ Main Building', 1, '105', 'Rachel Green', NULL, '614-555-9104', NULL, 'Kate trains new hires and handles escalations.', 'moderate', '["moderate:🍓"]', '["manager"]'),
('mmc', 'cs008', 'Liam Neeson', 'lneeson@mmc.com', 'Account Specialist', 'Customer Service', 'MMC Headquarters', 'HQ Main Building', 1, '105', 'Rachel Green', NULL, '614-555-9105', NULL, 'Liam manages dedicated support for VIP clients.', 'low', '["low:🍓"]', '["employee"]'),
('mmc', 'cs009', 'Mary Jane', 'mjane@mmc.com', 'Service Coordinator', 'Customer Service', 'MMC Headquarters', 'HQ Main Building', 1, '105', 'Rachel Green', NULL, '614-555-9106', NULL, 'Mary coordinates technician visits for field repairs.', 'low', '["low:🍓"]', '["employee"]'),
('mmc', 'cs010', 'Nick Fury', 'nfury@mmc.com', 'Customer Success Mgr', 'Customer Service', 'MMC Headquarters', 'HQ Main Building', 1, '105', 'Rachel Green', NULL, '614-555-9107', NULL, 'Nick ensures long-term satisfaction for enterprise accounts.', 'moderate', '["moderate:🍓"]', '["manager"]');

-- HR EXPANSION (+6)
INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES 
('mmc', 'hr003', 'Holly Scott', 'hscott@mmc.com', 'HR Generalist', 'HR', 'MMC Headquarters', 'HQ Main Building', 1, '101', 'Patricia Martinez', NULL, '614-555-3101', NULL, 'Holly assists with onboarding and policy questions.', 'moderate', '["moderate:🍊"]', '["employee"]'),
('mmc', 'hr004', 'Isaac Vance', 'ivance2@mmc.com', 'Recruiter', 'HR', 'MMC Headquarters', 'HQ Main Building', 1, '101', 'Patricia Martinez', NULL, '614-555-3102', NULL, 'Isaac manages the hiring pipeline for technical roles.', 'low', '["low:🍊"]', '["employee"]'),
('mmc', 'hr005', 'Julia Patel', 'jpatel@mmc.com', 'Benefits Coordinator', 'HR', 'MMC Headquarters', 'HQ Main Building', 1, '101', 'Patricia Martinez', NULL, '614-555-3103', NULL, 'Julia administers health insurance and 401k programs.', 'moderate', '["moderate:🍊"]', '["employee"]'),
('mmc', 'hr006', 'Kevin Duran', 'kduran@mmc.com', 'Training Specialist', 'HR', 'MMC Headquarters', 'HQ Main Building', 1, '101', 'Patricia Martinez', NULL, '614-555-3104', NULL, 'Kevin develops and delivers employee training modules.', 'low', '["low:🍊"]', '["employee"]'),
('mmc', 'hr007', 'Laura Miles', 'lmiles@mmc.com', 'HR Assistant', 'HR', 'MMC Headquarters', 'HQ Main Building', 1, '101', 'Holly Scott', NULL, '614-555-3105', NULL, 'Laura supports administrative HR tasks and scheduling.', 'low', '["low:🍊"]', '["employee"]'),
('mmc', 'hr008', 'Mark Olson', 'molson@mmc.com', 'Compensation Analyst', 'HR', 'MMC Headquarters', 'HQ Main Building', 1, '101', 'Patricia Martinez', NULL, '614-555-3106', NULL, 'Mark analyzes salary data to ensure competitive pay.', 'moderate', '["moderate:🍊"]', '["employee"]');

-- FINANCE EXPANSION (+6)
INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES 
('mmc', 'fin003', 'Xavier Gray', 'xgray@mmc.com', 'Financial Analyst', 'Finance', 'MMC Headquarters', 'HQ Main Building', 3, '301', 'Emily Rodriguez', NULL, '614-555-5101', NULL, 'Xavier tracks budget variances and forecasts.', 'moderate', '["moderate:🍌"]', '["employee"]'),
('mmc', 'fin004', 'Yvonne Cole', 'ycole@mmc.com', 'Payroll Specialist', 'Finance', 'MMC Headquarters', 'HQ Main Building', 3, '301', 'Emily Rodriguez', NULL, '614-555-5102', NULL, 'Yvonne processes bi-weekly payroll for all employees.', 'moderate', '["moderate:🍌", "moderate:🍊"]', '["employee"]'),
('mmc', 'fin005', 'Zachary King', 'zking@mmc.com', 'Accountant', 'Finance', 'MMC Headquarters', 'HQ Main Building', 3, '301', 'Daniel Foster', NULL, '614-555-5103', NULL, 'Zachary assists with month-end close and reconciliations.', 'low', '["low:🍌"]', '["employee"]'),
('mmc', 'fin006', 'Alice Vance', 'avance@mmc.com', 'Controller', 'Finance', 'MMC Headquarters', 'HQ Main Building', 3, '301', 'Margaret Sullivan', NULL, '614-555-5104', NULL, 'Alice oversees accounting operations and internal controls.', 'high', '["high:🍌"]', '["manager"]'),
('mmc', 'fin007', 'Bob Ross', 'bross@mmc.com', 'Internal Auditor', 'Finance', 'MMC Headquarters', 'HQ Main Building', 3, '301', 'Margaret Sullivan', NULL, '614-555-5105', NULL, 'Bob validates financial compliance and process integrity.', 'high', '["high:🍌"]', '["employee"]'),
('mmc', 'fin008', 'Carol Danvers', 'cdanvers@mmc.com', 'Tax Specialist', 'Finance', 'MMC Headquarters', 'HQ Main Building', 3, '301', 'Emily Rodriguez', NULL, '614-555-5106', NULL, 'Carol manages corporate tax filings and compliance.', 'moderate', '["moderate:🍌"]', '["employee"]');

-- EXECUTIVE EXPANSION (+1)
INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, clearance_level, compartment_clearances, access_roles) VALUES 
('mmc', 'exec06', 'Diana Prince', 'dprince@mmc.com', 'Chief Operating Officer', 'Executive', 'MMC Headquarters', 'HQ Main Building', 3, '300', 'Thomas Anderson', NULL, '614-555-1004', '614-555-8004', 'Diana oversees daily operations and executes business strategy. Extensive background in global supply chain management.', 'high', '["high:🍎", "high:🍌", "high:🍊", "high:🍇"]', '["executive", "administrator"]');

-- AI AGENTS - Synthetic personas for simulation
INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, is_agent, clearance_level, compartment_clearances, access_roles) VALUES ('mmc', 'agent01', 'ARIA', 'aria@mmc.com', 'AI Research Assistant', 'IT', 'MMC Headquarters', 'HQ Main Building', 1, '102-AI', 'Mike Chen', NULL, NULL, NULL, 'ARIA (Artificial Research & Intelligence Agent) assists with data analysis, research synthesis, and technical documentation. Designed to support engineering and IT teams with information retrieval and analysis tasks.', 1, 'low', '["low:🔧"]', '["employee"]');

INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, is_agent, clearance_level, compartment_clearances, access_roles) VALUES ('mmc', 'agent02', 'SAGE', 'sage@mmc.com', 'AI Sales Guide', 'Sales', 'MMC Headquarters', 'HQ Main Building', 1, '103-AI', 'Thomas Anderson', NULL, NULL, NULL, 'SAGE (Sales Automation & Guidance Engine) supports the sales team with customer insights, proposal generation, and market analysis. Specializes in helping sales representatives prepare for client meetings.', 1, 'low', '["low:🍌"]', '["employee"]');

INSERT INTO personnel (profile_id, id, name, email, title, department, site, building, level, space, manager, photo, desk_phone, cell_phone, bio, is_agent, clearance_level, compartment_clearances, access_roles) VALUES ('mmc', 'agent03', 'OTTO', 'otto@mmc.com', 'AI Operations Optimizer', 'Operations', 'MMC Headquarters', 'Manufacturing Plant', 1, 'MP-AI', 'Jennifer Walsh', NULL, NULL, NULL, 'OTTO (Operations & Task Tracking Orchestrator) monitors production schedules, tracks inventory levels, and coordinates logistics. Helps the operations team optimize workflows and identify bottlenecks.', 1, 'low', '["low:🍌"]', '["employee"]');

-- Auto-generated headshot path updates for missing personnel photos
-- File: alice_vance_fin008.png
UPDATE personnel SET photo = 'headshots/alice_vance_fin008.png' WHERE profile_id = 'mmc' AND id = 'fin008';
-- File: amanda_white_eng015.png
UPDATE personnel SET photo = 'headshots/amanda_white_eng015.png' WHERE profile_id = 'mmc' AND id = 'eng015';
-- File: aria_agent01.png
UPDATE personnel SET photo = 'headshots/aria_agent01.png' WHERE profile_id = 'mmc' AND id = 'agent01';
-- File: bob_ross_fin009.png
UPDATE personnel SET photo = 'headshots/bob_ross_fin009.png' WHERE profile_id = 'mmc' AND id = 'fin009';
-- File: carol_danvers_fin010.png
UPDATE personnel SET photo = 'headshots/carol_danvers_fin010.png' WHERE profile_id = 'mmc' AND id = 'fin010';
-- File: daniel_larusso_sales07.png
UPDATE personnel SET photo = 'headshots/daniel_larusso_sales07.png' WHERE profile_id = 'mmc' AND id = 'sales07';
-- File: david_kim_it007.png
UPDATE personnel SET photo = 'headshots/david_kim_it007.png' WHERE profile_id = 'mmc' AND id = 'it007';
-- File: diana_prince_exec06.png
UPDATE personnel SET photo = 'headshots/diana_prince_exec06.png' WHERE profile_id = 'mmc' AND id = 'exec06';
-- File: eleanor_rigby_sales08.png
UPDATE personnel SET photo = 'headshots/eleanor_rigby_sales08.png' WHERE profile_id = 'mmc' AND id = 'sales08';
-- File: elena_rodriguez_it008.png
UPDATE personnel SET photo = 'headshots/elena_rodriguez_it008.png' WHERE profile_id = 'mmc' AND id = 'it008';
-- File: elena_vasquez_eng011.png
UPDATE personnel SET photo = 'headshots/elena_vasquez_eng011.png' WHERE profile_id = 'mmc' AND id = 'eng011';
-- File: fatima_alsayed_eng013.png
UPDATE personnel SET photo = 'headshots/fatima_alsayed_eng013.png' WHERE profile_id = 'mmc' AND id = 'eng013';
-- File: frank_castle_sales09.png
UPDATE personnel SET photo = 'headshots/frank_castle_sales09.png' WHERE profile_id = 'mmc' AND id = 'sales09';
-- File: frank_wright_it009.png
UPDATE personnel SET photo = 'headshots/frank_wright_it009.png' WHERE profile_id = 'mmc' AND id = 'it009';
-- File: gina_torres_sales10.png
UPDATE personnel SET photo = 'headshots/gina_torres_sales10.png' WHERE profile_id = 'mmc' AND id = 'sales10';
-- File: grace_lee_it010.png
UPDATE personnel SET photo = 'headshots/grace_lee_it010.png' WHERE profile_id = 'mmc' AND id = 'it010';
-- File: hannah_jordan_cs004.png
UPDATE personnel SET photo = 'headshots/hannah_jordan_cs004.png' WHERE profile_id = 'mmc' AND id = 'cs004';
-- File: harry_kim_sales11.png
UPDATE personnel SET photo = 'headshots/harry_kim_sales11.png' WHERE profile_id = 'mmc' AND id = 'sales11';
-- File: holly_scott_hr003.png
UPDATE personnel SET photo = 'headshots/holly_scott_hr003.png' WHERE profile_id = 'mmc' AND id = 'hr003';
-- File: ian_vance_cs005.png
UPDATE personnel SET photo = 'headshots/ian_vance_cs005.png' WHERE profile_id = 'mmc' AND id = 'cs005';
-- File: iris_west_sales12.png
UPDATE personnel SET photo = 'headshots/iris_west_sales12.png' WHERE profile_id = 'mmc' AND id = 'sales12';
-- File: isaac_vance_hr004.png
UPDATE personnel SET photo = 'headshots/isaac_vance_hr004.png' WHERE profile_id = 'mmc' AND id = 'hr004';
-- File: jack_ryan_ops004.png
UPDATE personnel SET photo = 'headshots/jack_ryan_ops004.png' WHERE profile_id = 'mmc' AND id = 'ops004';
-- File: james_oconnell_eng012.png
UPDATE personnel SET photo = 'headshots/james_oconnell_eng012.png' WHERE profile_id = 'mmc' AND id = 'eng012';
-- File: jessica_jones_cs006.png
UPDATE personnel SET photo = 'headshots/jessica_jones_cs006.png' WHERE profile_id = 'mmc' AND id = 'cs006';
-- File: julia_patel_hr005.png
UPDATE personnel SET photo = 'headshots/julia_patel_hr005.png' WHERE profile_id = 'mmc' AND id = 'hr005';
-- File: kara_danvers_ops005.png
UPDATE personnel SET photo = 'headshots/kara_danvers_ops005.png' WHERE profile_id = 'mmc' AND id = 'ops005';
-- File: kate_bishop_cs007.png
UPDATE personnel SET photo = 'headshots/kate_bishop_cs007.png' WHERE profile_id = 'mmc' AND id = 'cs007';
-- File: kevin_duran_hr006.png
UPDATE personnel SET photo = 'headshots/kevin_duran_hr006.png' WHERE profile_id = 'mmc' AND id = 'hr006';
-- File: kevin_zhang_eng008.png
UPDATE personnel SET photo = 'headshots/kevin_zhang_eng008.png' WHERE profile_id = 'mmc' AND id = 'eng008';
-- File: laura_miles_hr007.png
UPDATE personnel SET photo = 'headshots/laura_miles_hr007.png' WHERE profile_id = 'mmc' AND id = 'hr007';
-- File: liam_neeson_cs008.png
UPDATE personnel SET photo = 'headshots/liam_neeson_cs008.png' WHERE profile_id = 'mmc' AND id = 'cs008';
-- File: linda_chen_op002.png
UPDATE personnel SET photo = 'headshots/linda_chen_op002.png' WHERE profile_id = 'mmc' AND id = 'op002';
-- File: luke_cage_ops006.png
UPDATE personnel SET photo = 'headshots/luke_cage_ops006.png' WHERE profile_id = 'mmc' AND id = 'ops006';
-- File: marcus_williams_eng010.png
UPDATE personnel SET photo = 'headshots/marcus_williams_eng010.png' WHERE profile_id = 'mmc' AND id = 'eng010';
-- File: mark_olson_hr008.png
UPDATE personnel SET photo = 'headshots/mark_olson_hr008.png' WHERE profile_id = 'mmc' AND id = 'hr008';
-- File: mary_jane_cs009.png
UPDATE personnel SET photo = 'headshots/mary_jane_cs009.png' WHERE profile_id = 'mmc' AND id = 'cs009';
-- File: matt_murdock_ops007.png
UPDATE personnel SET photo = 'headshots/matt_murdock_ops007.png' WHERE profile_id = 'mmc' AND id = 'ops007';
-- File: michael_torres_eng006.png
UPDATE personnel SET photo = 'headshots/michael_torres_eng006.png' WHERE profile_id = 'mmc' AND id = 'eng006';
-- File: natasha_roman_ops008.png
UPDATE personnel SET photo = 'headshots/natasha_roman_ops008.png' WHERE profile_id = 'mmc' AND id = 'ops008';
-- File: nick_fury_cs010.png
UPDATE personnel SET photo = 'headshots/nick_fury_cs010.png' WHERE profile_id = 'mmc' AND id = 'cs010';
-- File: oliver_queen_ops009.png
UPDATE personnel SET photo = 'headshots/oliver_queen_ops009.png' WHERE profile_id = 'mmc' AND id = 'ops009';
-- File: otto_agent03.png
UPDATE personnel SET photo = 'headshots/otto_agent03.png' WHERE profile_id = 'mmc' AND id = 'agent03';
-- File: paul_miller_mfg005.png
UPDATE personnel SET photo = 'headshots/paul_miller_mfg005.png' WHERE profile_id = 'mmc' AND id = 'mfg005';
-- File: priya_sharma_eng007.png
UPDATE personnel SET photo = 'headshots/priya_sharma_eng007.png' WHERE profile_id = 'mmc' AND id = 'eng007';
-- File: quentin_baker_mfg006.png
UPDATE personnel SET photo = 'headshots/quentin_baker_mfg006.png' WHERE profile_id = 'mmc' AND id = 'mfg006';
-- File: rachel_scott_mfg007.png
UPDATE personnel SET photo = 'headshots/rachel_scott_mfg007.png' WHERE profile_id = 'mmc' AND id = 'mfg007';
-- File: robert_chang_eng014.png
UPDATE personnel SET photo = 'headshots/robert_chang_eng014.png' WHERE profile_id = 'mmc' AND id = 'eng014';
-- File: sage_agent02.png
UPDATE personnel SET photo = 'headshots/sage_agent02.png' WHERE profile_id = 'mmc' AND id = 'agent02';
-- File: samuel_green_mfg008.png
UPDATE personnel SET photo = 'headshots/samuel_green_mfg008.png' WHERE profile_id = 'mmc' AND id = 'mfg008';
-- File: sarah_johnson_eng009.png
UPDATE personnel SET photo = 'headshots/sarah_johnson_eng009.png' WHERE profile_id = 'mmc' AND id = 'eng009';
-- File: steve_harris_op003.png
UPDATE personnel SET photo = 'headshots/steve_harris_op003.png' WHERE profile_id = 'mmc' AND id = 'op003';
-- File: tina_turner_mfg009.png
UPDATE personnel SET photo = 'headshots/tina_turner_mfg009.png' WHERE profile_id = 'mmc' AND id = 'mfg009';
-- File: umar_khan_mfg010.png
UPDATE personnel SET photo = 'headshots/umar_khan_mfg010.png' WHERE profile_id = 'mmc' AND id = 'mfg010';
-- File: victor_hugo_mfg011.png
UPDATE personnel SET photo = 'headshots/victor_hugo_mfg011.png' WHERE profile_id = 'mmc' AND id = 'mfg011';
-- File: wendy_li_mfg012.png
UPDATE personnel SET photo = 'headshots/wendy_li_mfg012.png' WHERE profile_id = 'mmc' AND id = 'mfg012';
-- File: xavier_gray_fin005.png
UPDATE personnel SET photo = 'headshots/xavier_gray_fin005.png' WHERE profile_id = 'mmc' AND id = 'fin005';
-- File: xavier_rhodes_mfg013.png
UPDATE personnel SET photo = 'headshots/xavier_rhodes_mfg013.png' WHERE profile_id = 'mmc' AND id = 'mfg013';
-- File: yara_shah_mfg014.png
UPDATE personnel SET photo = 'headshots/yara_shah_mfg014.png' WHERE profile_id = 'mmc' AND id = 'mfg014';
-- File: yvonne_cole_fin006.png
UPDATE personnel SET photo = 'headshots/yvonne_cole_fin006.png' WHERE profile_id = 'mmc' AND id = 'fin006';
-- File: zachary_king_fin007.png
UPDATE personnel SET photo = 'headshots/zachary_king_fin007.png' WHERE profile_id = 'mmc' AND id = 'fin007';
-- File: zachary_stone_mfg015.png
UPDATE personnel SET photo = 'headshots/zachary_stone_mfg015.png' WHERE profile_id = 'mmc' AND id = 'mfg015';

