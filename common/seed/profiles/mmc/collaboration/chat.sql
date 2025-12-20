-- CHAT_CHANNELS
INSERT INTO chat_channels (profile_id, id, name, description, type) VALUES ('mmc', 'general', 'general', 'Company-wide announcements and discussions', 'channel');
INSERT INTO chat_channels (profile_id, id, name, description, type) VALUES ('mmc', 'engineering', 'engineering', 'Engineering team discussions and technical updates', 'channel');
INSERT INTO chat_channels (profile_id, id, name, description, type) VALUES ('mmc', 'it-helpdesk', 'it-helpdesk', 'IT support requests and system updates', 'channel');
INSERT INTO chat_channels (profile_id, id, name, description, type) VALUES ('mmc', 'sales', 'sales', 'Sales team coordination and pipeline updates', 'channel');
INSERT INTO chat_channels (profile_id, id, name, description, type) VALUES ('mmc', 'executive', 'executive', 'Leadership team discussions', 'channel');
INSERT INTO chat_channels (profile_id, id, name, description, type) VALUES ('mmc', 'random', 'random', 'Off-topic conversations and water cooler chat', 'channel');

-- CHAT_MEMBERSHIPS
INSERT INTO chat_memberships (profile_id, id, channel_id, person_id) VALUES ('mmc', 'mem-001', 'general', '241a6d');
INSERT INTO chat_memberships (profile_id, id, channel_id, person_id) VALUES ('mmc', 'mem-002', 'general', 'cdb964');
INSERT INTO chat_memberships (profile_id, id, channel_id, person_id) VALUES ('mmc', 'mem-003', 'general', '714fd4');
INSERT INTO chat_memberships (profile_id, id, channel_id, person_id) VALUES ('mmc', 'mem-004', 'general', '1ea074');
INSERT INTO chat_memberships (profile_id, id, channel_id, person_id) VALUES ('mmc', 'mem-005', 'general', 'd827cb');
INSERT INTO chat_memberships (profile_id, id, channel_id, person_id) VALUES ('mmc', 'mem-006', 'general', '4f6f43');
INSERT INTO chat_memberships (profile_id, id, channel_id, person_id) VALUES ('mmc', 'mem-007', 'general', 'test01');
INSERT INTO chat_memberships (profile_id, id, channel_id, person_id) VALUES ('mmc', 'mem-008', 'general', 'test02');
INSERT INTO chat_memberships (profile_id, id, channel_id, person_id) VALUES ('mmc', 'mem-009', 'general', 'test03');
INSERT INTO chat_memberships (profile_id, id, channel_id, person_id) VALUES ('mmc', 'mem-010', 'general', 'test04');
INSERT INTO chat_memberships (profile_id, id, channel_id, person_id) VALUES ('mmc', 'mem-011', 'general', 'test05');
INSERT INTO chat_memberships (profile_id, id, channel_id, person_id) VALUES ('mmc', 'mem-012', 'engineering', '714fd4');
INSERT INTO chat_memberships (profile_id, id, channel_id, person_id) VALUES ('mmc', 'mem-013', 'engineering', 'd827cb');
INSERT INTO chat_memberships (profile_id, id, channel_id, person_id) VALUES ('mmc', 'mem-014', 'engineering', 'f9c8d7');
INSERT INTO chat_memberships (profile_id, id, channel_id, person_id) VALUES ('mmc', 'mem-015', 'engineering', '8a0c57');
INSERT INTO chat_memberships (profile_id, id, channel_id, person_id) VALUES ('mmc', 'mem-016', 'engineering', '8f3a18');
INSERT INTO chat_memberships (profile_id, id, channel_id, person_id) VALUES ('mmc', 'mem-017', 'engineering', 'test03');
INSERT INTO chat_memberships (profile_id, id, channel_id, person_id) VALUES ('mmc', 'mem-018', 'it-helpdesk', '1ea074');
INSERT INTO chat_memberships (profile_id, id, channel_id, person_id) VALUES ('mmc', 'mem-019', 'it-helpdesk', '7aa0d4');
INSERT INTO chat_memberships (profile_id, id, channel_id, person_id) VALUES ('mmc', 'mem-020', 'it-helpdesk', 'd62d4d');
INSERT INTO chat_memberships (profile_id, id, channel_id, person_id) VALUES ('mmc', 'mem-021', 'it-helpdesk', 'test01');
INSERT INTO chat_memberships (profile_id, id, channel_id, person_id) VALUES ('mmc', 'mem-022', 'it-helpdesk', 'test05');
INSERT INTO chat_memberships (profile_id, id, channel_id, person_id) VALUES ('mmc', 'mem-023', 'sales', '1e4e5c');
INSERT INTO chat_memberships (profile_id, id, channel_id, person_id) VALUES ('mmc', 'mem-024', 'sales', 'e8a466');
INSERT INTO chat_memberships (profile_id, id, channel_id, person_id) VALUES ('mmc', 'mem-025', 'sales', '4d9154');
INSERT INTO chat_memberships (profile_id, id, channel_id, person_id) VALUES ('mmc', 'mem-026', 'sales', '5eedf9');
INSERT INTO chat_memberships (profile_id, id, channel_id, person_id) VALUES ('mmc', 'mem-027', 'sales', 'test02');
INSERT INTO chat_memberships (profile_id, id, channel_id, person_id) VALUES ('mmc', 'mem-028', 'executive', '241a6d');
INSERT INTO chat_memberships (profile_id, id, channel_id, person_id) VALUES ('mmc', 'mem-029', 'executive', 'cdb964');
INSERT INTO chat_memberships (profile_id, id, channel_id, person_id) VALUES ('mmc', 'mem-030', 'executive', '714fd4');
INSERT INTO chat_memberships (profile_id, id, channel_id, person_id) VALUES ('mmc', 'mem-031', 'executive', 'test04');
INSERT INTO chat_memberships (profile_id, id, channel_id, person_id) VALUES ('mmc', 'mem-032', 'random', '7aa0d4');
INSERT INTO chat_memberships (profile_id, id, channel_id, person_id) VALUES ('mmc', 'mem-033', 'random', '8f3a18');
INSERT INTO chat_memberships (profile_id, id, channel_id, person_id) VALUES ('mmc', 'mem-034', 'random', 'test01');
INSERT INTO chat_memberships (profile_id, id, channel_id, person_id) VALUES ('mmc', 'mem-035', 'random', 'test03');
INSERT INTO chat_memberships (profile_id, id, channel_id, person_id) VALUES ('mmc', 'mem-036', 'random', 'test05');

