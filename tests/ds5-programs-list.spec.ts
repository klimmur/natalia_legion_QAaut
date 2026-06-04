import { test, expect } from '../fixtures/cleanup.fixture';
import {
  SLOW_LIST_TIMEOUT,
  createProgram,
  gotoPrograms,
  login,
  rowByName,
  signOut,
  uniqueName,
} from './didaxis-helpers';

/**
 * DS-5 — Program List Filtering and Display.
 *
 * Source test plan: block2/DS-5/agent_output.md
 * Locator rules:   didaxis_prompt_template.md
 *
 * Notes about the live app (verified via Playwright MCP exploration of DS-2..DS-4):
 *   - Programs page renders an HTML table with one row per program. Each row
 *     shows Name (in a <p>) and Description (in another <p>), plus a pencil
 *     ✏️ edit button and a trash 🗑 delete button.
 *   - There is NO search box, NO filter, NO sort UI, NO pagination affordance,
 *     NO empty-state CTA, NO i18n switcher in the current build. Tests that
 *     depend on those features are SKIPPED with reasons.
 *   - The shared test environment already contains 1000+ programs from prior
 *     runs, so it is impossible to reach a true empty state without admin
 *     bulk-delete tooling — TC-002/003 and TC-201 are SKIPPED.
 *   - Only one (admin) account is provisioned in .env, so permission-related
 *     TCs are SKIPPED.
 */

test.describe('DS-5: Programs list — positive flows', () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(async ({ page }) => {
    await gotoPrograms(page);
  });

  test('TC-001: List renders each program with its name and description', async ({ page }) => {
    const a = uniqueName('Web Development 2026');
    const b = uniqueName('Data Science 2026');
    const c = uniqueName('Informatique & IA - Niveau 2');

    await createProgram(page, a, 'Front-end and back-end fundamentals.');
    await createProgram(page, b, 'Statistics, ML, and data engineering.');
    await createProgram(page, c, "Cours d'introduction à l'IA.");

    for (const [name, desc] of [
      [a, 'Front-end and back-end fundamentals.'],
      [b, 'Statistics, ML, and data engineering.'],
      [c, "Cours d'introduction à l'IA."],
    ] as const) {
      const row = rowByName(page, name);
      await expect(row).toBeVisible();
      await expect(row).toContainText(desc);
    }
  });

  test.skip(
    'TC-002: Empty state when no programs exist — SKIPPED (test env has 1000+ pre-existing rows; cannot reach empty state)',
    () => {},
  );

  test.skip(
    'TC-003: Empty-state CTA opens create flow — SKIPPED (no empty state in this env)',
    () => {},
  );

  test('TC-004: A newly created program appears in the list immediately', async ({ page }) => {
    const name = uniqueName('QA Automation 2026');

    await createProgram(page, name, 'End-to-end testing with Playwright.');

    const row = rowByName(page, name);
    await expect(row).toBeVisible();
    await expect(row).toContainText('End-to-end testing with Playwright.');
  });

  test('TC-005: Program data persists across page reload and log-out / log-in', async ({
    page,
  }) => {
    const name = uniqueName('Persistence 2026');
    await createProgram(page, name, 'Persists across reload + relogin');

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Programs', level: 2 })).toBeVisible();
    await expect(rowByName(page, name)).toBeVisible({ timeout: SLOW_LIST_TIMEOUT });

    await signOut(page);
    await login(page);
    await gotoPrograms(page);
    await expect(rowByName(page, name)).toBeVisible({ timeout: SLOW_LIST_TIMEOUT });
  });

  test('TC-006: Default sort places newly-created programs at the top (most-recent first)', async ({
    page,
  }) => {
    // Create two programs in quick succession; the later one should be ABOVE
    // the earlier one in the table. We assert the documented behavior so the
    // test fails loudly if the default sort ever changes.
    const earlier = uniqueName('Sort A');
    await createProgram(page, earlier, 'first created');

    // Wait long enough that timestamps differ deterministically.
    await page.waitForTimeout(1100);

    const later = uniqueName('Sort B');
    await createProgram(page, later, 'second created');

    // Find the row index of each name in the DOM order.
    const indices = await page.evaluate(({ a, b }) => {
      const rows = Array.from(document.querySelectorAll('table tbody tr')) as HTMLTableRowElement[];
      const idxA = rows.findIndex((r) => r.textContent?.includes(a));
      const idxB = rows.findIndex((r) => r.textContent?.includes(b));
      return { idxA, idxB };
    }, { a: earlier, b: later });

    expect(indices.idxA).toBeGreaterThanOrEqual(0);
    expect(indices.idxB).toBeGreaterThanOrEqual(0);
    expect(indices.idxB).toBeLessThan(indices.idxA); // later was created last, must appear above.
  });

  test('TC-007: A ~500-character description renders without breaking row layout', async ({
    page,
  }) => {
    const name = uniqueName('Comprehensive Web Bootcamp');
    const longDesc = `Bootcamp for full-stack developers. `.repeat(15); // ~525 chars

    await createProgram(page, name, longDesc);

    const row = rowByName(page, name);
    await expect(row).toBeVisible();

    // The row stays inside a single table row (not bleeding into adjacent rows).
    const rowCount = await row.count();
    expect(rowCount).toBe(1);

    // Confirm the description is present (full or truncated) — at minimum the
    // first sentence appears so the user can identify what the program is.
    await expect(row).toContainText('Bootcamp for full-stack developers.');
  });

  test('TC-008: Names with special characters and Unicode render verbatim (no &amp;, no mojibake)', async ({
    page,
  }) => {
    const ampName = uniqueName('Informatique & IA - Niveau 2');
    const ruName = uniqueName('Программа 2026 — Веб 🚀');

    await createProgram(page, ampName, "Cours d'introduction à l'IA.");
    await createProgram(page, ruName, 'Backend & frontend — основы.');

    const ampRow = rowByName(page, ampName);
    await expect(ampRow).toBeVisible();
    await expect(ampRow).toContainText('&');
    await expect(ampRow).not.toContainText('&amp;');
    await expect(ampRow).toContainText('à');

    const ruRow = rowByName(page, ruName);
    await expect(ruRow).toBeVisible();
    await expect(ruRow).toContainText('Программа');
    await expect(ruRow).toContainText('🚀');
  });

});
