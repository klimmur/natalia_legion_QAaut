import { test, expect } from '../fixtures/cleanup.fixture';
import { SLOW_LIST_TIMEOUT, uniqueName } from './didaxis-helpers';
import { ProgramsPage } from './pages/didaxis';

/**
 * DS-2 — Edit existing program — negative flows.
 * Source test plan: block2/DS-2/DS-2_test_plan.md (TC-101…TC-111)
 * Auth: reused admin session (tests/auth.setup.ts → playwright.config storageState).
 */

test.describe('DS-2: Edit existing program — negative flows', () => {
  test.describe.configure({ timeout: 90_000 });

  let programs: ProgramsPage;
  let programName: string;
  const originalDescription = 'Original description';

  test.beforeEach(async ({ page }) => {
    programs = new ProgramsPage(page);
    programName = uniqueName();
    await programs.goto();
    await programs.createProgram(programName, originalDescription);
  });

  test('TC-101: Empty Name is rejected (Save disabled)', async () => {
    const dialog = await programs.openEditDialog(programName);

    await dialog.fillProgramName('');

    await expect(dialog.primaryButton).toBeDisabled();
    await expect(dialog.dialog).toBeVisible();

    await dialog.cancel();
    await expect(programs.rowByName(programName)).toBeVisible();
  });

  test('TC-102: Whitespace-only Name is rejected (Save disabled)', async () => {
    const dialog = await programs.openEditDialog(programName);

    await dialog.fillProgramName('   ');

    await expect(dialog.primaryButton).toBeDisabled();
    await expect(dialog.dialog).toBeVisible();

    await dialog.cancel();
    await expect(programs.rowByName(programName)).toBeVisible();
  });

  test('TC-103: Duplicate program name — current app accepts duplicates (documented gap)', async () => {
    const otherName = uniqueName('Data Science 2026');
    await programs.createProgram(otherName, 'Other program');

    const dialog = await programs.openEditDialog(programName);
    await dialog.fillProgramName(otherName);
    await dialog.clickPrimary();

    await expect(dialog.dialog).toBeHidden({ timeout: SLOW_LIST_TIMEOUT });
    await expect(programs.rowByName(otherName)).toHaveCount(2, {
      timeout: SLOW_LIST_TIMEOUT,
    });
  });

  test('TC-104: Name exceeding maximum length (101 chars) — documented gap if accepted', async () => {
    test.skip(true, 'Quarantined for CI — fails under crowded Programs list; see DS-107');
    const overMaxName = 'x'.repeat(101);

    const dialog = await programs.openEditDialog(programName);
    await dialog.fillProgramName(overMaxName);
    await dialog.clickPrimary();

    await expect(dialog.dialog).toBeHidden({ timeout: SLOW_LIST_TIMEOUT });
    await programs.expectRowVisible(overMaxName);
  });

  test.skip(
    'TC-105: Invalid date range — SKIPPED (Edit modal has no Start/End Date fields)',
    () => {},
  );

  test('TC-106: Server 500 on save — modal stays open with user input preserved', async ({
    page,
  }) => {
    const updatedName = `${programName} - 500Test`;

    await page.route('**/api/programs/*', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({ status: 500, body: 'Internal Server Error' });
        return;
      }
      await route.fallback();
    });

    const dialog = await programs.openEditDialog(programName);
    await dialog.fillProgramName(updatedName);
    await dialog.clickPrimary();

    await page.waitForTimeout(2000);

    await expect(dialog.dialog).toBeVisible();
    await expect(dialog.programNameInput).toHaveValue(updatedName);
    await expect(programs.rowByName(updatedName)).toHaveCount(0);

    await page.unroute('**/api/programs/*');
    await dialog.cancel();
  });

  test('TC-107: Network offline on save — modal does not close and no stale row appears', async ({
    page,
    context,
  }) => {
    const updatedDescription = `Offline test ${Date.now()}`;

    const dialog = await programs.openEditDialog(programName);
    await dialog.fillDescription(updatedDescription);

    await context.setOffline(true);
    await dialog.clickPrimary();

    await page.waitForTimeout(2000);

    await expect(dialog.dialog).toBeVisible();
    const row = programs.rowByName(programName);
    await expect(row).toBeVisible();
    await expect(row).toContainText(originalDescription);
    await expect(row).not.toContainText(updatedDescription);

    await context.setOffline(false);
    await dialog.cancel();
  });

  test.skip(
    'TC-108: Read-only role cannot edit — SKIPPED (no read-only test account in .env)',
    () => {},
  );

  test.skip(
    'TC-109: Concurrent edit conflict — SKIPPED (requires a second authenticated session)',
    () => {},
  );

  test.skip(
    'TC-110: Editing a program deleted in another session — SKIPPED (requires a second session)',
    () => {},
  );

  test('TC-111: Esc with unsaved changes closes silently (no warning — documented gap)', async ({
    page,
  }) => {
    const dialog = await programs.openEditDialog(programName);
    await dialog.fillProgramName('Discarded via Esc');

    await page.keyboard.press('Escape');

    await expect(dialog.dialog).toBeHidden();
    await expect(programs.rowByName(programName)).toBeVisible();
    await expect(programs.rowByName('Discarded via Esc')).toHaveCount(0);
  });
});
