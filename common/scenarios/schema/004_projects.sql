-- ============================================================================
-- 004_projects.sql - Projects, Objectives (hierarchical), Metrics, KPIs, Initiatives
-- ============================================================================
-- Source: projects.toml (project management entities)

CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    solution_id TEXT REFERENCES solutions(id),
    status TEXT DEFAULT 'planning' CHECK(status IN ('planning', 'active', 'on_hold', 'complete', 'cancelled')),
    start_date TEXT,
    end_date TEXT
);

CREATE TABLE IF NOT EXISTS objectives (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    project_id TEXT REFERENCES projects(id),
    parent_id TEXT REFERENCES objectives(id),
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'active', 'achieved', 'deferred'))
);

CREATE TABLE IF NOT EXISTS metrics (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    unit TEXT,
    current_value REAL
);

CREATE TABLE IF NOT EXISTS kpis (
    id TEXT PRIMARY KEY,
    metric_id TEXT NOT NULL REFERENCES metrics(id),
    objective_id TEXT REFERENCES objectives(id),
    target_value REAL,
    direction TEXT CHECK(direction IN ('increase', 'decrease', 'maintain')),
    threshold_warning REAL,
    threshold_critical REAL
);

CREATE TABLE IF NOT EXISTS initiatives (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    kpi_id TEXT REFERENCES kpis(id),
    status TEXT DEFAULT 'planned' CHECK(status IN ('planned', 'active', 'complete', 'cancelled')),
    start_date TEXT,
    end_date TEXT
);

-- ============================================================================
-- Projects
-- ============================================================================

INSERT INTO projects (id, name, description, solution_id, status, start_date, end_date) VALUES
('d4e5f6', 'FY2025 Operational Excellence', 'Strategic initiative to improve operational efficiency, reduce service response times, and enhance customer satisfaction through digital transformation', 'a1b2c3', 'active', '2025-01-01', '2025-12-31');

-- ============================================================================
-- Objectives - Root Level
-- ============================================================================

INSERT INTO objectives (id, title, description, project_id, status) VALUES
('obj-root', 'MMC 2025 Strategic Vision', 'Become the leading provider of smart, connected HVAC solutions in the Midwest through operational excellence, customer-centricity, and technological innovation', 'd4e5f6', 'active');

-- ============================================================================
-- Objectives - Department Level
-- ============================================================================

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-ops', 'Operations Excellence', 'Transform field operations through technology-enabled efficiency and predictive capabilities', 'd4e5f6', 'obj-root', 'active');

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-cust', 'Customer Experience', 'Deliver exceptional customer experiences across all touchpoints through digital transformation', 'd4e5f6', 'obj-root', 'active');

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-eng', 'Engineering Innovation', 'Drive product innovation and R&D excellence to maintain competitive advantage', 'd4e5f6', 'obj-root', 'active');

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-it', 'IT Modernization', 'Modernize IT infrastructure to enable digital transformation initiatives', 'd4e5f6', 'obj-root', 'active');

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-hr', 'Workforce Development', 'Build a skilled, engaged workforce ready for the digital future', 'd4e5f6', 'obj-root', 'active');

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-fin', 'Financial Performance', 'Achieve sustainable profitability growth while investing in future capabilities', 'd4e5f6', 'obj-root', 'active');

-- ============================================================================
-- Objectives - Operations Tactical Level
-- ============================================================================

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('101a2b', 'Rapid Field Service Response', 'Customers experiencing equipment issues must receive on-site technician support within a timeframe that minimizes business disruption and demonstrates our commitment to their operations', 'd4e5f6', 'obj-ops', 'active');

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('202b3c', 'First-Visit Issue Resolution', 'Service visits must be equipped with the knowledge, tools, and parts necessary to resolve customer issues on the initial visit, avoiding costly follow-ups and extended downtime', 'd4e5f6', 'obj-ops', 'active');

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-ops-pred', 'Proactive Equipment Health Management', 'Equipment health must be continuously monitored to identify potential failures before they impact customer operations, enabling planned maintenance over reactive repairs', 'd4e5f6', 'obj-ops', 'active');

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-ops-dispatch', 'Intelligent Dispatch Optimization', 'Technician assignments must consider location, skills, parts availability, and customer priority to minimize travel time and maximize daily service capacity', 'd4e5f6', 'obj-ops', 'active');

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-ops-inventory', 'Parts and Inventory Excellence', 'Service vehicles and warehouses must maintain optimal inventory levels, ensuring parts availability while minimizing carrying costs and obsolescence', 'd4e5f6', 'obj-ops', 'active');