-- CHAT_MESSAGES
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-001', 'general', '241a6d', 'Welcome to the new team chat system! 🎉 Looking forward to more efficient collaboration across all departments.', '2024-12-05T09:00:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-002', 'general', '714fd4', 'Great to see everyone here. If you have any technical questions about using the platform, the IT team is ready to help.', '2024-12-05T09:15:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-003', 'general', '4f6f43', 'Reminder: Open enrollment for benefits ends Friday. Please submit any changes by EOD Thursday.', '2024-12-09T10:30:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-004', 'general', '241a6d', 'Congratulations to the engineering team on shipping the v2.0 release ahead of schedule! 👏', '2024-12-12T14:00:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-005', 'engineering', 'd827cb', 'Team standup moving to 9:30 AM starting next week. Please update your calendars.', '2024-12-06T08:45:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-006', 'engineering', 'f9c8d7', 'The thermal analysis for the new HVAC unit is complete. Results look promising - 15% efficiency improvement over baseline.', '2024-12-10T11:20:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-007', 'engineering', '8f3a18', 'Updated CAD files for the compressor housing are in the shared drive. Ready for review.', '2024-12-11T16:00:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-008', 'engineering', 'test03', 'Working on updated UI mockups for the control panel. Will share by end of week.', '2024-12-12T09:30:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-009', 'it-helpdesk', '1ea074', 'Scheduled maintenance this Saturday 2-4 AM. Email and file servers will be briefly unavailable.', '2024-12-05T14:00:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-010', 'it-helpdesk', '7aa0d4', 'VPN issues should now be resolved. Please let us know if you''re still experiencing connectivity problems.', '2024-12-08T10:15:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-011', 'it-helpdesk', 'test05', 'New printer installed on the second floor. Driver package is in the software center.', '2024-12-10T13:45:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-012', 'it-helpdesk', 'test01', 'Automated test suite updated to cover the new integration endpoints. All green ✅', '2024-12-12T15:30:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-013', 'sales', '1e4e5c', 'Great Q4 so far! Midwest region is tracking 20% over target. Keep pushing team!', '2024-12-06T16:00:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-014', 'sales', '5eedf9', 'Just closed the Thompson Industries deal. $2.4M contract signed yesterday! 🎯', '2024-12-09T09:00:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-015', 'sales', '4d9154', 'Meeting with Ford''s facilities team next week. Anyone have recent case studies for automotive sector?', '2024-12-11T11:00:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-016', 'sales', 'test02', 'I have the Detroit manufacturing plant case study. Sending it over now.', '2024-12-11T11:15:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-017', 'executive', '241a6d', 'Board meeting next Thursday. Please have your Q4 presentations ready by Tuesday.', '2024-12-05T08:00:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-018', 'executive', 'cdb964', 'Preliminary financials look strong. We''re on track to exceed annual revenue targets by 8%.', '2024-12-10T10:00:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-019', 'executive', '714fd4', 'Digital transformation initiative update: IoT pilot program at Indianapolis plant showing 12% reduction in downtime.', '2024-12-12T11:30:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-020', 'random', '7aa0d4', 'Anyone want to join a lunch run to the new ramen place downtown?', '2024-12-06T11:30:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-021', 'random', '8f3a18', 'I''m in! Their tonkotsu is supposed to be amazing 🍜', '2024-12-06T11:32:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-022', 'random', 'test01', 'Count me in too!', '2024-12-06T11:35:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-023', 'random', 'test05', 'Happy Friday everyone! 🎉 Any weekend plans?', '2024-12-13T16:00:00-05:00');

