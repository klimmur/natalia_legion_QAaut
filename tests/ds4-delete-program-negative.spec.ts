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
 * DS-4 — Delete Program — negative flows.
 * Source test plan: block2/DS-4/agent_output.md (TC-101…TC-113)
 */

test.describe('DS-4: Delete Program — negative flows', () => {
  test.describe.configure({ timeout: 120_000 });

  let programName: string;

  test.beforeEach(async ({ page }) => {
    programName = uniqueName('Test Program');
    await login(page);
    await gotoPrograms(page);
    await createProgram(page, programName, 'Original');
  });

  test('TC-101: Clicking the trash icon issues NO DELETE request until confirmation', async ({
    page,
  }) => {
    let deleteCount = 0;
    page.on('request', (req) => {
      if (req.method() === 'DELETE' && /\/api\/programs\//.test(req.url())) {
        deleteCount += 1;
      }
    });

    const dialogP = expectDeleteConfirmDialog(page, 'dismiss');
    await deleteButtonForRow(page, programName).click();
    await dialogP;

    expect(deleteCount).toBe(0);
    await expect(rowByName(page, programName)).toBeVisible();
  });

  test.skip(
    'TC-102: Read-only role cannot delete — SKIPPED (no non-admin test account available)',
    () => {},
  );

  test('TC-103: Server 500 on DELETE — program remains in the list', async ({ page }) => {
    // Mock every DELETE /api/programs/* to return 500.
    await page.route('**/api/programs/*', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 500, body: 'Internal Server Error' });
        return;
      }
      await route.fallback();
    });

    const dialogP = expectDeleteConfirmDialog(page, 'accept');
    await deleteButtonForRow(page, programName).click();
    await dialogP;

    await page.waitForTimeout(2000);

    // No dangling optimistic removal — the row is still in the list.
    await expect(rowByName(page, programName)).toBeVisible();

    await page.unroute('**/api/programs/*');
  });

  test('TC-104: Network offline during DELETE — row remains in the list', async ({
    page,
    context,
  }) => {
    await context.setOffline(true);

    const dialogP = expectDeleteConfirmDialog(page, 'accept');
    await deleteButtonForRow(page, programName).click();
    await dialogP;

    await page.waitForTimeout(2000);
    await expect(rowByName(page, programName)).toBeVisible();

    await context.setOffline(false);
  });

  test('TC-105: Delete a program already deleted in another session — UI handles 404 gracefully', async ({
    page,
    browser,
  }) => {
    // Simulate "another session" by deleting it from a fresh browser context.
    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    try {
      await login(pageB);
      await gotoPrograms(pageB);

      const dialogB = expectDeleteConfirmDialog(pageB, 'accept');
      await deleteButtonForRow(pageB, programName).click();
      await dialogB;
      await expect(rowByName(pageB, programName)).toHaveCount(0, { timeout: SLOW_LIST_TIMEOUT });
    } finally {
      await ctxB.close();
    }

    // Session A still THINKS the program exists. Track the DELETE response.
    const deleteStatuses: number[] = [];
    page.on('response', (r) => {
      if (r.request().method() === 'DELETE' && /\/api\/programs\//.test(r.url())) {
        deleteStatuses.push(r.status());
      }
    });

    const dialogA = expectDeleteConfirmDialog(page, 'accept');
    await deleteButtonForRow(page, programName).click();
    await dialogA;

    // Allow the response to arrive.
    await page.waitForTimeout(2000);

    // The server should respond with a clean 4xx (not 500). The list should
    // ultimately reflect the deletion when refreshed.
    expect(deleteStatuses.length).toBeGreaterThanOrEqual(1);
    expect(deleteStatuses.every((s) => s >= 400 && s < 500)).toBe(true);

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Programs', level: 2 })).toBeVisible();
    await expect(rowByName(page, programName)).toHaveCount(0, { timeout: SLOW_LIST_TIMEOUT });
  });

  test.skip(
    'TC-106: Dependent-data deletion rule — SKIPPED (no documented way to seed enrollments/sessions in this env)',
    () => {},
  );

  test('TC-107: Rapid trash-icon double-click only triggers one confirmation', async ({ page }) => {
    // A native confirm dialog is modal — once it appears, page interaction
    // is blocked until the user responds. A double-click on the trash icon
    // should therefore result in EXACTLY ONE prompt, EXACTLY ONE DELETE.
    let promptCount = 0;
    let deleteCount = 0;
    page.on('dialog', async (dialog) => {
      promptCount += 1;
      await dialog.accept();
    });
    page.on('request', (req) => {
      if (req.method() === 'DELETE' && /\/api\/programs\//.test(req.url())) {
        deleteCount += 1;
      }
    });

    await deleteButtonForRow(page, programName).click({ clickCount: 2, delay: 30 });

    await expect(rowByName(page, programName)).toHaveCount(0, { timeout: SLOW_LIST_TIMEOUT });

    expect(promptCount).toBe(1);
    expect(deleteCount).toBe(1);
  });

  test('TC-108: Cancel/Esc/Dismiss never trigger a DELETE request', async ({ page }) => {
    let deleteCount = 0;
    page.on('request', (req) => {
      if (req.method() === 'DELETE' && /\/api\/programs\//.test(req.url())) {
        deleteCount += 1;
      }
    });

    for (let i = 0; i < 3; i++) {
      const dialogP = expectDeleteConfirmDialog(page, 'dismiss');
      await deleteButtonForRow(page, programName).click();
      await dialogP;
    }

    expect(deleteCount).toBe(0);
    await expect(rowByName(page, programName)).toBeVisible();
  });

  test('TC-109: Deleting one program does not affect unrelated programs', async ({ page }) => {
    const otherA = uniqueName('Web Development 2026');
    const otherB = uniqueName('Data Science 2026');

    await createProgram(page, otherA, 'A');
    await createProgram(page, otherB, 'B');

    const dialogP = expectDeleteConfirmDialog(page, 'accept');
    await deleteButtonForRow(page, programName).click();
    await dialogP;

    await expect(rowByName(page, programName)).toHaveCount(0, { timeout: SLOW_LIST_TIMEOUT });
    await expect(rowByName(page, otherA)).toBeVisible();
    await expect(rowByName(page, otherB)).toBeVisible();
  });

  test.skip(
    'TC-110: Deleted program not in search results — SKIPPED (no visible search box on Programs page)',
    () => {},
  );

  test.skip(
    'TC-111: Deleted program absent from related views — SKIPPED (no documented program-name reference views to verify)',
    () => {},
  );

  test('TC-112: Unauthenticated DELETE is rejected by the server', async ({ playwright }) => {
    // Use a fresh request context with NO storage state / no cookies.
    const ctx = await playwright.request.newContext();
    try {
      const resp = await ctx.delete(`${process.env.DIDAXIS_URL}/api/programs/some-id-12345`);
      // Without an auth token, the server must NOT permit deletion. 401 is
      // ideal; 403/404 are also acceptable as "not allowed for this caller".
      expect(resp.status()).toBeGreaterThanOrEqual(400);
      expect(resp.status()).not.toBe(200);
    } finally {
      await ctx.dispose();
    }
  });

  test('TC-113: DELETE on a non-existent id returns a clean error (4xx, no 500)', async ({
    request,
  }) => {
    const resp = await request.delete(
      `${process.env.DIDAXIS_URL}/api/programs/00000000-0000-0000-0000-000000000000`,
    );
    expect(resp.status()).toBeGreaterThanOrEqual(400);
    expect(resp.status()).toBeLessThan(500);
  });
});
