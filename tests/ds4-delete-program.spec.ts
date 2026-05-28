import { test, expect } from '../fixtures/cleanup.fixture';
import {
  SLOW_LIST_TIMEOUT,
  createProgram,
  deleteButtonForRow,
  expectDeleteConfirmDialog,
  gotoPrograms,
  login,
  rowByName,
  uniqueName,
} from './didaxis-helpers';

/**
 * DS-4 — Delete Program with Confirmation.
 *
 * Source test plan: block2/DS-4/agent_output.md
 * Locator rules:   didaxis_prompt_template.md
 *
 * Notes about the live app (verified via Playwright MCP exploration):
 *   - The "delete" confirmation is a NATIVE browser confirm() dialog —
 *     NOT a Mantine modal. Message format:
 *       Delete program "<name>"? All its semesters and courses will be removed.
 *       This cannot be undone.
 *   - There is no X icon, no backdrop, no programmatic focus order on a
 *     native confirm. Tests for those affordances are SKIPPED.
 *   - On accept, the app issues DELETE /api/programs/{id} → 200.
 *   - On dismiss, no DELETE request is issued.
 *   - The Programs page has no search/filter/pagination affordances visible,
 *     and there is no detail page, dashboard widget, audit log, or undo.
 *     Tests for those are SKIPPED with reasons.
 */

test.describe('DS-4: Delete Program — positive flows', () => {
  test.describe.configure({ timeout: 90_000 });

  let programName: string;

  test.beforeEach(async ({ page }) => {
    programName = uniqueName('Test Program');
    await login(page);
    await gotoPrograms(page);
    await createProgram(page, programName, 'Original');
  });

  test('TC-001: Delete icon opens a confirmation dialog that names the program', async ({
    page,
  }) => {
    // Dismiss the dialog so the program survives this test (we are only
    // verifying that the prompt appears and identifies the right program).
    const dialogP = expectDeleteConfirmDialog(page, 'dismiss');
    await deleteButtonForRow(page, programName).click();
    const message = await dialogP;

    expect(message).toContain(programName);
    expect(message.toLowerCase()).toContain('delete');

    // Program still exists.
    await expect(rowByName(page, programName)).toBeVisible();
  });

  test('TC-002: Confirming deletion removes the program from the list', async ({ page }) => {
    const dialogP = expectDeleteConfirmDialog(page, 'accept');
    await deleteButtonForRow(page, programName).click();
    await dialogP;

    await expect(rowByName(page, programName)).toHaveCount(0, { timeout: SLOW_LIST_TIMEOUT });
  });

  test('TC-003: Cancelling deletion preserves the program', async ({ page }) => {
    const dialogP = expectDeleteConfirmDialog(page, 'dismiss');
    await deleteButtonForRow(page, programName).click();
    await dialogP;

    await expect(rowByName(page, programName)).toBeVisible();
  });

  test.skip(
    'TC-004: Closing dialog via X icon preserves program — SKIPPED (native confirm has no X icon)',
    () => {},
  );

  test('TC-005: Esc-equivalent (dismiss) keeps the program intact', async ({ page }) => {
    // On a native confirm dialog, Esc is equivalent to dismiss. Playwright's
    // dialog.dismiss() simulates the same outcome.
    const dialogP = expectDeleteConfirmDialog(page, 'dismiss');
    await deleteButtonForRow(page, programName).click();
    await dialogP;

    await expect(rowByName(page, programName)).toBeVisible();
  });

  test.skip(
    'TC-006: Backdrop click preserves program — SKIPPED (native confirm has no backdrop)',
    () => {},
  );

  test('TC-007: Deletion persists after a page refresh', async ({ page }) => {
    const dialogP = expectDeleteConfirmDialog(page, 'accept');
    await deleteButtonForRow(page, programName).click();
    await dialogP;

    await expect(rowByName(page, programName)).toHaveCount(0, { timeout: SLOW_LIST_TIMEOUT });

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Programs', level: 2 })).toBeVisible();

    await expect(rowByName(page, programName)).toHaveCount(0, { timeout: SLOW_LIST_TIMEOUT });
  });

  test.skip(
    'TC-008: Deletion visible to a second user/session — SKIPPED (only one admin account in .env)',
    () => {},
  );

  test.skip(
    'TC-009: Deleting the only program shows an empty state — SKIPPED (test env has 1000+ existing programs)',
    () => {},
  );

  test('TC-010: Multiple consecutive deletions each require their own confirmation', async ({
    page,
  }) => {
    const nameA = uniqueName('Test Program A');
    const nameB = uniqueName('Test Program B');
    const nameC = uniqueName('Test Program C');

    await createProgram(page, nameA, 'A');
    await createProgram(page, nameB, 'B');
    await createProgram(page, nameC, 'C');

    for (const name of [nameA, nameB, nameC]) {
      const dialogP = expectDeleteConfirmDialog(page, 'accept');
      await deleteButtonForRow(page, name).click();
      const message = await dialogP;
      expect(message).toContain(name);
      await expect(rowByName(page, name)).toHaveCount(0, { timeout: SLOW_LIST_TIMEOUT });
    }
  });
});