-- ============================================================================
-- Objectives - Customer Experience Tactical Level
-- ============================================================================

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('303c4d', 'Seamless Customer Journey', 'Every customer interaction—from initial inquiry through ongoing service—must feel cohesive, professional, and tailored to their specific needs and preferences', 'd4e5f6', 'obj-cust', 'active');

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-cust-portal', 'Customer Self-Service Capability', 'Customers must have the ability to independently manage service requests, monitor equipment status, access documentation, and track technician arrivals at their convenience', 'd4e5f6', 'obj-cust', 'active');

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-cust-comm', 'Proactive Customer Communication', 'Customers must receive timely, relevant updates about their equipment, service appointments, and technician arrival without needing to initiate contact', 'd4e5f6', 'obj-cust', 'active');

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-cust-feedback', 'Customer Voice Integration', 'Customer feedback must be systematically captured, analyzed, and acted upon to continuously improve service delivery and product quality', 'd4e5f6', 'obj-cust', 'active');

-- ============================================================================
-- Objectives - Engineering Tactical Level
-- ============================================================================

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-eng-iot', 'Connected Product Ecosystem', 'HVAC systems must integrate seamlessly with building management systems and provide remote visibility into performance, enabling data-driven maintenance and optimization', 'd4e5f6', 'obj-eng', 'active');

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-eng-energy', 'Energy-Efficient Product Design', 'Products must minimize energy consumption while maintaining or exceeding performance requirements, helping customers reduce operational costs and environmental impact', 'd4e5f6', 'obj-eng', 'active');

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-eng-quality', 'Product Reliability and Durability', 'Products must be designed and manufactured to exceed expected lifespan with minimal maintenance, reducing total cost of ownership for customers', 'd4e5f6', 'obj-eng', 'active');

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-eng-modular', 'Modular and Serviceable Design', 'Products must be designed for easy diagnosis, repair, and component replacement, minimizing service time and enabling field upgrades', 'd4e5f6', 'obj-eng', 'active');

-- ============================================================================
-- Objectives - IT Tactical Level
-- ============================================================================

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-it-cloud', 'Scalable Computing Infrastructure', 'Technology infrastructure must scale elastically to meet demand fluctuations, ensure high availability, and enable rapid deployment of new capabilities', 'd4e5f6', 'obj-it', 'active');

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-it-data', 'Unified Data Foundation', 'Enterprise data must be accessible, trustworthy, and governed—providing a single source of truth that enables analytics, automation, and informed decision-making', 'd4e5f6', 'obj-it', 'active');

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-it-security', 'Cybersecurity and Compliance', 'Systems and data must be protected from unauthorized access, breaches, and threats while meeting regulatory and industry compliance requirements', 'd4e5f6', 'obj-it', 'active');

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-it-business-systems', 'Enterprise Resource Management Software', 'A unified platform must provide visibility into strategic alignment, resource capacity, project portfolios, and operational metrics, eliminating data silos and enabling informed decision-making', 'd4e5f6', 'obj-it', 'active');

