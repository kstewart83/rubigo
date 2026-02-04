---
id: CG-SENS-HIGH
title: High Sensitivity
type: sensitivity
level: high
icon: alert-triangle
color: red
---

# High Sensitivity Classification Guide

## Overview

High sensitivity information demands the **strictest access controls**. This data is restricted to a limited group of explicitly authorized individuals. Unauthorized disclosure could cause significant harm to the organization, its employees, or business partners.

## Definition

Information classified as **High** represents the organization's most sensitive data. Access is limited to those with explicit authorization and a demonstrated need-to-know. All access is logged and regularly audited.

> [!CAUTION]
> Mishandling of high sensitivity information may result in disciplinary action, termination, and potential legal consequences.

## Examples

| Category | Examples |
|----------|----------|
| Executive | M&A discussions, board communications, executive compensation |
| Legal | Active litigation, regulatory investigations, whistleblower reports |
| Security | Vulnerability assessments, incident details, access credentials |
| Financial | Unreleased earnings, material non-public information |
| Personal | SSN/national IDs, medical records, background checks |

## Handling Requirements

### Access Controls
- Explicit individual authorization required
- Two-person approval for access grants
- Monthly access reviews mandatory
- Real-time access monitoring
- Automatic session timeouts

### Technical Requirements

```
┌─────────────────────────────────────────────────────┐
│ HIGH SENSITIVITY DATA REQUIREMENTS                   │
├─────────────────────────────────────────────────────┤
│ ✓ Encryption at rest (AES-256)                     │
│ ✓ Encryption in transit (TLS 1.3)                  │
│ ✓ Multi-factor authentication                       │
│ ✓ Network segmentation                              │
│ ✓ Data loss prevention (DLP) monitoring            │
│ ✓ Complete audit trail                              │
└─────────────────────────────────────────────────────┘
```

### Permitted Actions
- View only from secured workstations
- Store only in approved high-security systems
- Share only with verified authorized recipients
- Discuss only in secure, private environments

### Strictly Prohibited
- Any external communication without Legal approval
- Storage on any personal device
- Screen sharing in general meetings
- Printing without authorization
- Photography or screenshots
- Verbal discussion in public areas

## Labeling Requirements

All high sensitivity documents must display:

> **⚠️ HIGH SENSITIVITY - STRICTLY CONFIDENTIAL**
> 
> Authorized Recipients Only. Do not copy, distribute, or discuss
> outside of approved channels. If you received this in error,
> delete immediately and notify the sender.

## Incident Response

Any suspected exposure of high sensitivity information requires:

1. **IMMEDIATE** notification to Information Security
2. **DO NOT** attempt to investigate independently
3. **PRESERVE** all related materials exactly as-is
4. **DOCUMENT** timeline and circumstances
5. **AWAIT** guidance from Security and Legal

**Emergency Hotline:** security@midwest-manufacturing.com

## Annual Certification

All individuals with high sensitivity access must:
- Complete annual security awareness training
- Sign updated confidentiality agreements
- Pass background re-verification
- Acknowledge understanding of this guide

## Related Resources

- [Information Security Emergency Procedures](#)
- [Data Breach Response Plan](#)
- [Executive Communications Policy](#)
- [Insider Trading Policy](#)
