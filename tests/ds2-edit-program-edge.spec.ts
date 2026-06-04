import { test, expect } from '../fixtures/cleanup.fixture';
import { SLOW_LIST_TIMEOUT, uniqueName } from './didaxis-helpers';
import { ProgramDialogPage, ProgramsPage } from './pages/didaxis';

/**
 * DS-2 — Edit existing program — edge cases.
 * Source test plan: block2/DS-2/DS-2_test_plan.md (TC-201…TC-214)
 * Auth: reused admin session (tests/auth.setup.ts → playwright.config storageState).
 */

test.describe('DS-2: Edit existing program — edge cases', () => {
  test.describe.configure({ timeout: 120_000 });

  let programs: ProgramsPage;
  let programName: string;
  const originalDescription = 'Original description';

  test.beforeEach(async ({ page }) => {
    programs = new ProgramsPage(page);
    programName = uniqueName();
    await programs.goto();
    await programs.createProgram(programName, originalDescription);
  });

  test('TC-201: Leading/trailing whitespace in Name is trimmed on save', async () => {
    const trimmedName = `${programName} - Trimmed`;
    const paddedName = `  ${trimmedName}  `;

    let dialog = await programs.openEditDialog(programName);
    await dialog.fillProgramName(paddedName);
    await dialog.saveAndClose(programs, trimmedName);

    dialog = await programs.openEditDialog(trimmedName);
    await expect(dialog.programNameInput).toHaveValue(trimmedName);
  });

  test('TC-202: Name at exactly the max length (100 chars) saves successfully', async () => {
    const exactMaxName = 'A'.repeat(100);

    const dialog = await programs.openEditDialog(programName);
    await dialog.fillProgramName(exactMaxName);
    await dialog.saveAndClose(programs, exactMaxName);

    await expect(programs.rowByName(exactMaxName)).toBeVisible();
  });

  test('TC-203: Name with special characters and punctuation is accepted', async () => {
    const specialName = `${programName} — C++/C#, JS & TS (Advanced) #1`;

    const dialog = await programs.openEditDialog(programName);
    await dialog.fillProgramName(specialName);
    await dialog.saveAndClose(programs, specialName);

    await expect(programs.rowByName(specialName)).toBeVisible();
  });

  test('TC-204: Name with Unicode and emoji is accepted', async () => {
    const unicodeName = `${programName} Веб-разработка 🚀 — 程式設計`;

    const dialog = await programs.openEditDialog(programName);
    await dialog.fillProgramName(unicodeName);
    await dialog.saveAndClose(programs, unicodeName);

    await expect(programs.rowByName(unicodeName)).toBeVisible();
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

    const dialog = await programs.openEditDialog(programName);
    await dialog.fillProgramName(xssName);
    await dialog.fillDescription(xssDescription);
    await dialog.saveAndClose(programs, xssName);

    await page.waitForTimeout(500);
    expect(alertFired).toBe(false);

    const reopened = await programs.openEditDialog(xssName);
    await expect(reopened.programNameInput).toHaveValue(xssName);
    await expect(reopened.descriptionInput).toHaveValue(xssDescription);
  });

  test('TC-206: SQL-injection-like input is stored verbatim as a string', async () => {
    const sqlName = `${programName} Robert'); DROP TABLE Programs;--`;

    const dialog = await programs.openEditDialog(programName);
    await dialog.fillProgramName(sqlName);
    await dialog.saveAndClose(programs, sqlName);

    await expect(programs.table).toBeVisible();
    await expect(programs.rowByName(sqlName)).toBeVisible();
  });

  test('TC-207: Description at documented maximum length (500 chars) round-trips', async () => {
    const maxDescription = 'D'.repeat(500);

    let dialog = await programs.openEditDialog(programName);
    await dialog.fillDescription(maxDescription);
    await dialog.saveAndClose(programs, programName);

    dialog = await programs.openEditDialog(programName);
    await expect(dialog.descriptionInput).toHaveValue(maxDescription);
  });

  test('TC-208: Saving with no changes closes the modal and keeps the row unchanged', async () => {
    const dialog = await programs.openEditDialog(programName);
    await dialog.clickPrimary();

    await expect(dialog.dialog).toBeHidden({ timeout: SLOW_LIST_TIMEOUT });

    const row = programs.rowByName(programName);
    await expect(row).toBeVisible();
    await expect(row).toContainText(originalDescription);
  });

  test('TC-209: Renaming back to the original name after another change succeeds', async () => {
    const tempName = `${programName} - Temp`;

    let dialog = await programs.openEditDialog(programName);
    await dialog.fillProgramName(tempName);
    await dialog.saveAndClose(programs, tempName);

    dialog = await programs.openEditDialog(tempName);
    await dialog.fillProgramName(programName);
    await dialog.saveAndClose(programs, programName);

    await expect(programs.rowByName(programName)).toBeVisible();
    await expect(programs.rowByName(tempName)).toHaveCount(0);
  });

  test('TC-210: Rapid double-click on Save issues only one PATCH request', async ({ page }) => {
    test.fail();

    const updatedName = `${programName} - DoubleClick`;

    let patchCount = 0;
    page.on('request', (request) => {
      if (request.method() === 'PATCH' && /\/api\/programs\//.test(request.url())) {
        patchCount += 1;
      }
    });

    const dialog = await programs.openEditDialog(programName);
    await dialog.fillProgramName(updatedName);
    await dialog.primaryButton.click({ clickCount: 2, delay: 30 });

    await programs.expectRowVisible(updatedName);
    await expect(dialog.dialog).toBeHidden({ timeout: SLOW_LIST_TIMEOUT });

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

    const dialog = await programs.openEditDialog(programName);
    await dialog.fillProgramName(updatedName);
    await dialog.saveAndClose(programs, updatedName);

    await page.goBack();

    await expect(new ProgramDialogPage(page, 'edit').dialog).toHaveCount(0);
  });

  test('TC-214: Edit modal is keyboard-accessible', async ({ page }) => {
    const editBtn = programs.editButton(programName);

    await editBtn.focus();
    await page.keyboard.press('Enter');

    const dialog = new ProgramDialogPage(page, 'edit');
    await expect(dialog.dialog).toBeVisible();

    await dialog.programNameInput.focus();
    await expect(dialog.programNameInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(dialog.descriptionInput).toBeFocused();

    const keyboardEditedName = `${programName} - KB`;
    await dialog.fillProgramName(keyboardEditedName);
    await dialog.primaryButton.focus();
    await page.keyboard.press('Enter');

    await programs.expectRowVisible(keyboardEditedName);
    await expect(dialog.dialog).toBeHidden({ timeout: SLOW_LIST_TIMEOUT });

    const escDialog = await programs.openEditDialog(keyboardEditedName);
    await page.keyboard.press('Escape');
    await expect(escDialog.dialog).toBeHidden();
  });
});
