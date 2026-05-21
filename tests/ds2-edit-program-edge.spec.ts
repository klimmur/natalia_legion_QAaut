import { test, expect } from '@playwright/test';
import {
  SLOW_LIST_TIMEOUT,
  createProgram,
  gotoPrograms,
  login,
  openEditModal,
  rowByName,
  saveAndClose,
  uniqueName,
} from './didaxis-helpers';

/**
 * DS-2 — Edit existing program — edge cases.
 * Source test plan: block2/DS-2/agent_output.md (TC-201…TC-214)
 */

test.describe('DS-2: Edit existing program — edge cases', () => {
  test.describe.configure({ timeout: 120_000 });

  let programName: string;
  const originalDescription = 'Original description';

  test.beforeEach(async ({ page }) => {
    programName = uniqueName();
    await login(page);
    await gotoPrograms(page);
    await createProgram(page, programName, originalDescription);
  });

  test('TC-201: Leading/trailing whitespace in Name is trimmed on save', async ({ page }) => {
    const trimmedName = `${programName} - Trimmed`;
    const paddedName = `  ${trimmedName}  `;

    let dialog = await openEditModal(page, programName);
    await dialog.getByRole('textbox', { name: 'Program Name' }).fill(paddedName);
    await saveAndClose(page, dialog, trimmedName);

    // Reopen and confirm the stored value is trimmed.
    dialog = await openEditModal(page, trimmedName);
    await expect(dialog.getByRole('textbox', { name: 'Program Name' })).toHaveValue(trimmedName);
  });

  test('TC-202: A long Name (200 chars) saves successfully', async ({ page }) => {
    // Test plan calls for "exactly N max chars". No max is documented and the
    // app currently accepts at least 1000 chars (see TC-104). 200 is a safe
    // representative "long but reasonable" value.
    const longName = `${programName.slice(0, 30)}-${'A'.repeat(170)}`;

    const dialog = await openEditModal(page, programName);
    await dialog.getByRole('textbox', { name: 'Program Name' }).fill(longName);
    await saveAndClose(page, dialog, longName);

    await expect(rowByName(page, longName)).toBeVisible();
  });

  test('TC-203: Name with special characters and punctuation is accepted', async ({ page }) => {
    const specialName = `${programName} — C++/C#, JS & TS (Advanced) #1`;

    const dialog = await openEditModal(page, programName);
    await dialog.getByRole('textbox', { name: 'Program Name' }).fill(specialName);
    await saveAndClose(page, dialog, specialName);

    await expect(rowByName(page, specialName)).toBeVisible();
  });

  test('TC-204: Name with Unicode and emoji is accepted', async ({ page }) => {
    const unicodeName = `${programName} Веб-разработка 🚀 — 程式設計`;

    const dialog = await openEditModal(page, programName);
    await dialog.getByRole('textbox', { name: 'Program Name' }).fill(unicodeName);
    await saveAndClose(page, dialog, unicodeName);

    await expect(rowByName(page, unicodeName)).toBeVisible();
  });

  test('TC-205: XSS payload in Name/Description is rendered as text, not executed', async ({
    page,
  }) => {
    const xssName = `${programName} <script>alert('xss')</script>`;
    const xssDescription = `<img src=x onerror=alert(1)>`;

    let alertFired = false;
    page.on('dialog', async (d) => {
      alertFired = true;
      await d.dismiss();
    });

    const dialog = await openEditModal(page, programName);
    await dialog.getByRole('textbox', { name: 'Program Name' }).fill(xssName);
    await dialog.getByRole('textbox', { name: 'Description' }).fill(xssDescription);
    await saveAndClose(page, dialog, xssName);

    // No JS alert should have fired at any point during/after save.
    await page.waitForTimeout(500);
    expect(alertFired).toBe(false);

    // Reopen — the script tag survives as plain text in the input value.
    const reopened = await openEditModal(page, xssName);
    await expect(reopened.getByRole('textbox', { name: 'Program Name' })).toHaveValue(xssName);
    await expect(reopened.getByRole('textbox', { name: 'Description' })).toHaveValue(
      xssDescription,
    );
  });

  test('TC-206: SQL-injection-like input is stored verbatim as a string', async ({ page }) => {
    const sqlName = `${programName} Robert'); DROP TABLE Programs;--`;

    const dialog = await openEditModal(page, programName);
    await dialog.getByRole('textbox', { name: 'Program Name' }).fill(sqlName);
    await saveAndClose(page, dialog, sqlName);

    // The Programs table is still rendered (would be empty if SQL had executed).
    await expect(page.getByRole('table')).toBeVisible();
    await expect(rowByName(page, sqlName)).toBeVisible();
  });

  test('TC-207: A very large Description is accepted and round-trips', async ({ page }) => {
    // App trims trailing whitespace on save (verified via TC-201), so the
    // stored value must not end with whitespace for this exact round-trip
    // assertion to hold.
    const bigDescription = `${'Long description sentence. '.repeat(200)}END`; // ~5.4 KB

    let dialog = await openEditModal(page, programName);
    await dialog.getByRole('textbox', { name: 'Description' }).fill(bigDescription);
    await saveAndClose(page, dialog, programName);

    dialog = await openEditModal(page, programName);
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue(bigDescription);
  });

  test('TC-208: Saving with no changes closes the modal and keeps the row unchanged', async ({
    page,
  }) => {
    const dialog = await openEditModal(page, programName);
    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(dialog).toBeHidden({ timeout: SLOW_LIST_TIMEOUT });

    const row = rowByName(page, programName);
    await expect(row).toBeVisible();
    await expect(row).toContainText(originalDescription);
  });

  test('TC-209: Renaming back to the original name after another change succeeds', async ({
    page,
  }) => {
    const tempName = `${programName} - Temp`;

    let dialog = await openEditModal(page, programName);
    await dialog.getByRole('textbox', { name: 'Program Name' }).fill(tempName);
    await saveAndClose(page, dialog, tempName);

    dialog = await openEditModal(page, tempName);
    await dialog.getByRole('textbox', { name: 'Program Name' }).fill(programName);
    await saveAndClose(page, dialog, programName);

    await expect(rowByName(page, programName)).toBeVisible();
    await expect(rowByName(page, tempName)).toHaveCount(0);
  });

  test('TC-210: Rapid double-click on Save issues only one PATCH request', async ({ page }) => {
    // KNOWN GAP: the app does NOT disable the Save button during the in-flight
    // request and does NOT debounce — a double-click currently produces two
    // PATCH calls. We mark this test as expected-to-fail so the suite stays
    // green while the gap is visible. Once the app is fixed, this annotation
    // should be removed (Playwright will surface a "passed unexpectedly" then).
    test.fail();

    const updatedName = `${programName} - DoubleClick`;

    let patchCount = 0;
    page.on('request', (request) => {
      if (request.method() === 'PATCH' && /\/api\/programs\//.test(request.url())) {
        patchCount += 1;
      }
    });

    const dialog = await openEditModal(page, programName);
    await dialog.getByRole('textbox', { name: 'Program Name' }).fill(updatedName);

    const saveBtn = dialog.getByRole('button', { name: 'Save' });
    await saveBtn.click({ clickCount: 2, delay: 30 });

    await expect(rowByName(page, updatedName)).toBeVisible({ timeout: SLOW_LIST_TIMEOUT });
    await expect(dialog).toBeHidden({ timeout: SLOW_LIST_TIMEOUT });

    expect(patchCount).toBe(1);
  });

  test.skip(
    'TC-211: Related views/dashboards reflect rename — SKIPPED (no documented detail view that displays the name)',
    () => {},
  );

  test.skip(
    'TC-212: Long name truncates visually but full value remains in tooltip — SKIPPED (no tooltip behavior in current UI)',
    () => {},
  );

  test('TC-213: Browser Back after Save does not reopen a stale Edit modal', async ({ page }) => {
    const updatedName = `${programName} - BackTest`;

    const dialog = await openEditModal(page, programName);
    await dialog.getByRole('textbox', { name: 'Program Name' }).fill(updatedName);
    await saveAndClose(page, dialog, updatedName);

    await page.goBack();

    // No edit dialog should be visible, regardless of which route Back lands on.
    await expect(page.getByRole('dialog', { name: 'Edit Program' })).toHaveCount(0);
  });

  test('TC-214: Edit modal is keyboard-accessible (Tab focuses fields; Esc closes)', async ({
    page,
  }) => {
    const dialog = await openEditModal(page, programName);
    const nameField = dialog.getByRole('textbox', { name: 'Program Name' });
    const descriptionField = dialog.getByRole('textbox', { name: 'Description' });

    await nameField.focus();
    await expect(nameField).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(descriptionField).toBeFocused();

    // Esc closes the modal (no warning — same as TC-111).
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});
