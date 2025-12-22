-- PRESENTATIONS
-- Sample presentations for MMC scenario

-- Q4 Business Review (Complete, multi-slide presentation)
INSERT INTO slides (id, profile_id, title, layout, content_json, notes, created_by, created_at, updated_at)
VALUES (100, 'mmc', 'Q4 2024 Business Review', 'title', '{"title":"Q4 2024 Business Review","subtitle":"Midwest Manufacturing Corp."}', 'Welcome everyone to our quarterly business review.', '241a6d', '2024-12-16T08:00:00-05:00', '2024-12-16T08:00:00-05:00');

INSERT INTO slides (id, profile_id, title, layout, content_json, notes, created_by, created_at, updated_at)
VALUES (101, 'mmc', 'Agenda', 'content', '{"title":"Agenda","body":"• Financial Performance\n• Operational Highlights\n• Digital Transformation Update\n• 2025 Outlook"}', 'Cover each main topic briefly.', '241a6d', '2024-12-16T08:00:00-05:00', '2024-12-16T08:00:00-05:00');

INSERT INTO slides (id, profile_id, title, layout, content_json, notes, created_by, created_at, updated_at)
VALUES (102, 'mmc', 'Financial Performance', 'content', '{"title":"Q4 Financial Performance","body":"• Revenue: $24.3M (+12% YoY)\n• Gross Margin: 34.2%\n• Operating Income: $3.1M\n• Cash Position: Strong"}', 'Margaret will present this section with detailed charts.', 'cdb964', '2024-12-16T08:00:00-05:00', '2024-12-16T08:00:00-05:00');

INSERT INTO slides (id, profile_id, title, layout, content_json, notes, created_by, created_at, updated_at)
VALUES (103, 'mmc', 'Operational Highlights', 'content', '{"title":"Operational Highlights","body":"• New HVAC line efficiency: +15%\n• Indianapolis plant IoT pilot successful\n• Manufacturing uptime: 98.7%\n• Quality metrics improved 8%"}', 'Richard will walk through tech improvements.', '714fd4', '2024-12-16T08:00:00-05:00', '2024-12-16T08:00:00-05:00');

INSERT INTO slides (id, profile_id, title, layout, content_json, notes, created_by, created_at, updated_at)
VALUES (104, 'mmc', 'Digital Transformation', 'content', '{"title":"Digital Transformation Update","body":"• IoT sensors deployed across 3 facilities\n• Real-time monitoring dashboard live\n• Predictive maintenance reducing downtime 12%\n• Cloud migration 60% complete"}', 'Highlight the ROI on technology investments.', '714fd4', '2024-12-16T08:00:00-05:00', '2024-12-16T08:00:00-05:00');

INSERT INTO slides (id, profile_id, title, layout, content_json, notes, created_by, created_at, updated_at)
VALUES (105, 'mmc', '2025 Outlook', 'content', '{"title":"2025 Outlook","body":"• Projected revenue growth: 8-12%\n• New product lines Q2 launch\n• Midwest expansion continues\n• $4.2M capital investment approved"}', 'End on a positive, forward-looking note.', '241a6d', '2024-12-16T08:00:00-05:00', '2024-12-16T08:00:00-05:00');

INSERT INTO slides (id, profile_id, title, layout, content_json, notes, created_by, created_at, updated_at)
VALUES (106, 'mmc', 'Thank You', 'title', '{"title":"Thank You","subtitle":"Questions?"}', 'Open floor for Q&A.', '241a6d', '2024-12-16T08:00:00-05:00', '2024-12-16T08:00:00-05:00');

-- Presentation container for Q4 Business Review
INSERT INTO presentations (id, profile_id, title, description, theme, aspect_ratio, transition, created_by, created_at, updated_at)
VALUES (100, 'mmc', 'Q4 2024 Business Review', 'Quarterly business review presentation for the executive team and board of directors', 'dark', '16:9', 'fade', '241a6d', '2024-12-16T08:00:00-05:00', '2024-12-19T16:00:00-05:00');

-- Link slides to presentation
INSERT INTO presentation_slides (profile_id, presentation_id, slide_id, position, vertical_position) VALUES ('mmc', 100, 100, 0, 0);
INSERT INTO presentation_slides (profile_id, presentation_id, slide_id, position, vertical_position) VALUES ('mmc', 100, 101, 1, 0);
INSERT INTO presentation_slides (profile_id, presentation_id, slide_id, position, vertical_position) VALUES ('mmc', 100, 102, 2, 0);
INSERT INTO presentation_slides (profile_id, presentation_id, slide_id, position, vertical_position) VALUES ('mmc', 100, 103, 3, 0);
INSERT INTO presentation_slides (profile_id, presentation_id, slide_id, position, vertical_position) VALUES ('mmc', 100, 104, 4, 0);
INSERT INTO presentation_slides (profile_id, presentation_id, slide_id, position, vertical_position) VALUES ('mmc', 100, 105, 5, 0);
INSERT INTO presentation_slides (profile_id, presentation_id, slide_id, position, vertical_position) VALUES ('mmc', 100, 106, 6, 0);


-- Engineering Team Update (Draft presentation)
INSERT INTO slides (id, profile_id, title, layout, content_json, notes, created_by, created_at, updated_at)
VALUES (200, 'mmc', 'Engineering Team Update', 'title', '{"title":"Engineering Team Update","subtitle":"December 2024 Sprint Review"}', NULL, 'd827cb', '2024-12-19T14:00:00-05:00', '2024-12-19T14:00:00-05:00');

