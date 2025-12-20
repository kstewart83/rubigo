-- ============================================================================
-- EMAIL THREADS
-- ============================================================================

INSERT INTO email_threads (profile_id, id, subject, created_at, updated_at) VALUES ('mmc', 'thread-001', 'Q1 2025 Budget Review Meeting', '2024-12-09T09:00:00', '2024-12-10T14:30:00');
INSERT INTO email_threads (profile_id, id, subject, created_at, updated_at) VALUES ('mmc', 'thread-002', 'Network Maintenance This Weekend', '2024-12-11T10:00:00', '2024-12-11T14:45:00');
INSERT INTO email_threads (profile_id, id, subject, created_at, updated_at) VALUES ('mmc', 'thread-003', 'New HVAC Product Line - Design Review', '2024-12-10T08:30:00', '2024-12-12T11:00:00');
INSERT INTO email_threads (profile_id, id, subject, created_at, updated_at) VALUES ('mmc', 'thread-004', 'Holiday Schedule Reminder', '2024-12-12T09:00:00', '2024-12-12T09:00:00');
INSERT INTO email_threads (profile_id, id, subject, created_at, updated_at) VALUES ('mmc', 'thread-005', 'IT Equipment Request', '2024-12-11T15:00:00', '2024-12-12T10:30:00');
INSERT INTO email_threads (profile_id, id, subject, created_at, updated_at) VALUES ('mmc', 'thread-006', 'Midwest Territory Q4 Sales Update', '2024-12-10T16:00:00', '2024-12-11T09:15:00');
INSERT INTO email_threads (profile_id, id, subject, created_at, updated_at) VALUES ('mmc', 'thread-007', 'Engineering Team Building Event', '2024-12-09T14:00:00', '2024-12-10T10:00:00');
INSERT INTO email_threads (profile_id, id, subject, created_at, updated_at) VALUES ('mmc', 'thread-008', 'Benefits Enrollment Deadline', '2024-12-08T11:00:00', '2024-12-08T11:00:00');

-- ============================================================================
-- EMAILS
-- ============================================================================

