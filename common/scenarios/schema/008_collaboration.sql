-- ============================================================================
-- 008_collaboration.sql - Chat Channels, Memberships, Messages
-- ============================================================================
-- Full data extracted from chat.toml (6 channels, 36 memberships, 23 messages)

CREATE TABLE IF NOT EXISTS chat_channels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'channel' CHECK(type IN ('channel', 'direct'))
);

CREATE TABLE IF NOT EXISTS chat_memberships (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL REFERENCES chat_channels(id),
    person_id TEXT NOT NULL REFERENCES personnel(id),
    joined_at TEXT DEFAULT (datetime('now')),
    UNIQUE(channel_id, person_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL REFERENCES chat_channels(id),
    sender_id TEXT NOT NULL REFERENCES personnel(id),
    content TEXT NOT NULL,
    sent_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================================
-- DATA: Chat Channels (6 channels)
-- ============================================================================

INSERT INTO chat_channels (id, name, description, type) VALUES ('general', 'general', 'Company-wide announcements and discussions', 'channel');
INSERT INTO chat_channels (id, name, description, type) VALUES ('engineering', 'engineering', 'Engineering team discussions and technical updates', 'channel');
INSERT INTO chat_channels (id, name, description, type) VALUES ('it-helpdesk', 'it-helpdesk', 'IT support requests and system updates', 'channel');
INSERT INTO chat_channels (id, name, description, type) VALUES ('sales', 'sales', 'Sales team coordination and pipeline updates', 'channel');
INSERT INTO chat_channels (id, name, description, type) VALUES ('executive', 'executive', 'Leadership team discussions', 'channel');
INSERT INTO chat_channels (id, name, description, type) VALUES ('random', 'random', 'Off-topic conversations and water cooler chat', 'channel');

-- ============================================================================
-- DATA: Chat Memberships (36 memberships)
-- ============================================================================

INSERT INTO chat_memberships (id, channel_id, person_id) VALUES ('mem-001', 'general', '241a6d');
INSERT INTO chat_memberships (id, channel_id, person_id) VALUES ('mem-002', 'general', 'cdb964');
INSERT INTO chat_memberships (id, channel_id, person_id) VALUES ('mem-003', 'general', '714fd4');
INSERT INTO chat_memberships (id, channel_id, person_id) VALUES ('mem-004', 'general', '1ea074');
INSERT INTO chat_memberships (id, channel_id, person_id) VALUES ('mem-005', 'general', 'd827cb');
INSERT INTO chat_memberships (id, channel_id, person_id) VALUES ('mem-006', 'general', '4f6f43');
INSERT INTO chat_memberships (id, channel_id, person_id) VALUES ('mem-007', 'general', 'test01');
INSERT INTO chat_memberships (id, channel_id, person_id) VALUES ('mem-008', 'general', 'test02');
INSERT INTO chat_memberships (id, channel_id, person_id) VALUES ('mem-009', 'general', 'test03');
INSERT INTO chat_memberships (id, channel_id, person_id) VALUES ('mem-010', 'general', 'test04');
INSERT INTO chat_memberships (id, channel_id, person_id) VALUES ('mem-011', 'general', 'test05');
INSERT INTO chat_memberships (id, channel_id, person_id) VALUES ('mem-012', 'engineering', '714fd4');
INSERT INTO chat_memberships (id, channel_id, person_id) VALUES ('mem-013', 'engineering', 'd827cb');
INSERT INTO chat_memberships (id, channel_id, person_id) VALUES ('mem-014', 'engineering', 'f9c8d7');
INSERT INTO chat_memberships (id, channel_id, person_id) VALUES ('mem-015', 'engineering', '8a0c57');
INSERT INTO chat_memberships (id, channel_id, person_id) VALUES ('mem-016', 'engineering', '8f3a18');
INSERT INTO chat_memberships (id, channel_id, person_id) VALUES ('mem-017', 'engineering', 'test03');
INSERT INTO chat_memberships (id, channel_id, person_id) VALUES ('mem-018', 'it-helpdesk', '1ea074');
INSERT INTO chat_memberships (id, channel_id, person_id) VALUES ('mem-019', 'it-helpdesk', '7aa0d4');
INSERT INTO chat_memberships (id, channel_id, person_id) VALUES ('mem-020', 'it-helpdesk', 'd62d4d');
INSERT INTO chat_memberships (id, channel_id, person_id) VALUES ('mem-021', 'it-helpdesk', 'test01');
INSERT INTO chat_memberships (id, channel_id, person_id) VALUES ('mem-022', 'it-helpdesk', 'test05');
INSERT INTO chat_memberships (id, channel_id, person_id) VALUES ('mem-023', 'sales', '1e4e5c');
INSERT INTO chat_memberships (id, channel_id, person_id) VALUES ('mem-024', 'sales', 'e8a466');
INSERT INTO chat_memberships (id, channel_id, person_id) VALUES ('mem-025', 'sales', '4d9154');
INSERT INTO chat_memberships (id, channel_id, person_id) VALUES ('mem-026', 'sales', '5eedf9');
INSERT INTO chat_memberships (id, channel_id, person_id) VALUES ('mem-027', 'sales', 'test02');
INSERT INTO chat_memberships (id, channel_id, person_id) VALUES ('mem-028', 'executive', '241a6d');
INSERT INTO chat_memberships (id, channel_id, person_id) VALUES ('mem-029', 'executive', 'cdb964');
INSERT INTO chat_memberships (id, channel_id, person_id) VALUES ('mem-030', 'executive', '714fd4');
INSERT INTO chat_memberships (id, channel_id, person_id) VALUES ('mem-031', 'executive', 'test04');
INSERT INTO chat_memberships (id, channel_id, person_id) VALUES ('mem-032', 'random', '7aa0d4');
INSERT INTO chat_memberships (id, channel_id, person_id) VALUES ('mem-033', 'random', '8f3a18');
INSERT INTO chat_memberships (id, channel_id, person_id) VALUES ('mem-034', 'random', 'test01');
INSERT INTO chat_memberships (id, channel_id, person_id) VALUES ('mem-035', 'random', 'test03');
INSERT INTO chat_memberships (id, channel_id, person_id) VALUES ('mem-036', 'random', 'test05');

-- ============================================================================
-- DATA: Chat Messages (23 messages)
-- ============================================================================

INSERT INTO chat_messages (id, channel_id, sender_id, content, sent_at) VALUES ('msg-001', 'general', '241a6d', 'Welcome to the new team chat system! 🎉 Looking forward to more efficient collaboration across all departments.', '2024-12-05T09:00:00-05:00');
INSERT INTO chat_messages (id, channel_id, sender_id, content, sent_at) VALUES ('msg-002', 'general', '714fd4', 'Great to see everyone here. If you have any technical questions about using the platform, the IT team is ready to help.', '2024-12-05T09:15:00-05:00');
INSERT INTO chat_messages (id, channel_id, sender_id, content, sent_at) VALUES ('msg-003', 'general', '4f6f43', 'Reminder: Open enrollment for benefits ends Friday. Please submit any changes by EOD Thursday.', '2024-12-09T10:30:00-05:00');
INSERT INTO chat_messages (id, channel_id, sender_id, content, sent_at) VALUES ('msg-004', 'general', '241a6d', 'Congratulations to the engineering team on shipping the v2.0 release ahead of schedule! 👏', '2024-12-12T14:00:00-05:00');
INSERT INTO chat_messages (id, channel_id, sender_id, content, sent_at) VALUES ('msg-005', 'engineering', 'd827cb', 'Team standup moving to 9:30 AM starting next week. Please update your calendars.', '2024-12-06T08:45:00-05:00');
INSERT INTO chat_messages (id, channel_id, sender_id, content, sent_at) VALUES ('msg-006', 'engineering', 'f9c8d7', 'The thermal analysis for the new HVAC unit is complete. Results look promising - 15% efficiency improvement over baseline.', '2024-12-10T11:20:00-05:00');
INSERT INTO chat_messages (id, channel_id, sender_id, content, sent_at) VALUES ('msg-007', 'engineering', '8f3a18', 'Updated CAD files for the compressor housing are in the shared drive. Ready for review.', '2024-12-11T16:00:00-05:00');
INSERT INTO chat_messages (id, channel_id, sender_id, content, sent_at) VALUES ('msg-008', 'engineering', 'test03', 'Working on updated UI mockups for the control panel. Will share by end of week.', '2024-12-12T09:30:00-05:00');
INSERT INTO chat_messages (id, channel_id, sender_id, content, sent_at) VALUES ('msg-009', 'it-helpdesk', '1ea074', 'Scheduled maintenance this Saturday 2-4 AM. Email and file servers will be briefly unavailable.', '2024-12-05T14:00:00-05:00');
INSERT INTO chat_messages (id, channel_id, sender_id, content, sent_at) VALUES ('msg-010', 'it-helpdesk', '7aa0d4', 'VPN issues should now be resolved. Please let us know if you''re still experiencing connectivity problems.', '2024-12-08T10:15:00-05:00');
INSERT INTO chat_messages (id, channel_id, sender_id, content, sent_at) VALUES ('msg-011', 'it-helpdesk', 'test05', 'New printer installed on the second floor. Driver package is in the software center.', '2024-12-10T13:45:00-05:00');
INSERT INTO chat_messages (id, channel_id, sender_id, content, sent_at) VALUES ('msg-012', 'it-helpdesk', 'test01', 'Automated test suite updated to cover the new integration endpoints. All green ✅', '2024-12-12T15:30:00-05:00');
INSERT INTO chat_messages (id, channel_id, sender_id, content, sent_at) VALUES ('msg-013', 'sales', '1e4e5c', 'Great Q4 so far! Midwest region is tracking 20% over target. Keep pushing team!', '2024-12-06T16:00:00-05:00');
INSERT INTO chat_messages (id, channel_id, sender_id, content, sent_at) VALUES ('msg-014', 'sales', '5eedf9', 'Just closed the Thompson Industries deal. $2.4M contract signed yesterday! 🎯', '2024-12-09T09:00:00-05:00');
INSERT INTO chat_messages (id, channel_id, sender_id, content, sent_at) VALUES ('msg-015', 'sales', '4d9154', 'Meeting with Ford''s facilities team next week. Anyone have recent case studies for automotive sector?', '2024-12-11T11:00:00-05:00');
INSERT INTO chat_messages (id, channel_id, sender_id, content, sent_at) VALUES ('msg-016', 'sales', 'test02', 'I have the Detroit manufacturing plant case study. Sending it over now.', '2024-12-11T11:15:00-05:00');
INSERT INTO chat_messages (id, channel_id, sender_id, content, sent_at) VALUES ('msg-017', 'executive', '241a6d', 'Board meeting next Thursday. Please have your Q4 presentations ready by Tuesday.', '2024-12-05T08:00:00-05:00');
INSERT INTO chat_messages (id, channel_id, sender_id, content, sent_at) VALUES ('msg-018', 'executive', 'cdb964', 'Preliminary financials look strong. We''re on track to exceed annual revenue targets by 8%.', '2024-12-10T10:00:00-05:00');
INSERT INTO chat_messages (id, channel_id, sender_id, content, sent_at) VALUES ('msg-019', 'executive', '714fd4', 'Digital transformation initiative update: IoT pilot program at Indianapolis plant showing 12% reduction in downtime.', '2024-12-12T11:30:00-05:00');
INSERT INTO chat_messages (id, channel_id, sender_id, content, sent_at) VALUES ('msg-020', 'random', '7aa0d4', 'Anyone want to join a lunch run to the new ramen place downtown?', '2024-12-06T11:30:00-05:00');
INSERT INTO chat_messages (id, channel_id, sender_id, content, sent_at) VALUES ('msg-021', 'random', '8f3a18', 'I''m in! Their tonkotsu is supposed to be amazing 🍜', '2024-12-06T11:32:00-05:00');
INSERT INTO chat_messages (id, channel_id, sender_id, content, sent_at) VALUES ('msg-022', 'random', 'test01', 'Count me in too!', '2024-12-06T11:35:00-05:00');
INSERT INTO chat_messages (id, channel_id, sender_id, content, sent_at) VALUES ('msg-023', 'random', 'test05', 'Happy Friday everyone! 🎉 Any weekend plans?', '2024-12-13T16:00:00-05:00');