-- GENERAL CHANNEL - Increased traffic starting Dec 12
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-100', 'general', 'd827cb', 'Thanks Thomas! The team worked incredibly hard on this release.', '2024-12-12T14:05:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-101', 'general', '714fd4', 'Agreed, great work everyone. The new features are getting positive feedback from the pilot customers.', '2024-12-12T14:10:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-102', 'general', 'test01', 'The automated testing coverage helped us catch issues early. Really proud of what we achieved.', '2024-12-12T14:15:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-103', 'general', '1ea074', 'IT systems performed flawlessly during the deployment. Nice job coordinating, Richard.', '2024-12-12T14:20:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-104', 'general', 'test04', 'This is exactly the kind of cross-team execution we need to see more of!', '2024-12-12T14:25:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-105', 'general', '241a6d', 'Reminder: Holiday party this Friday at 3pm in the reception area. Everyone is welcome! 🎄', '2024-12-12T15:00:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-106', 'general', '4f6f43', 'Looking forward to it! HR has some fun activities planned.', '2024-12-12T15:05:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-107', 'general', 'test03', 'Will there be the famous cookies from last year?', '2024-12-12T15:08:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-108', 'general', '4f6f43', 'Of course! Plus some new treats 🍪', '2024-12-12T15:10:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-109', 'general', 'cdb964', 'Q4 numbers are looking strong. Will share more details at the party.', '2024-12-12T16:00:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-110', 'general', 'test02', 'The Midwest sales numbers are contributing nicely! 📈', '2024-12-12T16:05:00-05:00');

