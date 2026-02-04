---
id: CG-COMP-WRENCH
title: Infrastructure Compartment (🔧)
type: compartment
level: "🔧"
icon: wrench
color: slate
sensitivity: moderate
compartments:
  - "🔧"
---

# Infrastructure Compartment (🔧) - System Administration

## Overview

The Infrastructure compartment grants **technical system access** for IT staff, database administrators, and security personnel who require privileged access to systems but not to the business data within.

> [!IMPORTANT]
> Infrastructure access is **custodial, not informational**. Personnel with 🔧 clearance can access systems but should not read or retain business data.

## Scope

This compartment covers:
- Server and network administration
- Database maintenance and backup operations
- Security monitoring and incident response
- System configuration and deployment
- Privileged access management
- Log access for troubleshooting

## Key Distinction

| Access Type | Description | Example |
|-------------|-------------|---------|
| **Infrastructure (🔧)** | Technical access to systems | DBA can run queries, manage backups |
| **Data Compartments** | Business access to content | Finance analyst reads budget forecasts |

Personnel with 🔧 **should not**:
- Review business data beyond what's needed for technical support
- Export or retain copies of compartmented data
- Grant themselves data compartment access

## Access Requirements

### Eligibility Criteria

| Requirement | Details |
|-------------|---------|
| Department | IT, Security Operations |
| Certification | Privileged Access Training (annual) |
| Background | Criminal background check |
| Agreement | Signed AUP + Custodial Access Agreement |

### Access Levels

```
INFRASTRUCTURE ACCESS TIERS
────────────────────────────
Tier 1: Read-only system access (logs, configs)
Tier 2: + Write access (deployments, changes)
Tier 3: + Root/admin access (full control)
Tier 4: + Cross-system break-glass access
```

## Privileged Access Protocol

### Just-In-Time Access
- Request elevated access through PAM system
- Time-limited sessions (default 4 hours)
- All actions logged and auditable

### Break-Glass Procedures
For emergency access:
1. Contact Security Operations
2. Document incident ticket number
3. Use emergency credentials
4. Debrief within 24 hours

## Audit & Monitoring

All infrastructure access is logged:
- Session recordings for privileged access
- Command history retention (90 days)
- Quarterly access reviews
- Anomaly detection via SIEM

## Related Resources

- [Privileged Access Policy](#)
- [Acceptable Use Policy](#)
- [Incident Response Procedures](#)
