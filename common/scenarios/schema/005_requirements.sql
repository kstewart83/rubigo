-- ============================================================================
-- 005_requirements.sql - Features, Rules, Scenarios, Specifications
-- ============================================================================
-- CONSOLIDATED from: projects.toml, collaboration.toml, access-control.toml, integration.toml
-- This is the unified requirements space for all scenario data.

CREATE TABLE IF NOT EXISTS features (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    objective_id TEXT REFERENCES objectives(id),
    status TEXT DEFAULT 'planned' CHECK(status IN ('planned', 'in_progress', 'complete', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS rules (
    id TEXT PRIMARY KEY,
    feature_id TEXT NOT NULL REFERENCES features(id),
    role TEXT NOT NULL,
    requirement TEXT NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'active', 'deprecated'))
);

CREATE TABLE IF NOT EXISTS scenarios (
    id TEXT PRIMARY KEY,
    rule_id TEXT NOT NULL REFERENCES rules(id),
    name TEXT NOT NULL,
    narrative TEXT,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'active', 'deprecated'))
);

CREATE TABLE IF NOT EXISTS specifications (
    id TEXT PRIMARY KEY,
    feature_id TEXT NOT NULL REFERENCES features(id),
    name TEXT NOT NULL,
    narrative TEXT,
    category TEXT CHECK(category IN ('performance', 'security', 'usability', 'reliability', 'accessibility', 'maintainability')),
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'active', 'deprecated'))
);

-- ============================================================================
-- FEATURES - From projects.toml
-- ============================================================================

INSERT INTO features (id, name, description, objective_id, status) VALUES
('f01a23', 'Real-time Technician Tracking', 'GPS-enabled tracking of field technicians for optimal dispatch', '101a2b', 'in_progress');

INSERT INTO features (id, name, description, objective_id, status) VALUES
('f02b34', 'Predictive Parts Inventory', 'ML-based prediction of required parts for common equipment issues', '202b3c', 'planned');

INSERT INTO features (id, name, description, objective_id, status) VALUES
('f03c45', 'Customer Portal', 'Self-service portal for service requests, status tracking, and feedback', '303c4d', 'in_progress');

INSERT INTO features (id, name, description, objective_id, status) VALUES
('feat-personnel-crud', 'Personnel CRUD Operations', 'Create, read, update, delete capabilities for personnel records', 'obj-rubigo-personnel', 'in_progress');

INSERT INTO features (id, name, description, objective_id, status) VALUES
('feat-solution-mgmt', 'Solution Management', 'Users can view, create, and manage Solutions (Products/Services) in the solution catalog', 'obj-root', 'complete');

INSERT INTO features (id, name, description, objective_id, status) VALUES
('feat-project-mgmt', 'Project Management', 'Users can create and manage Projects linked to Solutions, tracking strategic initiatives', 'obj-root', 'complete');

INSERT INTO features (id, name, description, objective_id, status) VALUES
('feat-objective-mgmt', 'Objective Management', 'Users can define hierarchical Objectives for Projects, including parent-child relationships', 'obj-root', 'complete');

INSERT INTO features (id, name, description, objective_id, status) VALUES
('feat-initiative-mgmt', 'Initiative Management', 'Users can create Initiatives linked to KPIs, tracking tactical execution', 'obj-root', 'complete');

INSERT INTO features (id, name, description, objective_id, status) VALUES
('feat-activity-mgmt', 'Activity Management', 'Users can manage Activities, Roles, Assignments, and Allocations for resource planning', 'obj-root', 'complete');

INSERT INTO features (id, name, description, objective_id, status) VALUES
('feat-metrics-kpis', 'Metrics and KPIs', 'Users can define Metrics and KPIs to measure Objective achievement', 'obj-root', 'complete');

-- ============================================================================
-- FEATURES - From collaboration.toml (Calendar)
-- ============================================================================

INSERT INTO features (id, name, description, objective_id, status) VALUES
('feat-calendar-crud', 'Calendar Event CRUD', 'Create, read, update, delete calendar events with full event details', 'obj-rubigo-events', 'complete');

INSERT INTO features (id, name, description, objective_id, status) VALUES
('feat-calendar-recurrence', 'Recurring Event Management', 'Support for daily, weekly, monthly, yearly recurrence with instance deviations', 'obj-rubigo-events', 'complete');