-- Dec 13 - Friday before holiday party
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-111', 'general', '241a6d', 'Good morning everyone! Big day today - let''s finish strong before the weekend.', '2024-12-13T08:30:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-112', 'general', '714fd4', 'Morning! Server patches scheduled for tonight went through pre-checks. Ready to go.', '2024-12-13T08:35:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-113', 'general', 'd827cb', 'Engineering standup in 30 minutes. Good progress on the thermal efficiency project.', '2024-12-13T08:40:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-114', 'general', '1ea074', 'Reminder: IT will be doing some network maintenance over the weekend. Email will be briefly unavailable Saturday morning.', '2024-12-13T09:00:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-115', 'general', 'test05', 'Thanks for the heads up Mike!', '2024-12-13T09:05:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-116', 'general', 'test01', 'I''ll make sure to sync all my work before end of day.', '2024-12-13T09:08:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-117', 'general', '4f6f43', 'Party setup is almost done! See you all at 3pm in the lobby.', '2024-12-13T14:00:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-118', 'general', 'cdb964', 'On my way down now!', '2024-12-13T14:55:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-119', 'general', 'd827cb', 'Same, wrapping up one more email.', '2024-12-13T14:57:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-120', 'general', '241a6d', 'What a great party! Thanks to HR for organizing. Have a wonderful weekend everyone! 🎉', '2024-12-13T17:30:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-121', 'general', 'test03', 'Those cookies were even better than last year!', '2024-12-13T17:32:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-122', 'general', '4f6f43', 'Thank you everyone for making it special! Happy holidays! ❄️', '2024-12-13T17:35:00-05:00');

-- Dec 16 - Monday after weekend
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-123', 'general', '241a6d', 'Good morning! Hope everyone had a restful weekend. Big week ahead - Q4 Business Review is today.', '2024-12-16T08:00:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-124', 'general', 'cdb964', 'Presentation decks are ready. Finance team did a great job pulling everything together.', '2024-12-16T08:15:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-125', 'general', '714fd4', 'IT section is all set. IoT metrics are impressive this quarter.', '2024-12-16T08:20:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-126', 'general', 'd827cb', 'Engineering demos are cued up. New HVAC efficiency data should be a highlight.', '2024-12-16T08:25:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-127', 'general', '1ea074', 'Network upgrades completed successfully over the weekend. No issues reported.', '2024-12-16T08:30:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-128', 'general', 'test04', 'I''ll be taking notes during the review. Let me know if there''s anything specific to capture.', '2024-12-16T08:35:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-129', 'general', '241a6d', 'Excellent progress on the business review this morning. Taking a break now, more sessions this afternoon.', '2024-12-16T12:30:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-130', 'general', 'test02', 'The sales numbers presentation went really well! Midwest region looking strong.', '2024-12-16T12:35:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-131', 'general', 'd827cb', 'Engineering demo got some great questions. Customers are excited about the efficiency improvements.', '2024-12-16T12:40:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-132', 'general', 'cdb964', 'Review complete! Strong finish to Q4. Details coming in the all-hands next week.', '2024-12-16T17:00:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-133', 'general', '241a6d', 'Great work everyone. This sets us up well for 2025. 🎯', '2024-12-16T17:05:00-05:00');

-- Dec 17 - Tuesday
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-134', 'general', '1ea074', 'IT team reminder: Security training compliance due by Friday. Please complete if you haven''t already.', '2024-12-17T09:00:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-135', 'general', 'test01', 'Just finished mine. The phishing simulation section was interesting.', '2024-12-17T09:15:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-136', 'general', 'test05', 'Same here, done! ✅', '2024-12-17T09:20:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-137', 'general', 'd827cb', 'Engineering team is mostly complete. Finishing up with a few stragglers.', '2024-12-17T09:25:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-138', 'general', '714fd4', 'Thanks Mike for staying on top of this. Security is everyone''s responsibility.', '2024-12-17T09:30:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-139', 'general', '4f6f43', 'HR compliance dashboard shows we''re at 87% complete company-wide. Great progress!', '2024-12-17T10:00:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-140', 'general', 'test03', 'Just submitted mine. Cutting it close! 😅', '2024-12-17T10:30:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-141', 'general', '241a6d', 'Heads up: Board meeting on Thursday. I''ll be mostly unavailable that day.', '2024-12-17T14:00:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-142', 'general', 'cdb964', 'Same here - will be in board prep sessions most of tomorrow and presenting Thursday.', '2024-12-17T14:05:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-143', 'general', '714fd4', 'Good luck to both of you! Let me know if you need any last-minute tech updates.', '2024-12-17T14:10:00-05:00');