-- ============================================================================
-- Objectives - Rubigo Platform (under IT Business Systems)
-- ============================================================================

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-rubigo-admin', 'Platform Administration', 'System administrators must be able to manage platform configuration, user accounts, and foundational data that enables all other platform capabilities', 'd4e5f6', 'obj-it-business-systems', 'active');

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-rubigo-personnel', 'Personnel Directory Management', 'Administrators must be able to maintain an accurate personnel directory that reflects the organization''s current workforce, enabling effective resource allocation and communication', 'd4e5f6', 'obj-rubigo-admin', 'active');

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-rubigo-strategy', 'Strategic Alignment Visibility', 'Leadership must be able to see how projects, initiatives, and activities align to strategic objectives, enabling informed prioritization and resource decisions', 'd4e5f6', 'obj-it-business-systems', 'active');

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-rubigo-capacity', 'Resource Capacity Planning', 'The organization must have visibility into workforce capacity, skill availability, and allocation gaps to ensure initiatives are properly staffed', 'd4e5f6', 'obj-it-business-systems', 'active');

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-rubigo-portfolio', 'Project Portfolio Oversight', 'Management must have a comprehensive view of all projects, their status, dependencies, and resource consumption to optimize the portfolio', 'd4e5f6', 'obj-it-business-systems', 'active');

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-rubigo-metrics', 'Operational Metrics and KPIs', 'Key performance indicators must be tracked, visualized, and connected to strategic objectives to measure progress and identify areas needing attention', 'd4e5f6', 'obj-it-business-systems', 'active');

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-personnel-org-structure', 'Personnel Directory and Org Structure', 'The organization must maintain an accurate, accessible directory of personnel with reporting relationships, roles, skills, and contact information', 'd4e5f6', 'obj-it-business-systems', 'active');

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-rubigo-crm', 'Customer Relationship Management', 'Customer interactions, sales pipelines, and service history must be centrally managed to enable personalized engagement and data-driven decision making', 'd4e5f6', 'obj-it-business-systems', 'active');

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-rubigo-finance', 'Financial Operations Management', 'Financial, procurement, and supply chain operations must be managed through integrated systems that provide real-time visibility and control', 'd4e5f6', 'obj-it-business-systems', 'active');

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-rubigo-events', 'Event and Schedule Management', 'The organization must have a unified calendar system for scheduling, coordinating, and tracking events, meetings, deadlines, and milestones across teams and projects', 'd4e5f6', 'obj-it-business-systems', 'active');

-- ============================================================================
-- Objectives - HR Tactical Level
-- ============================================================================

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-hr-train', 'Technical Workforce Readiness', 'Technicians and engineers must possess current expertise in smart HVAC systems, diagnostic tools, and emerging technologies to deliver exceptional service', 'd4e5f6', 'obj-hr', 'active');

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-hr-retain', 'Engaged and Committed Workforce', 'Employees must feel valued, see clear career paths, and receive competitive compensation that reflects their contribution to customer success', 'd4e5f6', 'obj-hr', 'active');

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-hr-recruit', 'Talent Acquisition Pipeline', 'The organization must attract qualified candidates with the right skills and cultural fit to support growth and replace attrition', 'd4e5f6', 'obj-hr', 'active');

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-hr-safety', 'Workplace Safety Culture', 'Employees must work in environments that prioritize safety, with training and protocols that prevent incidents and protect well-being', 'd4e5f6', 'obj-hr', 'active');

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-hr-knowledge', 'Institutional Knowledge Preservation', 'Critical expertise and tribal knowledge must be documented and transferred to ensure continuity as employees transition', 'd4e5f6', 'obj-hr', 'active');

-- ============================================================================
-- Objectives - Finance Tactical Level
-- ============================================================================

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-fin-margin', 'Sustainable Service Profitability', 'Service operations must generate margins that support continued investment in people, technology, and capabilities while delivering exceptional customer value', 'd4e5f6', 'obj-fin', 'active');

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-fin-recurring', 'Predictable Revenue Streams', 'The business model must emphasize subscription and maintenance contracts that provide stable, recurring revenue and strengthen long-term customer relationships', 'd4e5f6', 'obj-fin', 'active');

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-fin-cashflow', 'Healthy Cash Flow Management', 'Receivables, payables, and working capital must be managed to ensure liquidity and enable investment in growth opportunities', 'd4e5f6', 'obj-fin', 'active');

INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES
('obj-fin-visibility', 'Financial Visibility and Forecasting', 'Leadership must have real-time visibility into financial performance and accurate forecasts to make informed strategic decisions', 'd4e5f6', 'obj-fin', 'active');

-- ============================================================================
-- Metrics
-- ============================================================================
-- TODO: Add metrics from projects.toml when we reach that section

-- ============================================================================
-- KPIs
-- ============================================================================
-- TODO: Add KPIs from projects.toml when we reach that section

-- ============================================================================
-- Initiatives
-- ============================================================================
-- TODO: Add initiatives from projects.toml when we reach that section