INSERT INTO features (id, name, description, objective_id, status) VALUES
('feat-calendar-views', 'Calendar View Modes', 'Month view grid, week view, and day view with time slots', 'obj-rubigo-events', 'complete');

INSERT INTO features (id, name, description, objective_id, status) VALUES
('feat-calendar-navigation', 'Calendar Navigation', 'Navigate between months/weeks, jump to today, work week toggle', 'obj-rubigo-events', 'complete');

INSERT INTO features (id, name, description, objective_id, status) VALUES
('feat-calendar-participants', 'Event Participants', 'Assign organizers and participants to events', 'obj-rubigo-events', 'planned');

INSERT INTO features (id, name, description, objective_id, status) VALUES
('feat-calendar-timezone', 'Event Timezone Management', 'Select event timezone and display local time conversion', 'obj-rubigo-events', 'complete');

INSERT INTO features (id, name, description, objective_id, status) VALUES
('feat-calendar-day-view', 'Day View Mode', 'Single day view with hourly time slots for detailed daily schedule', 'obj-rubigo-events', 'complete');

INSERT INTO features (id, name, description, objective_id, status) VALUES
('feat-calendar-all-day', 'All Day Events', 'Mark events as all-day to display without specific times', 'obj-rubigo-events', 'complete');

INSERT INTO features (id, name, description, objective_id, status) VALUES
('feat-calendar-overlap', 'Overlapping Event Display', 'Display overlapping events side-by-side with proper lane assignment', 'obj-rubigo-events', 'in_progress');

INSERT INTO features (id, name, description, objective_id, status) VALUES
('feat-calendar-current-time', 'Current Time Indicator', 'Display a real-time indicator showing current time in Day view', 'obj-rubigo-events', 'in_progress');

-- ============================================================================
-- FEATURES - From collaboration.toml (Email)
-- ============================================================================

INSERT INTO features (id, name, description, objective_id, status) VALUES
('feat-email-compose', 'Email Composition', 'Compose and send messages to personnel or custom email addresses', 'obj-rubigo-events', 'complete');

INSERT INTO features (id, name, description, objective_id, status) VALUES
('feat-email-inbox', 'Email Inbox', 'View and manage received messages in inbox folder', 'obj-rubigo-events', 'complete');

INSERT INTO features (id, name, description, objective_id, status) VALUES
('feat-email-folders', 'Email Folders', 'Organize emails in standard folders: Inbox, Sent, Drafts, Trash', 'obj-rubigo-events', 'complete');

INSERT INTO features (id, name, description, objective_id, status) VALUES
('feat-email-drafts', 'Email Drafts', 'Save and edit draft messages before sending', 'obj-rubigo-events', 'complete');

INSERT INTO features (id, name, description, objective_id, status) VALUES
('feat-email-reply', 'Email Reply', 'Reply to received messages with thread context', 'obj-rubigo-events', 'complete');

INSERT INTO features (id, name, description, objective_id, status) VALUES
('feat-email-trash', 'Email Trash Management', 'Delete and recover email messages', 'obj-rubigo-events', 'complete');

-- ============================================================================
-- FEATURES - From collaboration.toml (Chat)
-- ============================================================================

INSERT INTO features (id, name, description, objective_id, status) VALUES
('feat-chat-channels', 'Chat Channels', 'Create and manage chat channels for team communication', 'obj-rubigo-events', 'complete');

INSERT INTO features (id, name, description, objective_id, status) VALUES
('feat-chat-messages', 'Chat Messaging', 'Send and receive real-time messages in channels', 'obj-rubigo-events', 'complete');

INSERT INTO features (id, name, description, objective_id, status) VALUES
('feat-chat-membership', 'Channel Membership', 'Join and leave channels, manage member lists', 'obj-rubigo-events', 'complete');

-- ============================================================================
-- RULES - Sample from projects.toml (Field Service)
-- ============================================================================

INSERT INTO rules (id, feature_id, role, requirement, reason, status) VALUES
('rule-001', 'f01a23', 'Dispatch Coordinator', 'see real-time technician locations on a map', 'assign the nearest available technician to emergency calls', 'active');

INSERT INTO rules (id, feature_id, role, requirement, reason, status) VALUES
('rule-002', 'f01a23', 'Field Technician', 'receive optimal route guidance to my next job', 'minimize travel time and arrive faster', 'active');

