-- ============================================================================
-- classification_guides.sql - Classification Guide seed data for MMC profile
-- ============================================================================

-- =============================================================================
-- Sensitivity Level Guides
-- =============================================================================

INSERT INTO classification_guides (id, profile_id, title, guide_type, level, content_markdown, icon, color, status) VALUES
('sensitivity-public', 'mmc', 'Public Information', 'sensitivity', 'public', 
'# Public Information Classification Guide

## Overview

Public information is data that can be freely shared with anyone, including external parties, customers, contractors, and the general public. No access restrictions apply to this classification level.

## Definition

Information classified as **Public** has been explicitly approved for external distribution. This is the only classification level where data may leave the organization without additional controls.

## Examples

| Category | Examples |
|----------|----------|
| Marketing | Press releases, brochures, product catalogs |
| Communications | Public website content, social media posts |
| Documentation | User manuals, public API documentation |
| General | Annual reports, public financial statements |

## Handling Requirements

### Permitted Actions
- Share externally without approval
- Post on public websites
- Include in marketing materials
- Discuss in public forums

### Best Practices
1. Verify the information is current and accurate before sharing
2. Ensure branding guidelines are followed
3. Do not mix public and non-public information in the same document
4. When in doubt, consult with Communications before publishing',
'eye', 'emerald', 'active');

INSERT INTO classification_guides (id, profile_id, title, guide_type, level, content_markdown, icon, color, status) VALUES
('sensitivity-low', 'mmc', 'Low Sensitivity', 'sensitivity', 'low',
'# Low Sensitivity Classification Guide

## Overview

Low sensitivity information is internal data that, while not suitable for public release, would cause minimal harm if disclosed. This includes routine operational data and general business communications.

## Definition

Information classified as **Low** is intended for internal use only but does not require special handling beyond basic access controls.

## Examples

| Category | Examples |
|----------|----------|
| Operations | Meeting notes, project schedules |
| Communications | Internal memos, general announcements |
| Documentation | Internal procedures, training materials |

## Handling Requirements

### Access Controls
- Internal personnel only
- Standard network authentication

### Permitted Actions
- Share with any employee
- Store on internal file shares
- Send via internal email',
'shield', 'blue', 'active');

INSERT INTO classification_guides (id, profile_id, title, guide_type, level, content_markdown, icon, color, status) VALUES
('sensitivity-moderate', 'mmc', 'Moderate Sensitivity', 'sensitivity', 'moderate',
'# Moderate Sensitivity Classification Guide

## Overview

Moderate sensitivity information could cause noticeable harm to the organization or individuals if disclosed improperly. This includes confidential business data and personal information.

## Definition

Information classified as **Moderate** requires need-to-know access and should be handled with care.

## Examples

| Category | Examples |
|----------|----------|
| Business | Customer lists, pricing structures |
| Personnel | Employee performance reviews, salary info |
| Technical | System configurations, architecture docs |

## Handling Requirements

### Access Controls
- Need-to-know basis
- Department-level restrictions
- Manager approval may be required

### Storage Requirements
- Encrypted at rest
- Access logging enabled',
'lock', 'amber', 'active');

INSERT INTO classification_guides (id, profile_id, title, guide_type, level, content_markdown, icon, color, status) VALUES
('sensitivity-high', 'mmc', 'High Sensitivity', 'sensitivity', 'high',
'# High Sensitivity Classification Guide

## Overview

High sensitivity information could cause severe harm to the organization, customers, or individuals if disclosed. This includes trade secrets, PII, financial data, and security-related information.

## Definition

Information classified as **High** requires the strictest access controls and special handling procedures.

## Examples

| Category | Examples |
|----------|----------|
| Financial | Executive compensation, M&A data |
| Legal | Litigation documents, contracts |
| Security | Encryption keys, access credentials |
| Personal | SSNs, medical records, background checks |

## Handling Requirements

### Access Controls
- Executive approval required
- Named individuals only
- Multi-factor authentication

### Storage Requirements
- Encrypted at rest and in transit
- Separate secured systems
- Regular access audits

### Incident Response
Any suspected breach must be reported immediately to Security.',
'alert-triangle', 'red', 'active');

-- =============================================================================
-- Compartment Guides
-- =============================================================================

INSERT INTO classification_guides (id, profile_id, title, guide_type, level, content_markdown, icon, color, status) VALUES
('compartment-apple', 'mmc', 'Apple Compartment', 'compartment', 'apple',
'# Apple Compartment Guide

## Overview

The Apple compartment isolates product development data for next-generation initiatives.

## Scope

All R&D data related to the Apple project including:
- Design specifications
- Prototype documentation
- Test results

## Access Requirements

Access granted by VP of Engineering only.',
NULL, 'red', 'active');

INSERT INTO classification_guides (id, profile_id, title, guide_type, level, content_markdown, icon, color, status) VALUES
('compartment-banana', 'mmc', 'Banana Compartment', 'compartment', 'banana',
'# Banana Compartment Guide

## Overview

The Banana compartment protects strategic partnership data.

## Scope

All partnership-related materials including:
- Partner agreements
- Joint venture plans
- Confidential negotiations

## Access Requirements

Access limited to executive leadership and designated liaisons.',
NULL, 'yellow', 'active');

INSERT INTO classification_guides (id, profile_id, title, guide_type, level, content_markdown, icon, color, status) VALUES
('compartment-infrastructure', 'mmc', 'Infrastructure Compartment', 'compartment', 'infrastructure',
'# Infrastructure Compartment Guide

## Overview

The Infrastructure compartment protects critical IT and security infrastructure documentation.

## Scope

- Network topology and architecture
- Security configurations
- Disaster recovery plans
- Access control systems

## Access Requirements

IT Security team members only. Annual recertification required.',
NULL, 'slate', 'active');

-- =============================================================================
-- Role Guides
-- =============================================================================

INSERT INTO classification_guides (id, profile_id, title, guide_type, level, content_markdown, icon, color, status) VALUES
('role-executive', 'mmc', 'Executive Role', 'role', 'executive',
'# Executive Role Guide

## Overview

Executives (C-suite and VPs) have the highest clearance levels and access to all compartments.

## Clearance Level

**High** - Full access to all sensitivity levels

## Compartment Access

Executives have standing access to all compartments.

## Data Handling Expectations

- Lead by example in security practices
- Ensure direct reports understand classification policies
- Report any security concerns immediately',
'users', 'purple', 'active');

INSERT INTO classification_guides (id, profile_id, title, guide_type, level, content_markdown, icon, color, status) VALUES
('role-manager', 'mmc', 'Manager Role', 'role', 'manager',
'# Manager Role Guide

## Overview

Managers have elevated access to support team operations.

## Clearance Level

**Moderate** - Access to moderate and below

## Compartment Access

Compartment access granted on project basis.

## Data Handling Expectations

- Approve access requests for direct reports
- Review team member clearances quarterly
- Ensure team follows classification policies',
'users', 'amber', 'active');

INSERT INTO classification_guides (id, profile_id, title, guide_type, level, content_markdown, icon, color, status) VALUES
('role-employee', 'mmc', 'Employee Role', 'role', 'employee',
'# Employee Role Guide

## Overview

Standard employees have baseline access for day-to-day operations.

## Clearance Level

**Low** - Access to internal data

## Compartment Access

No standing compartment access. Request access as needed.

## Data Handling Expectations

- Follow all classification policies
- Report suspected security issues
- Complete annual security training',
'users', 'blue', 'active');
