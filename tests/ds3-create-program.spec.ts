import { test, expect } from '@playwright/test';
import {
  SLOW_LIST_TIMEOUT,
  gotoPrograms,
  login,
  openNewProgramModal,
  rowByName,
  uniqueName,
} from './didaxis-helpers';

/**
 * DS-3 — Program Name Validation and Duplicate Prevention.
 *
 * Source test plan: block2/DS-3/agent_output.md
 * Locator rules:   didaxis_prompt_template.md
 *
 * Notes about the live app (verified via Playwright MCP exploration):
 *   - The New Program modal has only Program Name (required) and Description
 *     plus an optional AI Generation Config block. No Start/End Date, Status,
 *     or Category fields are present, so any test step that references those
 *     fields is interpreted as "fill other required fields" = Name only.
 *   - Create button is disabled when Program Name is empty or whitespace-only.
 *   - Duplicate names are silently accepted (no duplicate-name validation).
 *   - Trailing/leading whitespace is trimmed on save (for both Name and
 *     Description).
 *   - There is no enforced max length (1000+ chars accepted).
 *   - No archived / soft-delete feature is exposed in the UI.
 */

test.describe('DS-3: Create Program — positive flows', () => {
  test.describe.configure({ timeout: 90_000 });

  test.beforeEach(async ({ page }) => {
    await login(page);
    await gotoPrograms(page);
  });

  test('TC-001: Name with special characters and accented Unicode is accepted', async ({
    page,
  }) => {
    const name = `${uniqueName('Informatique & IA - Niveau 2')}`;
    const description = "Cours d'introduction à l'IA";

    const dialog = await openNewProgramModal(page);
    await dialog.getByRole('textbox', { name: 'Program Name' }).fill(name);
    await dialog.getByRole('textbox', { name: 'Description' }).fill(description);
    await dialog.getByRole('button', { name: 'Create' }).click();

    await expect(rowByName(page, name)).toBeVisible({ timeout: SLOW_LIST_TIMEOUT });
    await expect(dialog).toBeHidden({ timeout: SLOW_LIST_TIMEOUT });

    // The `&` must be rendered as itself, not HTML-escaped.
    const row = rowByName(page, name);
    await expect(row).toContainText('&');
    await expect(row).not.toContainText('&amp;');
  });

  test('TC-002: Standard alphanumeric name is accepted', async ({ page }) => {
    const name = uniqueName('Web Development 2026');

    const dialog = await openNewProgramModal(page);
    await dialog.getByRole('textbox', { name: 'Program Name' }).fill(name);
    await dialog.getByRole('button', { name: 'Create' }).click();

    await expect(rowByName(page, name)).toBeVisible({ timeout: SLOW_LIST_TIMEOUT });
    await expect(dialog).toBeHidden({ timeout: SLOW_LIST_TIMEOUT });
  });

  test('TC-003: Leading/trailing whitespace in Name is trimmed on save', async ({ page }) => {
    const trimmedName = uniqueName('Web Development 2026');
    const padded = `   ${trimmedName}   `;

    const dialog = await openNewProgramModal(page);
    await dialog.getByRole('textbox', { name: 'Program Name' }).fill(padded);
    await dialog.getByRole('button', { name: 'Create' }).click();

    // The row appears under the TRIMMED name.
    await expect(rowByName(page, trimmedName)).toBeVisible({ timeout: SLOW_LIST_TIMEOUT });
  });

  test('TC-004: Case variants are accepted as distinct (app is case-sensitive — documented gap)', async ({
    page,
  }) => {
    // The test plan recommends case-INSENSITIVE duplicate detection. The
    // current app silently accepts both cases as distinct programs.
    // We document the actual behavior here so any future change to
    // case-insensitive detection breaks this test loudly.
    const base = uniqueName('Web Development 2026');
    const upper = base.toUpperCase();

    let dialog = await openNewProgramModal(page);
    await dialog.getByRole('textbox', { name: 'Program Name' }).fill(base);
    await dialog.getByRole('button', { name: 'Create' }).click();
    await expect(rowByName(page, base)).toBeVisible({ timeout: SLOW_LIST_TIMEOUT });

    dialog = await openNewProgramModal(page);
    await dialog.getByRole('textbox', { name: 'Program Name' }).fill(upper);
    await dialog.getByRole('button', { name: 'Create' }).click();

    await expect(rowByName(page, upper)).toBeVisible({ timeout: SLOW_LIST_TIMEOUT });
    await expect(rowByName(page, base)).toBeVisible();
  });

  test('TC-005: Internal multiple spaces are preserved (no silent collapsing)', async ({
    page,
  }) => {
    const name = `Web   Development   2026 - ${Date.now()}`;

    const dialog = await openNewProgramModal(page);
    await dialog.getByRole('textbox', { name: 'Program Name' }).fill(name);
    await dialog.getByRole('button', { name: 'Create' }).click();

    // Row exists with the EXACT name (no collapsing).
    await expect(rowByName(page, name)).toBeVisible({ timeout: SLOW_LIST_TIMEOUT });
  });
});
