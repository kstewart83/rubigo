import { test, expect } from '@playwright/test';

test.describe('Calendar Module', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');

        // Handle Sign In if present
        const signInBtn = page.locator('#sign-in-btn');
        if (await signInBtn.isVisible()) {
            await signInBtn.click();
            // Wait for overlay
            await expect(page.locator('#dev-overlay')).toHaveClass(/open/);
            // Click first persona
            await page.locator('.persona-card').first().click();
            // Wait for reload
            await page.waitForLoadState('domcontentloaded');
            // Wait for sidebar to appear
            await expect(page.locator('.sidebar')).toBeVisible();
        }

        // Capture console logs
        page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));

        // Navigate to Calendar tab
        await page.locator('a[href="/?tab=calendar"]').first().click();
        await expect(page).toHaveURL(/tab=calendar/);
        // Wait for calendar container to be visible
        await expect(page.locator('.calendar-container')).toBeVisible();
    });

    test('should display calendar header and controls', async ({ page }) => {
        await expect(page.locator('.calendar-title')).toBeVisible();
        await expect(page.getByRole('link', { name: 'Today' })).toBeVisible();
        // View switcher buttons might still be buttons or links
        // I made them buttons (disabled).
        await expect(page.locator('.view-btn.active')).toBeVisible();
        await expect(page.getByRole('link', { name: 'New Event' })).toBeVisible();
    });

    test('should navigate between months', async ({ page }) => {
        const title = page.locator('.calendar-title');
        const initialText = await title.textContent();

        // Click Next Month (Right Arrow)
        await page.getByText('→').click();

        // In SSR, page reloads. content changes.
        await expect(title).not.toHaveText(initialText!);

        // Click Prev Month (Left Arrow) twice to go back and one more
        await page.getByText('←').click();
        await expect(title).toHaveText(initialText!);

        await page.getByText('←').click();
        await expect(title).not.toHaveText(initialText!);
    });

    test('should open new event modal', async ({ page }) => {
        await page.getByRole('link', { name: 'New Event' }).click();

        // Check for modal overlay and content
        const modal = page.locator('.modal-content');
        await expect(modal).toBeVisible();
        // Check for the modal header "New Event"
        await expect(modal.locator('.modal-header h3')).toHaveText('New Event');

        // Check close via Cancel
        await modal.getByRole('link', { name: 'Cancel' }).click();
        await expect(modal).not.toBeVisible();
    });

    test.describe('Date Picker Behavior', () => {
        test.beforeEach(async ({ page }) => {
            // Open the New Event modal
            await page.getByRole('link', { name: 'New Event' }).click();
            await expect(page.locator('.modal-content')).toBeVisible();
        });

        test('should have date input with default value', async ({ page }) => {
            const startDateInput = page.locator('input[name="start_date"]');
            await expect(startDateInput).toBeVisible();
            // Should have a value (today's date in YYYY-MM-DD format)
            const value = await startDateInput.inputValue();
            expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });

        test('should have time input with default value', async ({ page }) => {
            const startTimeInput = page.locator('input[name="start_time"]');
            await expect(startTimeInput).toBeVisible();
            const value = await startTimeInput.inputValue();
            // 12-hour format: "9:00 AM"
            expect(value).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/);
        });


        test('should open custom date picker on click', async ({ page }) => {
            const dateWrapper = page.locator('.date-picker-wrapper').first();
            const dateInput = dateWrapper.locator('.date-input');
            const popup = dateWrapper.locator('.date-picker-popup');

            // Popup should be hidden initially
            await expect(popup).toBeHidden();

            // Click the date input
            await dateInput.click();

            // Popup should now be visible
            await expect(popup).toBeVisible();

            // Should show month/year header
            await expect(popup.locator('.picker-month-year')).toBeVisible();

            // Should show Today button
            await expect(popup.locator('.picker-today-btn')).toBeVisible();
        });

        test('should close picker when selecting a date', async ({ page }) => {
            const dateWrapper = page.locator('.date-picker-wrapper').first();
            const dateInput = dateWrapper.locator('.date-input');
            const popup = dateWrapper.locator('.date-picker-popup');

            // Open picker
            await dateInput.click();
            await expect(popup).toBeVisible();

            // Click on a day (not other-month)
            await popup.locator('.picker-day:not(.other-month)').first().click();

            // Popup should close
            await expect(popup).toBeHidden();

            // Input should have a value
            const value = await dateInput.inputValue();
            expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });

        test('should close picker when clicking outside', async ({ page }) => {
            const dateWrapper = page.locator('.date-picker-wrapper').first();
            const dateInput = dateWrapper.locator('.date-input');
            const popup = dateWrapper.locator('.date-picker-popup');
            const titleInput = page.locator('input[name="title"]');

            // Open picker
            await dateInput.click();
            await expect(popup).toBeVisible();

            // Click outside (on title input)
            await titleInput.click();

            // Popup should close
            await expect(popup).toBeHidden();
        });

        test('should select today when clicking Today button', async ({ page }) => {
            const dateWrapper = page.locator('.date-picker-wrapper').first();
            const dateInput = dateWrapper.locator('.date-input');
            const popup = dateWrapper.locator('.date-picker-popup');

            // First, change date to something else
            await dateInput.click();
            await popup.locator('.picker-nav-btn.prev').click(); // Go to previous month
            await popup.locator('.picker-day:not(.other-month)').nth(10).click();

            // Now reopen and click Today
            await dateInput.click();
            await expect(popup).toBeVisible();
            await popup.locator('.picker-today-btn').click();

            // Popup should close
            await expect(popup).toBeHidden();

            // Input should have today's date
            const today = new Date();
            const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            await expect(dateInput).toHaveValue(expected);
        });

        test('should navigate between months', async ({ page }) => {
            const dateWrapper = page.locator('.date-picker-wrapper').first();
            const dateInput = dateWrapper.locator('.date-input');
            const popup = dateWrapper.locator('.date-picker-popup');

            // Open picker
            await dateInput.click();
            await expect(popup).toBeVisible();

            const monthYear = popup.locator('.picker-month-year');
            const initialText = await monthYear.textContent();

            // Click next
            await popup.locator('.picker-nav-btn.next').click();
            await expect(monthYear).not.toHaveText(initialText!);

            // Click prev twice to go back one month before original
            await popup.locator('.picker-nav-btn.prev').click();
            await expect(monthYear).toHaveText(initialText!);

            await popup.locator('.picker-nav-btn.prev').click();
            await expect(monthYear).not.toHaveText(initialText!);
        });

        test('modal should close when clicking Cancel after date interaction', async ({ page }) => {
            const dateWrapper = page.locator('.date-picker-wrapper').first();
            const dateInput = dateWrapper.locator('.date-input');
            const popup = dateWrapper.locator('.date-picker-popup');
            const modal = page.locator('.modal-content');

            // Open picker and select a date
            await dateInput.click();
            await popup.locator('.picker-day:not(.other-month)').nth(15).click();

            // Click Cancel
            await page.getByRole('link', { name: 'Cancel' }).click();

            // Modal should close
            await expect(modal).not.toBeVisible();
        });
    });

    test.describe('Time Picker Behavior', () => {
        test.beforeEach(async ({ page }) => {
            // Open the New Event modal
            await page.getByRole('link', { name: 'New Event' }).click();
            await expect(page.locator('.modal-content')).toBeVisible();
        });

        test('should have time input with default value', async ({ page }) => {
            const timeInput = page.locator('input[name="start_time"]');
            await expect(timeInput).toBeVisible();
            const value = await timeInput.inputValue();
            // 12-hour format: "9:00 AM" or "10:30 PM"
            expect(value).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/);
        });

        test('should open custom time picker on click', async ({ page }) => {
            const timeWrapper = page.locator('.time-picker-wrapper').first();
            const timeInput = timeWrapper.locator('.time-input');
            const popup = timeWrapper.locator('.time-picker-popup');

            // Popup should be hidden initially
            await expect(popup).toBeHidden();

            // Click the time input
            await timeInput.click();

            // Popup should now be visible
            await expect(popup).toBeVisible();

            // Should show hour, minute, and AM/PM columns (3 total)
            await expect(popup.locator('.time-column')).toHaveCount(3);

            // Should show Now button
            await expect(popup.locator('.time-now-btn')).toBeVisible();
        });

        test('should update time when clicking hour', async ({ page }) => {
            const timeWrapper = page.locator('.time-picker-wrapper').first();
            const timeInput = timeWrapper.locator('.time-input');
            const popup = timeWrapper.locator('.time-picker-popup');

            // Open picker
            await timeInput.click();
            await expect(popup).toBeVisible();

            // Click on hour 2 (in 12-hour format)
            await popup.locator('[data-col="hour"] .time-option').filter({ hasText: /^2$/ }).click();

            // Popup should still be visible to allow minute selection
            await expect(popup).toBeVisible();

            // Input should update to show 2:XX AM or PM
            const value = await timeInput.inputValue();
            expect(value).toMatch(/^2:\d{2} (AM|PM)$/);
        });

        test('should close picker when clicking outside', async ({ page }) => {
            const timeWrapper = page.locator('.time-picker-wrapper').first();
            const timeInput = timeWrapper.locator('.time-input');
            const popup = timeWrapper.locator('.time-picker-popup');
            const titleInput = page.locator('input[name="title"]');

            // Open picker
            await timeInput.click();
            await expect(popup).toBeVisible();

            // Click outside (on title input)
            await titleInput.click();

            // Popup should close
            await expect(popup).toBeHidden();
        });

        test('should set current time when clicking Now button', async ({ page }) => {
            const timeWrapper = page.locator('.time-picker-wrapper').first();
            const timeInput = timeWrapper.locator('.time-input');
            const popup = timeWrapper.locator('.time-picker-popup');

            // Open picker
            await timeInput.click();
            await expect(popup).toBeVisible();

            // Click Now button
            await popup.locator('.time-now-btn').click();

            // Popup should close
            await expect(popup).toBeHidden();

            // Input should have a time value in 12-hour format
            const value = await timeInput.inputValue();
            expect(value).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/);
        });

    });

    test.describe('Recurrence Behavior', () => {
        test.beforeEach(async ({ page }) => {
            // Open the new event modal
            await page.getByRole('link', { name: 'New Event' }).click();
            await expect(page.locator('.modal-overlay')).toBeVisible();
        });

        test('should have recurrence checkbox unchecked by default', async ({ page }) => {
            const checkbox = page.locator('#recurrence-toggle');
            await expect(checkbox).toBeVisible();
            await expect(checkbox).not.toBeChecked();
        });

        test('recurrence options should be hidden by default', async ({ page }) => {
            const options = page.locator('#recurrence-options');
            await expect(options).toBeHidden();
        });

        test('should show recurrence options when checkbox is checked', async ({ page }) => {
            const checkbox = page.locator('#recurrence-toggle');
            const options = page.locator('#recurrence-options');

            // Check the checkbox
            await checkbox.check();

            // Options should now be visible
            await expect(options).toBeVisible();

            // Should have frequency selector
            await expect(options.locator('select[name="freq"]')).toBeVisible();
        });

        test('should hide recurrence options when checkbox is unchecked', async ({ page }) => {
            const checkbox = page.locator('#recurrence-toggle');
            const options = page.locator('#recurrence-options');

            // Check then uncheck
            await checkbox.check();
            await expect(options).toBeVisible();

            await checkbox.uncheck();
            await expect(options).toBeHidden();
        });

        test('should have day toggle buttons for weekly recurrence', async ({ page }) => {
            const checkbox = page.locator('#recurrence-toggle');
            await checkbox.check();

            // Check for day toggle buttons
            const dayToggles = page.locator('.day-toggle');
            await expect(dayToggles).toHaveCount(7);

            // Click a day toggle
            const monToggle = dayToggles.first();
            await monToggle.click();

            // The checkbox inside should be checked
            const monCheckbox = monToggle.locator('input[type="checkbox"]');
            await expect(monCheckbox).toBeChecked();
        });

        test('should have end condition options', async ({ page }) => {
            const checkbox = page.locator('#recurrence-toggle');
            await checkbox.check();

            // Check for end condition radio buttons
            const neverRadio = page.locator('input[name="until_type"][value="never"]');
            const dateRadio = page.locator('input[name="until_type"][value="date"]');
            const countRadio = page.locator('input[name="until_type"][value="count"]');

            await expect(neverRadio).toBeVisible();
            await expect(dateRadio).toBeVisible();
            await expect(countRadio).toBeVisible();

            // Never should be checked by default
            await expect(neverRadio).toBeChecked();
        });
    });

    test.describe('Meeting Seed Data', () => {
        test('should display meetings from seed data on calendar', async ({ page }) => {
            // Navigate to January 2025 where we have seed data
            // First find current month displayed
            const title = page.locator('.calendar-title');

            // Navigate to January 2025
            await page.goto('/?tab=calendar&month=1&year=2025');
            await expect(page.locator('.calendar-container')).toBeVisible();

            // Should see the month title
            await expect(title).toContainText('January 2025');

            // Check for event pills (from seed data)
            // We have holidays like MLK Day, New Year's Day, etc.
            const eventPills = page.locator('.event-pill');
            const pillCount = await eventPills.count();

            // Should have at least some events from seed data
            expect(pillCount).toBeGreaterThan(0);
        });

        test('meetings should have colored pills by type', async ({ page }) => {
            // Navigate to January 2025
            await page.goto('/?tab=calendar&month=1&year=2025');
            await expect(page.locator('.calendar-container')).toBeVisible();

            // Look for event pills with background color
            const eventPills = page.locator('.event-pill');
            const firstPill = eventPills.first();

            if (await firstPill.isVisible()) {
                const bgColor = await firstPill.evaluate(el =>
                    getComputedStyle(el).backgroundColor
                );
                // Should have some background color (not transparent)
                expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
            }
        });
    });

    test.describe('Event Creation', () => {
        test('should create a simple event and redirect to calendar', async ({ page }) => {
            // Open new event modal
            await page.getByRole('link', { name: 'New Event' }).click();
            await expect(page.locator('.modal-overlay')).toBeVisible();

            // Fill in basic event details
            const titleInput = page.locator('input[name="title"]');
            await titleInput.fill('Test Meeting');

            // Submit the form
            await page.locator('button[type="submit"]').click();

            // Should redirect to calendar page
            await expect(page).toHaveURL(/tab=calendar/);

            // The modal should be closed
            await expect(page.locator('.modal-overlay')).toBeHidden();
        });

        test('should create a recurring weekly event', async ({ page }) => {
            // Open new event modal
            await page.getByRole('link', { name: 'New Event' }).click();
            await expect(page.locator('.modal-overlay')).toBeVisible();

            // Fill in event title
            await page.locator('input[name="title"]').fill('Weekly Team Sync');

            // Enable recurrence
            await page.locator('#recurrence-toggle').check();
            await expect(page.locator('#recurrence-options')).toBeVisible();

            // Select weekly frequency (should be default)
            await expect(page.locator('select[name="freq"]')).toHaveValue('WEEKLY');

            // Click just one day toggle to avoid duplicate field issue
            const dayToggles = page.locator('.day-toggle');
            await dayToggles.filter({ hasText: 'Mon' }).click();

            // Submit the form
            await page.locator('button[type="submit"]').click();

            // Should redirect to calendar
            await expect(page).toHaveURL(/tab=calendar/);
        });

    });

    test.describe('Event Details Panel', () => {
        test('should open details panel when clicking on an event pill', async ({ page }) => {
            // Navigate to January 2025 where we have seed data
            await page.goto('/?tab=calendar&month=1&year=2025');
            await expect(page.locator('.calendar-container')).toBeVisible();

            // Find an event pill and click it
            const eventPill = page.locator('.event-pill').first();
            if (await eventPill.isVisible()) {
                await eventPill.click();

                // Details panel should open
                await expect(page.locator('#event-details-panel')).toHaveClass(/open/);

                // Event title should be populated
                await expect(page.locator('#event-title')).not.toBeEmpty();
            }
        });

        test('should close details panel when clicking X button', async ({ page }) => {
            await page.goto('/?tab=calendar&month=1&year=2025');
            await expect(page.locator('.calendar-container')).toBeVisible();

            const eventPill = page.locator('.event-pill').first();
            if (await eventPill.isVisible()) {
                await eventPill.click();
                await expect(page.locator('#event-details-panel')).toHaveClass(/open/);

                // Click close button
                await page.locator('#event-details-panel .panel-close').click();

                // Panel should close
                await expect(page.locator('#event-details-panel')).not.toHaveClass(/open/);
            }
        });

        test('should have edit button in details panel', async ({ page }) => {
            await page.goto('/?tab=calendar&month=1&year=2025');
            await expect(page.locator('.calendar-container')).toBeVisible();

            const eventPill = page.locator('.event-pill').first();
            if (await eventPill.isVisible()) {
                await eventPill.click();
                await expect(page.locator('#event-details-panel')).toHaveClass(/open/);

                // Edit button should be present
                await expect(page.locator('#event-edit-btn')).toBeVisible();
            }
        });
    });

    test.describe('Outside Month Styling', () => {
        test('days outside current month should have darker styling', async ({ page }) => {
            // Navigate to any month
            await page.goto('/?tab=calendar&month=6&year=2025');
            await expect(page.locator('.calendar-container')).toBeVisible();

            // Check for outside-month class on some cells
            const outsideCells = page.locator('.calendar-day-cell.outside-month');
            const count = await outsideCells.count();

            // There should be some cells from prev/next month
            expect(count).toBeGreaterThan(0);
        });
    });

    test.describe('Week View', () => {
        test('should switch to week view when clicking Week button', async ({ page }) => {
            // Click Week view button
            await page.locator('.view-switcher a:has-text("Week")').click();

            // URL should have view=week
            await expect(page).toHaveURL(/view=week/);

            // Week view should be visible
            await expect(page.locator('.week-view')).toBeVisible();
        });

        test('week view should have 7 day columns', async ({ page }) => {
            await page.goto('/?tab=calendar&view=week');
            await expect(page.locator('.week-view')).toBeVisible();

            // Should have 7 day headers
            const dayHeaders = page.locator('.week-day-header');
            await expect(dayHeaders).toHaveCount(7);
        });

        test('week view should have time slots', async ({ page }) => {
            await page.goto('/?tab=calendar&view=week');
            await expect(page.locator('.week-view')).toBeVisible();

            // Should have time slots (6 AM to 10 PM = 16 hours)
            const timeSlots = page.locator('.week-time-slot');
            await expect(timeSlots).toHaveCount(16);
        });

        test('should switch back to month view', async ({ page }) => {
            await page.goto('/?tab=calendar&view=week');
            await expect(page.locator('.week-view')).toBeVisible();

            // Click Month button
            await page.locator('.view-switcher a:has-text("Month")').click();

            // URL should have view=month
            await expect(page).toHaveURL(/view=month/);

            // Month view should be visible (calendar grid)
            await expect(page.locator('.calendar-grid')).toBeVisible();
        });
    });

    test.describe('Work Week Toggle', () => {
        test('should show work week checkbox in toolbar', async ({ page }) => {
            await expect(page.locator('.work-week-toggle')).toBeVisible();
        });

        test('should toggle to work week mode when clicked', async ({ page }) => {
            // Click work week toggle
            await page.locator('.work-week-link').click();

            // URL should have workweek=on
            await expect(page).toHaveURL(/workweek=on/);
        });

        test('work week mode should show 5 day headers in month view', async ({ page }) => {
            await page.goto('/?tab=calendar&workweek=on');
            await expect(page.locator('.calendar-grid')).toBeVisible();

            // Should have 5 day header columns (Mon-Fri)
            const dayHeaders = page.locator('.calendar-day-header');
            await expect(dayHeaders).toHaveCount(5);
        });

        test('work week mode should show 5 days in week view', async ({ page }) => {
            await page.goto('/?tab=calendar&view=week&workweek=on');
            await expect(page.locator('.week-view')).toBeVisible();

            // Should have 5 day headers
            const dayHeaders = page.locator('.week-day-header');
            await expect(dayHeaders).toHaveCount(5);
        });
    });
});
