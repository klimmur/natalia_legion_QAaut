import { expect, type Page, type Locator, type Response } from '@playwright/test';
import { trackProgram } from '../fixtures/cleanup.fixture';

const EMAIL = process.env.DIDAXIS_EMAIL!;
const PASSWORD = process.env.DIDAXIS_PASSWORD!;
const PROGRAMS_POST = /\/api\/programs\/?$/;

if (!EMAIL || !PASSWORD) {
  throw new Error(
    'DIDAXIS_EMAIL and DIDAXIS_PASSWORD must be set in .env (loaded via dotenv in playwright.config.ts).',
  );
}

export const SLOW_LIST_TIMEOUT = 15_000;

function isProgramCreateResponse(response: Response): boolean {
  const request = response.request();
  if (request.method() !== 'POST' || response.status() !== 201) {
    return false;
  }

  try {
    return PROGRAMS_POST.test(new URL(response.url()).pathname);
  } catch {
    return false;
  }
}

async function extractProgramId(response: Response): Promise<string | null> {
  try {
    const body = await response.json();
    const id = body?.data?.id;
    return typeof id === 'string' && id.length > 0 ? id : null;
  } catch {
    return null;
  }
}

/**
 * Click a Create control, capture POST /api/programs → 201, and track the UUID.
 */
export async function trackCreateOnClick(
  page: Page,
  click: () => Promise<void>,
): Promise<string> {
  const responsePromise = page.waitForResponse(isProgramCreateResponse);
  await click();
  const response = await responsePromise;
  const id = await extractProgramId(response);
  if (!id) {
    throw new Error('POST /api/programs did not return a program id');
  }
  trackProgram(id);
  return id;
}

/**
 * Submit the New Program dialog, track the created program, and wait for the list to update.
 */
export async function submitNewProgram(
  page: Page,
  dialog: Locator,
  rowName?: string,
): Promise<string> {
  const id = await trackCreateOnClick(page, () =>
    dialog.getByRole('button', { name: 'Create' }).click(),
  );

  if (rowName !== undefined) {
    await expect(rowByName(page, rowName)).toBeVisible({ timeout: SLOW_LIST_TIMEOUT });
  }
  await expect(dialog).toBeHidden({ timeout: SLOW_LIST_TIMEOUT });
  return id;
}

export async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Email' }).fill(EMAIL);
  await page.getByRole('textbox', { name: 'Password' }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 2 })).toBeVisible();
}

export async function signOut(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login$/);
}

/** Land on Dashboard — UI login when benchmarking, else reuse storageState cookies. */
export async function goToDashboard(page: Page): Promise<void> {
  if (process.env.PER_TEST_LOGIN === '1') {
    await login(page);
    return;
  }
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 2 })).toBeVisible();
}

export async function gotoPrograms(page: Page): Promise<void> {
  await goToDashboard(page);
  await page.getByRole('button', { name: '🎓 Programs' }).click();
  await expect(page).toHaveURL(/\/programs$/);
  await expect(page.getByRole('heading', { name: 'Programs', level: 2 })).toBeVisible();
}

export async function createProgram(
  page: Page,
  name: string,
  description: string,
): Promise<string> {
  await page.getByRole('button', { name: '+ New Program' }).click();

  const dialog = page.getByRole('dialog', { name: 'New Program' });
  await expect(dialog).toBeVisible();

  await dialog.getByRole('textbox', { name: 'Program Name' }).fill(name);
  await dialog.getByRole('textbox', { name: 'Description' }).fill(description);

  const createBtn = dialog.getByRole('button', { name: 'Create' });
  await expect(createBtn).toBeEnabled();
  return submitNewProgram(page, dialog, name);
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
 * Locate the trash (🗑) delete icon for the program row matching `name`.
 */
export function deleteButtonForRow(page: Page, name: string): Locator {
  return rowByName(page, name).getByRole('button', { name: '🗑' });
}

export type DialogAction = 'accept' | 'dismiss';

/**
 * Register a one-shot handler for the native confirm() dialog that the app
 * uses for delete confirmation. Returns a Promise that resolves to the
 * dialog message once the dialog has been handled.
 *
 * Usage:
 *   const dialogP = expectDeleteConfirmDialog(page, 'accept');
 *   await deleteButtonForRow(page, name).click();
 *   const message = await dialogP;
 *   expect(message).toContain(name);
 */
export function expectDeleteConfirmDialog(
  page: Page,
  action: DialogAction,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Native confirm dialog did not appear within 10s')),
      10_000,
    );
    page.once('dialog', async (dialog) => {
      clearTimeout(timer);
      const message = dialog.message();
      try {
        if (action === 'accept') {
          await dialog.accept();
        } else {
          await dialog.dismiss();
        }
        resolve(message);
      } catch (err) {
        reject(err);
      }
    });
  });
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