INSERT INTO rules (id, feature_id, role, requirement, reason, status) VALUES
('rule-003', 'f02b34', 'Service Manager', 'see predicted parts needs for scheduled service visits', 'ensure technicians have required parts before dispatch', 'draft');

INSERT INTO rules (id, feature_id, role, requirement, reason, status) VALUES
('rule-004', 'f03c45', 'Customer', 'view the status of my service request online', 'know when to expect the technician without calling', 'active');

INSERT INTO rules (id, feature_id, role, requirement, reason, status) VALUES
('rule-005', 'f03c45', 'Customer', 'submit a new service request through the portal', 'request service outside of business hours', 'active');

-- ============================================================================
-- RULES - Personnel CRUD
-- ============================================================================

INSERT INTO rules (id, feature_id, role, requirement, reason, status) VALUES
('rule-personnel-view', 'feat-personnel-crud', 'Platform User', 'browse and search the personnel directory', 'find contact information and organizational relationships', 'active');

INSERT INTO rules (id, feature_id, role, requirement, reason, status) VALUES
('rule-personnel-create', 'feat-personnel-crud', 'Platform Administrator', 'add new personnel records to the directory', 'onboard new employees and keep the directory current', 'active');

INSERT INTO rules (id, feature_id, role, requirement, reason, status) VALUES
('rule-personnel-edit', 'feat-personnel-crud', 'Platform Administrator', 'modify existing personnel records', 'update role changes, contact information, and organizational assignments', 'active');

INSERT INTO rules (id, feature_id, role, requirement, reason, status) VALUES
('rule-personnel-delete', 'feat-personnel-crud', 'Platform Administrator', 'remove personnel records from the directory', 'maintain accuracy when employees leave the organization', 'active');

-- ============================================================================
-- RULES - Calendar (sample from collaboration.toml)
-- ============================================================================

INSERT INTO rules (id, feature_id, role, requirement, reason, status) VALUES
('rule-calendar-list', 'feat-calendar-crud', 'Platform User', 'view all calendar events in a visual calendar format', 'understand my schedule and upcoming commitments', 'active');

INSERT INTO rules (id, feature_id, role, requirement, reason, status) VALUES
('rule-calendar-create', 'feat-calendar-crud', 'Platform User', 'create a new calendar event with title, date/time, and optional details', 'schedule meetings and appointments', 'active');

INSERT INTO rules (id, feature_id, role, requirement, reason, status) VALUES
('rule-calendar-edit', 'feat-calendar-crud', 'Event Organizer', 'modify an existing calendar event', 'update meeting details as plans change', 'active');

INSERT INTO rules (id, feature_id, role, requirement, reason, status) VALUES
('rule-calendar-delete', 'feat-calendar-crud', 'Event Organizer', 'delete a calendar event', 'remove cancelled meetings from the schedule', 'active');

-- ============================================================================
-- SCENARIOS - Sample test cases
-- ============================================================================

INSERT INTO scenarios (id, rule_id, name, narrative, status) VALUES
('scn-001', 'rule-001', 'Emergency dispatch view', 'Given I am a dispatch coordinator viewing the map, when an emergency call is received, then I can see all technicians within a 20-mile radius with their current status and ETA', 'active');

INSERT INTO scenarios (id, rule_id, name, narrative, status) VALUES
('scn-002', 'rule-002', 'Automatic route recalculation', 'Given I am a technician en route to a job, when traffic conditions change, then the app automatically recalculates and suggests an optimal alternative route', 'active');

INSERT INTO scenarios (id, rule_id, name, narrative, status) VALUES
('scen-personnel-list', 'rule-personnel-view', 'Browse personnel directory', 'Given I am signed in as any user, when I navigate to the Personnel page, then I see a paginated table of personnel records and I can search by name, title, or email', 'active');

INSERT INTO scenarios (id, rule_id, name, narrative, status) VALUES
('scen-personnel-create', 'rule-personnel-create', 'Add new employee', 'Given I am signed in as Global Administrator, when I click Add Personnel and fill in required fields and Save, then the new personnel record appears in the table', 'active');

INSERT INTO scenarios (id, rule_id, name, narrative, status) VALUES
('scen-calendar-month-display', 'rule-calendar-list', 'Display month grid', 'Given I am signed in, when I navigate to Calendar, then I see a month grid with day cells and colored event pills', 'active');

-- NOTE: Full scenarios would be migrated from all 4 TOML files
-- This is a representative sample. The full migration script will extract all scenarios.
