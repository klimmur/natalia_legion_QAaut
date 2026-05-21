import { expect, type Page, type Locator } from '@playwright/test';

const EMAIL = process.env.DIDAXIS_EMAIL!;
const PASSWORD = process.env.DIDAXIS_PASSWORD!;

if (!EMAIL || !PASSWORD) {
  throw new Error(
    'DIDAXIS_EMAIL and DIDAXIS_PASSWORD must be set in .env (loaded via dotenv in playwright.config.ts).',
  );
}

export const SLOW_LIST_TIMEOUT = 15_000;

export async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Email' }).fill(EMAIL);
  await page.getByRole('textbox', { name: 'Password' }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 2 })).toBeVisible();
}

export async function gotoPrograms(page: Page): Promise<void> {
  await page.getByRole('button', { name: '🎓 Programs' }).click();
  await expect(page).toHaveURL(/\/programs$/);
  await expect(page.getByRole('heading', { name: 'Programs', level: 2 })).toBeVisible();
}

export async function createProgram(
  page: Page,
  name: string,
  description: string,
): Promise<void> {
  await page.getByRole('button', { name: '+ New Program' }).click();

  const dialog = page.getByRole('dialog', { name: 'New Program' });
  await expect(dialog).toBeVisible();

  await dialog.getByRole('textbox', { name: 'Program Name' }).fill(name);
  await dialog.getByRole('textbox', { name: 'Description' }).fill(description);

  const createBtn = dialog.getByRole('button', { name: 'Create' });
  await expect(createBtn).toBeEnabled();
  await createBtn.click();

  await expect(
    rowByName(page, name),
  ).toBeVisible({ timeout: SLOW_LIST_TIMEOUT });
  await expect(dialog).toBeHidden({ timeout: SLOW_LIST_TIMEOUT });
}

/**
 * Open the New Program modal and return its dialog locator. The dialog is
 * asserted visible before returning.
 */
export async function openNewProgramModal(page: Page): Promise<Locator> {
  await page.getByRole('button', { name: '+ New Program' }).click();
  const dialog = page.getByRole('dialog', { name: 'New Program' });
  await expect(dialog).toBeVisible();
  return dialog;
}

/**
 * Locate a Programs-table row whose name cell contains exactly `name`.
 * Uses a descendant exact-text match (`getByText(name, { exact: true })`) so
 * "Foo" does NOT match a row named "Foo - Updated".
 */
export function rowByName(page: Page, name: string): Locator {
  return page.getByRole('row').filter({
    has: page.getByText(name, { exact: true }),
  });
}

/**
 * Open the Edit modal for the program with the given name. Returns the dialog
 * locator for further interaction.
 */
export async function openEditModal(page: Page, name: string): Promise<Locator> {
  const row = rowByName(page, name);
  await expect(row).toBeVisible({ timeout: SLOW_LIST_TIMEOUT });
  await row.getByRole('button', { name: '✏️' }).click();

  const dialog = page.getByRole('dialog', { name: 'Edit Program' });
  await expect(dialog).toBeVisible();
  return dialog;
}

export async function saveAndClose(page: Page, dialog: Locator, finalName: string): Promise<void> {
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(
    rowByName(page, finalName),
  ).toBeVisible({ timeout: SLOW_LIST_TIMEOUT });
  await expect(dialog).toBeHidden({ timeout: SLOW_LIST_TIMEOUT });
}

export function uniqueName(prefix = 'Web Development 2026'): string {
  return `${prefix} - ${Date.now()}-${Math.floor(Math.random() * 1e4)}`;
}