-- Thread 1: Budget Review (CFO -> CEO with reply)
INSERT INTO emails (profile_id, id, thread_id, from_id, subject, body, parent_email_id, sent_at, is_draft, created_at) VALUES ('mmc', 'email-001', 'thread-001', 'cdb964', 'Q1 2025 Budget Review Meeting', 'Hi Thomas,

I''ve completed the preliminary analysis for the Q1 2025 budget. We''re looking at a 12% increase in operational costs, primarily driven by the new HVAC product line investment.

Can we schedule 30 minutes this week to discuss before the leadership meeting?

Best,
Margaret', NULL, '2024-12-09T09:00:00', 0, '2024-12-09T09:00:00');

INSERT INTO emails (profile_id, id, thread_id, from_id, subject, body, parent_email_id, sent_at, is_draft, created_at) VALUES ('mmc', 'email-002', 'thread-001', '241a6d', 'Re: Q1 2025 Budget Review Meeting', 'Margaret,

Yes, let''s meet tomorrow at 2 PM. Please bring the breakdown by department.

Also, I''d like to see projections for Q2 if the new product line performs as expected.

Thomas', 'email-001', '2024-12-10T14:30:00', 0, '2024-12-10T14:30:00');

-- Thread 2: Network Maintenance (IT Director -> All Hands style)
INSERT INTO emails (profile_id, id, thread_id, from_id, subject, body, parent_email_id, sent_at, is_draft, created_at) VALUES ('mmc', 'email-003', 'thread-002', '1ea074', 'Network Maintenance This Weekend', 'Team,

We''ll be performing network upgrades this Saturday from 2-4 AM EST. During this window:

- VPN access will be unavailable
- Email may experience brief delays
- File servers will be temporarily offline

Please save any critical work before Friday EOD.

Questions? Reach out to the IT Help Desk.

Mike Chen
IT Director', NULL, '2024-12-11T10:00:00', 0, '2024-12-11T10:00:00');

INSERT INTO emails (profile_id, id, thread_id, from_id, subject, body, parent_email_id, sent_at, is_draft, created_at) VALUES ('mmc', 'email-004', 'thread-002', '7aa0d4', 'Re: Network Maintenance This Weekend', 'Mike,

I''ll be on call during the maintenance window to monitor the switches. Jason and I have the rollback plan ready if needed.

Sarah', 'email-003', '2024-12-11T14:45:00', 0, '2024-12-11T14:45:00');

-- Thread 3: HVAC Product Design (Engineering Manager -> Team)
INSERT INTO emails (profile_id, id, thread_id, from_id, subject, body, parent_email_id, sent_at, is_draft, created_at) VALUES ('mmc', 'email-005', 'thread-003', 'd827cb', 'New HVAC Product Line - Design Review', 'Engineering Team,

Please review the attached specifications for the new energy-efficient HVAC units. We need feedback on:

1. Thermal efficiency targets (15% improvement over baseline)
2. Manufacturing feasibility
3. Timeline for prototype

Let''s discuss at Thursday''s standup.

David Park
Engineering Manager', NULL, '2024-12-10T08:30:00', 0, '2024-12-10T08:30:00');

INSERT INTO emails (profile_id, id, thread_id, from_id, subject, body, parent_email_id, sent_at, is_draft, created_at) VALUES ('mmc', 'email-006', 'thread-003', 'f9c8d7', 'Re: New HVAC Product Line - Design Review', 'David,

I''ve reviewed the thermal specs. The 15% target is achievable with the new compressor design, but we may need to adjust the heat exchanger dimensions.

I''ll have detailed calculations ready for Thursday.

Jennifer', 'email-005', '2024-12-11T09:00:00', 0, '2024-12-11T09:00:00');

INSERT INTO emails (profile_id, id, thread_id, from_id, subject, body, parent_email_id, sent_at, is_draft, created_at) VALUES ('mmc', 'email-007', 'thread-003', '8f3a18', 'Re: New HVAC Product Line - Design Review', 'David,

CAD models updated based on Jennifer''s preliminary feedback. The new heat exchanger dimensions are reflected in v2.3.

Link to files in the shared engineering drive.

Lisa', 'email-006', '2024-12-12T11:00:00', 0, '2024-12-12T11:00:00');

-- Thread 4: Holiday Schedule (HR Director -> All)
INSERT INTO emails (profile_id, id, thread_id, from_id, subject, body, parent_email_id, sent_at, is_draft, created_at) VALUES ('mmc', 'email-008', 'thread-004', '4f6f43', 'Holiday Schedule Reminder', 'All,

A friendly reminder about our upcoming holiday schedule:

- December 23-26: Office Closed (Christmas)
- December 27: Normal Operations
- December 31 - January 1: Office Closed (New Year)

Please submit any time-off requests through the HR portal by December 15th.

Happy Holidays!
Patricia Martinez
HR Director', NULL, '2024-12-12T09:00:00', 0, '2024-12-12T09:00:00');

-- Thread 5: Equipment Request (QA Engineer -> IT Director)
INSERT INTO emails (profile_id, id, thread_id, from_id, subject, body, parent_email_id, sent_at, is_draft, created_at) VALUES ('mmc', 'email-009', 'thread-005', 'test01', 'IT Equipment Request', 'Hi Mike,

I need to request some additional testing equipment for the QA lab:

- 2x additional monitors (for multi-screen testing)
- 1x high-capacity external SSD (2TB)
- Updated keyboard and mouse

This would help improve our E2E testing workflow significantly.

Thanks,
Alex Chen
QA Engineer', NULL, '2024-12-11T15:00:00', 0, '2024-12-11T15:00:00');

INSERT INTO emails (profile_id, id, thread_id, from_id, subject, body, parent_email_id, sent_at, is_draft, created_at) VALUES ('mmc', 'email-010', 'thread-005', '1ea074', 'Re: IT Equipment Request', 'Alex,

Approved. I''ve added this to our Q1 procurement list. Expect delivery by mid-January.

In the meantime, we have a spare monitor in storage you can use. See Casey about getting it set up.

Mike', 'email-009', '2024-12-12T10:30:00', 0, '2024-12-12T10:30:00');

-- Thread 6: Sales Update (Regional Manager -> CEO)
INSERT INTO emails (profile_id, id, thread_id, from_id, subject, body, parent_email_id, sent_at, is_draft, created_at) VALUES ('mmc', 'email-011', 'thread-006', '1e4e5c', 'Midwest Territory Q4 Sales Update', 'Thomas,

Quick update on Midwest sales performance:

- November closed at 118% of target
- Strong momentum in commercial HVAC installations
- Two new enterprise accounts signed (combined $450K annual)

Pipeline looking strong for Q1. Happy to discuss in more detail at the leadership meeting.

Chris Miller
Regional Sales Manager - Midwest', NULL, '2024-12-10T16:00:00', 0, '2024-12-10T16:00:00');

INSERT INTO emails (profile_id, id, thread_id, from_id, subject, body, parent_email_id, sent_at, is_draft, created_at) VALUES ('mmc', 'email-012', 'thread-006', '241a6d', 'Re: Midwest Territory Q4 Sales Update', 'Great work, Chris! These numbers are exactly what we need heading into the new year.

Let''s make sure Kevin and Nicole share their regional updates too. I''d like to present a unified sales picture at the board meeting.

Thomas', 'email-011', '2024-12-11T09:15:00', 0, '2024-12-11T09:15:00');

-- Thread 7: Team Building (Engineering Manager -> Team)
INSERT INTO emails (profile_id, id, thread_id, from_id, subject, body, parent_email_id, sent_at, is_draft, created_at) VALUES ('mmc', 'email-013', 'thread-007', 'd827cb', 'Engineering Team Building Event', 'Team,

I''d like to organize a team lunch next Friday to celebrate our successful v2.0 release. 

Any preferences for restaurant or cuisine type? Reply with your suggestions!

David', NULL, '2024-12-09T14:00:00', 0, '2024-12-09T14:00:00');

INSERT INTO emails (profile_id, id, thread_id, from_id, subject, body, parent_email_id, sent_at, is_draft, created_at) VALUES ('mmc', 'email-014', 'thread-007', 'test03', 'Re: Engineering Team Building Event', 'How about that new Italian place on Main Street? I heard great things about their lunch specials.

Morgan', 'email-013', '2024-12-10T10:00:00', 0, '2024-12-10T10:00:00');

-- Thread 8: Benefits (HR Director -> All - single announcement)
INSERT INTO emails (profile_id, id, thread_id, from_id, subject, body, parent_email_id, sent_at, is_draft, created_at) VALUES ('mmc', 'email-015', 'thread-008', '4f6f43', 'Benefits Enrollment Deadline', 'All Employees,

REMINDER: Open enrollment for 2025 benefits ends this Friday, December 13th.

If you haven''t made your elections yet, please log into the benefits portal and complete your selections. Changes cannot be made after the deadline.

Need help? Stop by HR or schedule a one-on-one with James Wilson.

Patricia Martinez
HR Director', NULL, '2024-12-08T11:00:00', 0, '2024-12-08T11:00:00');

-- ============================================================================
-- EMAIL RECIPIENTS
-- Each email needs recipient records for delivery
-- folder: 'inbox' for recipients, 'sent' for sender's copy
-- ============================================================================

-- email-001: Margaret -> Thomas
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-001', 'email-001', '241a6d', 'to', 'inbox', 1);
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-002', 'email-001', 'cdb964', 'to', 'sent', 1);

-- email-002: Thomas -> Margaret (reply)
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-003', 'email-002', 'cdb964', 'to', 'inbox', 1);
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-004', 'email-002', '241a6d', 'to', 'sent', 1);

-- email-003: Mike -> Multiple recipients (network maintenance)
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-005', 'email-003', '241a6d', 'to', 'inbox', 0);
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-006', 'email-003', '714fd4', 'to', 'inbox', 1);
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-007', 'email-003', 'd827cb', 'to', 'inbox', 1);
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-008', 'email-003', '7aa0d4', 'cc', 'inbox', 1);
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-009', 'email-003', 'd62d4d', 'cc', 'inbox', 1);
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-010', 'email-003', '1ea074', 'to', 'sent', 1);

-- email-004: Sarah -> Mike (reply)
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-011', 'email-004', '1ea074', 'to', 'inbox', 1);
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-012', 'email-004', '7aa0d4', 'to', 'sent', 1);

-- email-005: David -> Engineering Team
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-013', 'email-005', 'f9c8d7', 'to', 'inbox', 1);
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-014', 'email-005', '8a0c57', 'to', 'inbox', 0);
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-015', 'email-005', '8f3a18', 'to', 'inbox', 1);
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-016', 'email-005', 'test03', 'to', 'inbox', 1);
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-017', 'email-005', 'd827cb', 'to', 'sent', 1);

-- email-006: Jennifer -> David (reply)
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-018', 'email-006', 'd827cb', 'to', 'inbox', 1);
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-019', 'email-006', 'f9c8d7', 'to', 'sent', 1);

-- email-007: Lisa -> David (reply)
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-020', 'email-007', 'd827cb', 'to', 'inbox', 1);
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-021', 'email-007', '8f3a18', 'to', 'sent', 1);

-- email-008: Patricia -> All (Holiday Schedule)
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-022', 'email-008', '241a6d', 'to', 'inbox', 0);
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-023', 'email-008', 'cdb964', 'to', 'inbox', 1);
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-024', 'email-008', '714fd4', 'to', 'inbox', 1);
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-025', 'email-008', '1ea074', 'to', 'inbox', 1);
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-026', 'email-008', 'd827cb', 'to', 'inbox', 0);
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-027', 'email-008', 'test01', 'to', 'inbox', 1);
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-028', 'email-008', '4f6f43', 'to', 'sent', 1);

-- email-009: Alex -> Mike (Equipment Request)
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-029', 'email-009', '1ea074', 'to', 'inbox', 1);
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-030', 'email-009', 'test01', 'to', 'sent', 1);

-- email-010: Mike -> Alex (reply)
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-031', 'email-010', 'test01', 'to', 'inbox', 1);
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-032', 'email-010', '1ea074', 'to', 'sent', 1);

-- email-011: Chris -> Thomas (Sales Update)
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-033', 'email-011', '241a6d', 'to', 'inbox', 1);
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-034', 'email-011', '1e4e5c', 'to', 'sent', 1);

-- email-012: Thomas -> Chris (reply)
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-035', 'email-012', '1e4e5c', 'to', 'inbox', 1);
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-036', 'email-012', '241a6d', 'to', 'sent', 1);

-- email-013: David -> Engineering Team (Team Building)
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-037', 'email-013', 'f9c8d7', 'to', 'inbox', 1);
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-038', 'email-013', '8a0c57', 'to', 'inbox', 1);
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-039', 'email-013', '8f3a18', 'to', 'inbox', 1);
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-040', 'email-013', 'test03', 'to', 'inbox', 1);
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-041', 'email-013', 'd827cb', 'to', 'sent', 1);

-- email-014: Morgan -> David (reply)
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-042', 'email-014', 'd827cb', 'to', 'inbox', 1);
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-043', 'email-014', 'test03', 'to', 'sent', 1);

-- email-015: Patricia -> All (Benefits)
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-044', 'email-015', '241a6d', 'to', 'inbox', 1);
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-045', 'email-015', 'cdb964', 'to', 'inbox', 1);
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-046', 'email-015', '714fd4', 'to', 'inbox', 1);
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-047', 'email-015', '1ea074', 'to', 'inbox', 1);
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-048', 'email-015', 'd827cb', 'to', 'inbox', 1);
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-049', 'email-015', 'test01', 'to', 'inbox', 1);
INSERT INTO email_recipients (profile_id, id, email_id, personnel_id, type, folder, read) VALUES ('mmc', 'recip-050', 'email-015', '4f6f43', 'to', 'sent', 1);