INSERT INTO slides (id, profile_id, title, layout, content_json, notes, created_by, created_at, updated_at)
VALUES (201, 'mmc', 'Sprint Goals', 'content', '{"title":"Sprint Goals","body":"• Complete HVAC thermal analysis\n• Update CAD files for compressor housing\n• Control panel UI mockups\n• Code freeze preparation"}', 'Review goals from sprint planning.', 'd827cb', '2024-12-19T14:00:00-05:00', '2024-12-19T14:00:00-05:00');

INSERT INTO slides (id, profile_id, title, layout, content_json, notes, created_by, created_at, updated_at)
VALUES (202, 'mmc', 'Accomplishments', 'content', '{"title":"Sprint Accomplishments","body":"✅ Thermal analysis complete - 15% efficiency improvement\n✅ CAD files updated and reviewed\n✅ UI mockups shared with stakeholders\n✅ All critical tests passing for code freeze"}', 'Celebrate the wins with the team.', 'd827cb', '2024-12-19T14:00:00-05:00', '2024-12-19T14:00:00-05:00');

INSERT INTO slides (id, profile_id, title, layout, content_json, notes, created_by, created_at, updated_at)
VALUES (203, 'mmc', 'Next Sprint', 'content', '{"title":"Q1 2025 Focus","body":"• Control panel integration testing\n• IoT sensor calibration\n• Performance optimization\n• Documentation updates"}', 'Preview Q1 priorities.', 'd827cb', '2024-12-19T14:00:00-05:00', '2024-12-19T14:00:00-05:00');

-- Presentation container for Engineering Update
INSERT INTO presentations (id, profile_id, title, description, theme, aspect_ratio, transition, created_by, created_at, updated_at)
VALUES (200, 'mmc', 'Engineering Sprint Review - Dec 2024', 'December sprint review presentation for the engineering team', 'dark', '16:9', 'slide', 'd827cb', '2024-12-19T14:00:00-05:00', '2024-12-19T16:30:00-05:00');

-- Link slides to presentation
INSERT INTO presentation_slides (profile_id, presentation_id, slide_id, position, vertical_position) VALUES ('mmc', 200, 200, 0, 0);
INSERT INTO presentation_slides (profile_id, presentation_id, slide_id, position, vertical_position) VALUES ('mmc', 200, 201, 1, 0);
INSERT INTO presentation_slides (profile_id, presentation_id, slide_id, position, vertical_position) VALUES ('mmc', 200, 202, 2, 0);
INSERT INTO presentation_slides (profile_id, presentation_id, slide_id, position, vertical_position) VALUES ('mmc', 200, 203, 3, 0);


-- New Employee Onboarding (Template presentation)
INSERT INTO slides (id, profile_id, title, layout, content_json, notes, created_by, created_at, updated_at)
VALUES (300, 'mmc', 'Welcome to MMC', 'title', '{"title":"Welcome to Midwest Manufacturing Corp.","subtitle":"New Employee Orientation"}', 'Warm welcome to new hires.', '4f6f43', '2024-12-01T09:00:00-05:00', '2024-12-01T09:00:00-05:00');

INSERT INTO slides (id, profile_id, title, layout, content_json, notes, created_by, created_at, updated_at)
VALUES (301, 'mmc', 'Company Overview', 'content', '{"title":"About MMC","body":"• Founded 1985\n• Leading HVAC manufacturer\n• 500+ employees across 4 facilities\n• Midwest market leader"}', 'Brief company history.', '4f6f43', '2024-12-01T09:00:00-05:00', '2024-12-01T09:00:00-05:00');

INSERT INTO slides (id, profile_id, title, layout, content_json, notes, created_by, created_at, updated_at)
VALUES (302, 'mmc', 'Our Values', 'content', '{"title":"Our Core Values","body":"🎯 Excellence in Everything\n🤝 Customer Focus\n💡 Innovation\n👥 Teamwork"}', 'Emphasize culture.', '4f6f43', '2024-12-01T09:00:00-05:00', '2024-12-01T09:00:00-05:00');

INSERT INTO slides (id, profile_id, title, layout, content_json, notes, created_by, created_at, updated_at)
VALUES (303, 'mmc', 'Benefits Overview', 'content', '{"title":"Employee Benefits","body":"• Comprehensive health insurance\n• 401(k) with company match\n• Flexible PTO policy\n• Professional development programs"}', 'HR will provide detailed benefit packages.', '4f6f43', '2024-12-01T09:00:00-05:00', '2024-12-01T09:00:00-05:00');

-- Presentation container for Onboarding
INSERT INTO presentations (id, profile_id, title, description, theme, aspect_ratio, transition, created_by, created_at, updated_at)
VALUES (300, 'mmc', 'New Employee Onboarding', 'Standard onboarding presentation for new hires', 'light', '16:9', 'fade', '4f6f43', '2024-12-01T09:00:00-05:00', '2024-12-01T09:00:00-05:00');

-- Link slides to presentation
INSERT INTO presentation_slides (profile_id, presentation_id, slide_id, position, vertical_position) VALUES ('mmc', 300, 300, 0, 0);
INSERT INTO presentation_slides (profile_id, presentation_id, slide_id, position, vertical_position) VALUES ('mmc', 300, 301, 1, 0);
INSERT INTO presentation_slides (profile_id, presentation_id, slide_id, position, vertical_position) VALUES ('mmc', 300, 302, 2, 0);
INSERT INTO presentation_slides (profile_id, presentation_id, slide_id, position, vertical_position) VALUES ('mmc', 300, 303, 3, 0);