-- Dec 18 - Wednesday
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-144', 'general', '1ea074', 'Security audit complete! Clean bill of health. Report will be shared after holiday break.', '2024-12-18T10:00:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-145', 'general', '714fd4', 'Excellent news Mike! The team''s work on security improvements really paid off.', '2024-12-18T10:05:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-146', 'general', 'test01', 'Our automated security scanning helped identify issues early. Happy it contributed!', '2024-12-18T10:10:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-147', 'general', 'd827cb', 'Great job IT team! Engineering appreciates the stable infrastructure.', '2024-12-18T10:15:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-148', 'general', 'test04', 'Updating the project tracker with this milestone. Important for Q1 planning.', '2024-12-18T10:20:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-149', 'general', '4f6f43', 'Reminder: If you''re taking time off over the holidays, please update your out-of-office and calendar.', '2024-12-18T11:00:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-150', 'general', 'test03', 'Good reminder Patricia. Mine is set for Dec 23 - Jan 2.', '2024-12-18T11:05:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-151', 'general', 'test02', 'Sales coverage is coordinated. Someone from the team will be available throughout.', '2024-12-18T11:10:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-152', 'general', '1ea074', 'IT on-call schedule is posted. Reach out to the help desk number for emergencies.', '2024-12-18T11:15:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-153', 'general', 'd827cb', 'Engineering is doing a code freeze starting Friday. Only critical fixes through Jan 6.', '2024-12-18T14:00:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-154', 'general', 'test01', 'Makes sense. I''ll focus on documentation during the freeze period.', '2024-12-18T14:05:00-05:00');

-- Dec 19 - Thursday (Board meeting day)
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-155', 'general', '714fd4', 'Good morning! Thomas and Margaret are in board meetings today. I''ll be covering executive decisions.', '2024-12-19T08:00:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-156', 'general', '1ea074', 'Got it Richard. IT is standing by for any tech support needs.', '2024-12-19T08:05:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-157', 'general', 'd827cb', 'Engineering team is focused on sprint wrap-up today. Sprint review at 3pm.', '2024-12-19T08:10:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-158', 'general', 'test04', 'I''ll join the sprint review to help document outcomes.', '2024-12-19T08:15:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-159', 'general', '4f6f43', 'Annual employee satisfaction survey results are in! Overall score: 4.2/5 ⭐', '2024-12-19T10:00:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-160', 'general', 'test03', 'That''s great news! Any highlights?', '2024-12-19T10:05:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-161', 'general', '4f6f43', 'Work-life balance and team collaboration scored highest. Areas for growth: career development clarity.', '2024-12-19T10:10:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-162', 'general', '714fd4', 'Good insights. We should incorporate this into 2025 planning.', '2024-12-19T10:15:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-163', 'general', 'test05', 'Will there be action items shared for each department?', '2024-12-19T10:20:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-164', 'general', '4f6f43', 'Yes! Each manager will get detailed breakdowns in January.', '2024-12-19T10:25:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-165', 'general', '241a6d', 'Board meeting went very well! Strong support for our 2025 strategy. More details at January all-hands.', '2024-12-19T16:00:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-166', 'general', 'cdb964', 'Board approved the capital expenditure plan. Exciting investments coming in Q1!', '2024-12-19T16:05:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-167', 'general', '714fd4', 'Great news! Looking forward to the details.', '2024-12-19T16:10:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-168', 'general', 'd827cb', 'Sprint review was productive. We''re on track for Q1 deliverables.', '2024-12-19T16:30:00-05:00');

