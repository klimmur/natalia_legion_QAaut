import { request as playwrightRequest } from '@playwright/test';
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
 * DS-5 — Programs list, negative flows.
 * Source: block2/DS-5/agent_output.md
 */

test.describe('DS-5: Programs list — negative flows', () => {
  test.describe.configure({ timeout: 120_000 });

  test.skip(
    'TC-101: User without view permission cannot see programs — SKIPPED (only admin role available in .env)',
    () => {},
  );

  test('TC-102: Unauthenticated GET /api/programs is rejected (401/403/redirect — never 200)', async () => {
    const ctx = await playwrightRequest.newContext();
    try {
      const resp = await ctx.get(`${process.env.DIDAXIS_URL}/api/programs`);

      expect(resp.status()).not.toBe(200);
      // Accept any 4xx/5xx as "rejected": 401/403 is ideal, 404 or 500 is still
      // a non-leak (test plan requires the call NOT to succeed without auth).
      expect(resp.status()).toBeGreaterThanOrEqual(400);

      // Body should not contain a program payload (no JSON array of programs).
      const body = (await resp.text()).toLowerCase();
      expect(body).not.toContain('"name"');
    } finally {
      await ctx.dispose();
    }
  });

  test('TC-103: 500 on list fetch shows an error state, not the empty state', async ({ page }) => {
    await login(page);

    // Force the next list fetch to fail.
    await page.route('**/api/programs', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.getByRole('button', { name: '🎓 Programs' }).click();
    await expect(page.getByRole('heading', { name: 'Programs', level: 2 })).toBeVisible();

    // No rows should load (data fetch failed).
    const programRows = page.locator('table tbody tr');
    await expect(programRows).toHaveCount(0, { timeout: SLOW_LIST_TIMEOUT });

    // The page header is still present (page did not crash).
    await expect(page.getByRole('heading', { name: 'Programs', level: 2 })).toBeVisible();

    // ─────────────────────────── DOCUMENTED GAP ───────────────────────────
    // The test plan requires the error state to be VISUALLY DISTINCT from the
    // "no programs yet" empty state with a retry control. In the current
    // build the Programs page does not surface any visible error banner or
    // retry button when GET /api/programs returns 500 — the table simply
    // stays empty, which is indistinguishable from a genuine empty list.
    // This assertion documents the desired behavior so the test fails if /
    // when the app eventually grows a real error UI without us being aware.
    // ──────────────────────────────────────────────────────────────────────
    test.fail();
    await expect(
      page.getByText(/couldn.?t load programs|try again|something went wrong|error/i),
    ).toBeVisible({ timeout: 3_000 });
  });

  test('TC-104: Offline navigation shows an error state, not the empty state', async ({
    page,
    context,
  }) => {
    await login(page);

    await context.setOffline(true);
    try {
      // Try to navigate to Programs from the dashboard while offline. The
      // network call will fail; we only assert the page does not crash and
      // does not falsely render an "empty" list.
      await page
        .getByRole('button', { name: '🎓 Programs' })
        .click({ timeout: 5_000 })
        .catch(() => {});

      // Wait briefly for any error UI to settle.
      await page.waitForTimeout(1_500);

      const programRows = page.locator('table tbody tr');
      const visibleCount = await programRows.count();

      // Either we never reached the Programs page, or we did but it shows no
      // rows (because the fetch failed). Both are acceptable; what is NOT
      // acceptable is a false empty-state message implying "no programs".
      await expect(page.getByText(/^no programs yet$/i)).toHaveCount(0);
      expect(visibleCount).toBe(0);
    } finally {
      await context.setOffline(false);
    }
  });

  test('TC-105: Slow list response shows a loading state, not the empty state', async ({
    page,
  }) => {
    await login(page);

    const DELAY_MS = 4_000;

    await page.route('**/api/programs', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }
      await new Promise((r) => setTimeout(r, DELAY_MS));
      await route.continue();
    });

    const navStarted = Date.now();
    const navPromise = page.getByRole('button', { name: '🎓 Programs' }).click();

    // While the list is still loading, the empty-state copy MUST NOT appear.
    // We sample ~1s into the delay window.
    await page.waitForTimeout(1_500);
    expect(Date.now() - navStarted).toBeLessThan(DELAY_MS);
    await expect(page.getByText(/^no programs yet$/i)).toHaveCount(0);

    await navPromise;

    // After the delay completes, the real list (with rows) appears.
    await expect(page.locator('table tbody tr').first()).toBeVisible({
      timeout: SLOW_LIST_TIMEOUT + DELAY_MS,
    });

    await page.unroute('**/api/programs');
  });

  test.skip(
    'TC-106: Empty-state CTA respects create permission — SKIPPED (no empty state + only admin role)',
    () => {},
  );

  test('TC-107: A deleted program does not appear in the list', async ({ page }) => {
    await login(page);
    await gotoPrograms(page);

    const name = uniqueName('Test Program');
    await createProgram(page, name, 'will be deleted');

    const dialogP = expectDeleteConfirmDialog(page, 'accept');
    await deleteButtonForRow(page, name).click();
    await dialogP;

    // Immediately gone in the live list.
    await expect(rowByName(page, name)).toHaveCount(0, { timeout: SLOW_LIST_TIMEOUT });

    // Also gone after a hard reload (server truly deleted, not just a UI hide).
    await page.reload();
    await expect(rowByName(page, name)).toHaveCount(0, { timeout: SLOW_LIST_TIMEOUT });
  });

  test('TC-108: XSS payloads in Name and Description render as text and do not execute', async ({
    page,
  }) => {
    await login(page);
    await gotoPrograms(page);

    const xssName = uniqueName(`<script>window.__xss=1</script>X`);
    const xssDesc = `<img src=x onerror="window.__xssImg=1">desc`;

    let alertFired = false;
    page.on('dialog', async (d) => {
      alertFired = true;
      await d.dismiss();
    });

    await createProgram(page, xssName, xssDesc);

    const row = rowByName(page, xssName);
    await expect(row).toBeVisible();

    // The literal <script>...</script> tag text is rendered (escaped),
    // not interpreted as a child <script> element of the row.
    await expect(row).toContainText('<script>');
    const scriptCountInRow = await row.locator('script').count();
    expect(scriptCountInRow).toBe(0);

    const imgCountInRow = await row.locator('img').count();
    expect(imgCountInRow).toBe(0);

    // Neither side-effect flag fired (no script execution, no onerror).
    const xss = await page.evaluate(() => (window as unknown as { __xss?: number }).__xss);
    const xssImg = await page.evaluate(
      () => (window as unknown as { __xssImg?: number }).__xssImg,
    );
    expect(xss).toBeUndefined();
    expect(xssImg).toBeUndefined();
    expect(alertFired).toBe(false);
  });

  test('TC-109: Malformed list payload does not crash the page', async ({ page }) => {
    // ─────────────────────────── DOCUMENTED GAP ───────────────────────────
    // The test plan requires the page to keep rendering when one record in
    // the GET /api/programs response is malformed (e.g., description: null).
    // The current build does NOT defensively handle this — when the mocked
    // payload below is served, the Programs page never finishes rendering
    // (the H2 heading never appears, no row mounts). Marked test.fail() so
    // the test will start passing once the renderer tolerates a null
    // description or an unknown extra field.
    // ──────────────────────────────────────────────────────────────────────
    test.fail();

    await login(page);

    await page.route('**/api/programs', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }
      const payload = [
        { id: 'fake-1', name: 'Well-Formed Program', description: 'has description' },
        { id: 'fake-2', name: 'Missing Description Program', description: null },
        {
          id: 'fake-3',
          name: 'Extra Field Program',
          description: 'normal',
          mysteryField: { nested: true },
        },
      ];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(payload),
      });
    });

    await page.getByRole('button', { name: '🎓 Programs' }).click();
    await expect(page.getByRole('heading', { name: 'Programs', level: 2 })).toBeVisible();

    await expect(rowByName(page, 'Well-Formed Program')).toBeVisible({
      timeout: SLOW_LIST_TIMEOUT,
    });
    await expect(rowByName(page, 'Missing Description Program')).toBeVisible({
      timeout: SLOW_LIST_TIMEOUT,
    });
    await expect(rowByName(page, 'Extra Field Program')).toBeVisible({
      timeout: SLOW_LIST_TIMEOUT,
    });

    await page.unroute('**/api/programs');
  });

  test('TC-110: Deep-link to /programs while logged out redirects to /login', async ({
    page,
  }) => {
    await page.goto('/programs');

    // App should bounce the unauthenticated user to /login (or at minimum,
    // never expose the Programs heading + table to a logged-out request).
    await expect(page).toHaveURL(/\/login$/, { timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test.skip(
    'TC-111: URL manipulation cannot fabricate rows — SKIPPED (Programs page has no query-string state in this build)',
    () => {},
  );
});