-- Dec 20 - Friday (Last working day before holidays for many)
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-169', 'general', '241a6d', 'Good morning! Last day before the holiday break for many of us. Let''s tie up loose ends.', '2024-12-20T08:00:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-170', 'general', 'cdb964', 'Year-end financial close is progressing well. Team is doing great work.', '2024-12-20T08:30:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-171', 'general', '1ea074', 'IT systems in holiday mode. Reduced monitoring but on-call available 24/7.', '2024-12-20T09:00:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-172', 'general', 'd827cb', 'Engineering code freeze is now in effect. See you all in the new year! 🎊', '2024-12-20T09:30:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-173', 'general', 'test01', 'QA handoff complete. All critical tests passing. Happy holidays everyone!', '2024-12-20T10:00:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-174', 'general', 'test04', 'Project status reports updated. We''re in good shape for 2025 kickoff.', '2024-12-20T10:30:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-175', 'general', '4f6f43', 'Thank you all for another amazing year at MMC! HR wishes everyone safe and happy holidays! ❄️🎄', '2024-12-20T11:00:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-176', 'general', 'test03', 'Happy holidays! See you in 2025!', '2024-12-20T11:05:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-177', 'general', 'test02', 'What a year! Sales team is already excited about Q1. Happy holidays! 🎁', '2024-12-20T11:10:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-178', 'general', 'test05', 'Happy holidays from IT support! We''ll keep the lights on 💡', '2024-12-20T11:15:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-179', 'general', '714fd4', 'What an incredible year of progress. Thank you all for your dedication. See you in 2025! 🚀', '2024-12-20T11:30:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-180', 'general', '241a6d', 'Couldn''t have asked for a better team. Enjoy the break, recharge, and come back ready for our best year yet. Happy holidays everyone! 🎄⛄', '2024-12-20T12:00:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-181', 'general', '714fd4', 'Just wanted to add - the new collaboration tools have been a game changer this year. Looking forward to even more improvements in 2025! 🚀', '2024-12-20T12:15:00-05:00');

-- EXECUTIVE CHANNEL - Increased traffic starting Dec 12
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-200', 'executive', '241a6d', 'Team, Q4 is shaping up to be our strongest quarter. Revenue tracking 12% above forecast.', '2024-12-12T15:00:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-201', 'executive', 'cdb964', 'Margins are also healthy. We''ve managed costs well despite supply chain pressures.', '2024-12-12T15:10:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-202', 'executive', '714fd4', 'Digital transformation investments are paying off. Customer satisfaction is up 8 points.', '2024-12-12T15:15:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-203', 'executive', 'test04', 'I''ll have the consolidated project portfolio review ready for Monday.', '2024-12-12T15:20:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-204', 'executive', '241a6d', 'Thanks Taylor. The board will want to see project ROI during Thursday''s meeting.', '2024-12-12T15:25:00-05:00');

-- Dec 13
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-205', 'executive', 'cdb964', 'Year-end closing procedures begin next week. Audit prep is on schedule.', '2024-12-13T09:00:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-206', 'executive', '241a6d', 'Good. Any concerns about the audit?', '2024-12-13T09:05:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-207', 'executive', 'cdb964', 'None significant. The new accounting system has improved our documentation considerably.', '2024-12-13T09:10:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-208', 'executive', '714fd4', 'IT is ready to support any data requests from auditors. Access controls are documented.', '2024-12-13T09:15:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-209', 'executive', 'test04', 'Project financial tracking has been reconciled. All major projects within 5% of budget.', '2024-12-13T09:20:00-05:00');

-- Dec 16
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-210', 'executive', '241a6d', 'Business review went well. Board prep for Thursday?', '2024-12-16T17:30:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-211', 'executive', 'cdb964', 'Financial slides are complete. Conservative projections for 2025 with upside scenarios.', '2024-12-16T17:35:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-212', 'executive', '714fd4', 'Tech roadmap is ready. IoT expansion and cybersecurity investments highlighted.', '2024-12-16T17:40:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-213', 'executive', '241a6d', 'Perfect. Let''s do a dry run tomorrow at 2pm.', '2024-12-16T17:45:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-214', 'executive', 'test04', 'I''ll reserve the board room and set up the presentation equipment.', '2024-12-16T17:50:00-05:00');

-- Dec 17
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-215', 'executive', '241a6d', 'Morning. Any overnight developments?', '2024-12-17T07:30:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-216', 'executive', '714fd4', 'All systems stable. No issues to report.', '2024-12-17T07:35:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-217', 'executive', 'cdb964', 'Wire transfers completed successfully for vendor payments.', '2024-12-17T07:40:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-218', 'executive', 'test04', 'Board room is prepped for the 2pm dry run.', '2024-12-17T13:45:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-219', 'executive', '241a6d', 'Great dry run. Some minor tweaks to the strategy section but overall we''re ready.', '2024-12-17T15:30:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-220', 'executive', 'cdb964', 'I''ll update the financial summary slide tonight.', '2024-12-17T15:35:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-221', 'executive', '714fd4', 'Tech demo sequence is polished. Should take exactly 8 minutes.', '2024-12-17T15:40:00-05:00');

-- Dec 18
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-222', 'executive', 'cdb964', 'Final board deck is uploaded to the secure portal. All directors have access.', '2024-12-18T08:00:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-223', 'executive', '241a6d', 'Perfect timing. Any advance questions from board members?', '2024-12-18T08:10:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-224', 'executive', 'cdb964', 'Bill Richardson asked about supply chain mitigation. I''ve prepared supplemental slides.', '2024-12-18T08:15:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-225', 'executive', '714fd4', 'I can address any cybersecurity questions. Recent audit results support our position.', '2024-12-18T08:20:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-226', 'executive', 'test04', 'Timeline of key initiatives is summarized on page 42. Good reference for Q&A.', '2024-12-18T08:25:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-227', 'executive', '241a6d', 'Good team prep. Let''s get some rest tonight - big day tomorrow.', '2024-12-18T18:00:00-05:00');

-- Dec 19 - Board meeting day
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-228', 'executive', '241a6d', 'Heading into the board meeting now. Will update after each session.', '2024-12-19T08:45:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-229', 'executive', '714fd4', 'Good luck! I''m standing by for any tech support needs.', '2024-12-19T08:50:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-230', 'executive', 'cdb964', 'Session 1 complete - financial review went very well. Positive feedback on margins.', '2024-12-19T10:30:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-231', 'executive', '241a6d', 'Strategy session underway. Good discussion about market expansion.', '2024-12-19T11:30:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-232', 'executive', 'test04', 'Is there anything I should prepare for the afternoon sessions?', '2024-12-19T12:00:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-233', 'executive', 'cdb964', 'Can you pull the updated project ROI summary? Board wants to see it.', '2024-12-19T12:05:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-234', 'executive', 'test04', 'On it. Will have it ready in 15 minutes.', '2024-12-19T12:10:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-235', 'executive', '241a6d', 'Board meeting concluded successfully! All major items approved. Details tomorrow.', '2024-12-19T15:30:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-236', 'executive', 'cdb964', 'Capital expenditure plan approved! $4.2M for 2025 initiatives.', '2024-12-19T15:35:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-237', 'executive', '714fd4', 'Excellent! That includes the IoT expansion budget we requested.', '2024-12-19T15:40:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-238', 'executive', 'test04', 'Great news! I''ll update the project funding status in the tracker.', '2024-12-19T15:45:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-239', 'executive', '241a6d', 'Thank you all for the hard work preparing for this. The board was impressed.', '2024-12-19T16:00:00-05:00');

-- Dec 20
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-240', 'executive', '241a6d', 'Final day before holiday break. Any urgent items?', '2024-12-20T08:00:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-241', 'executive', 'cdb964', 'Year-end close is on track. Team knows what needs to be done.', '2024-12-20T08:05:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-242', 'executive', '714fd4', 'IT is in holiday mode. Critical coverage arranged. All systems stable.', '2024-12-20T08:10:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-243', 'executive', 'test04', 'Board meeting follow-up actions are documented. Calendar invites sent for January.', '2024-12-20T08:15:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-244', 'executive', '241a6d', 'Perfect. 2024 has been our best year yet. Thank you all for your leadership.', '2024-12-20T10:00:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-245', 'executive', 'cdb964', 'Couldn''t agree more. This team''s execution has been exceptional.', '2024-12-20T10:05:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-246', 'executive', '714fd4', 'Excited for what we''ll accomplish in 2025. The foundation is strong.', '2024-12-20T10:10:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-247', 'executive', 'test04', 'It''s been an honor working with this team. Happy holidays everyone!', '2024-12-20T10:15:00-05:00');
INSERT INTO chat_messages (profile_id, id, channel_id, sender_id, content, sent_at) VALUES ('mmc', 'msg-248', 'executive', '241a6d', 'Happy holidays to all! Enjoy the break. We''ll hit the ground running in January. 🎄', '2024-12-20T10:30:00-05:00');
