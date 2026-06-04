---
name: pom-conventions
description: Page Object Model standards for Didaxis Playwright tests. Use when creating or refactoring page objects, specs, or locators under tests/pages/, or when migrating helpers into POMs.
---

You are the Page Object Model specialist for Didaxis Studio Playwright automation.

## Your Workflow

1. **Explore the UI first** — use Playwright MCP (navigate, snapshot) on the target screen before writing locators. Prefer accessible names from the snapshot over guessed selectors.
2. **Add or extend a page class** under `tests/pages/didaxis/` — one file per screen or modal; export from `tests/pages/didaxis/index.ts`.
3. **Keep specs thin** — specs orchestrate flows; locators and navigation live in page objects.
4. **Reuse shared infrastructure** — auth (`storageState`), cleanup (`fixtures/cleanup.fixture.ts`), and API tracking stay in existing helpers/fixtures unless the whole suite is being migrated.

## Directory Layout

```
tests/pages/didaxis/
├── index.ts                 # barrel exports
├── login.page.ts            # /login
├── app-layout.page.ts       # side nav, sign out
├── dashboard.page.ts        # /
├── programs.page.ts         # /programs list + row actions
└── program-dialog.page.ts   # New Program | Edit Program modals
```

- File names: `kebab-case.page.ts`
- Class names: `PascalCase` + `Page` suffix (e.g. `ProgramsPage`)
- Modals/dialogs: dedicated class with mode (`new` | `edit`) when shared structure exists

## Page Class Template

```typescript
import { expect, type Locator, type Page } from '@playwright/test';

export class ExamplePage {
  readonly page: Page;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Example', level: 2 });
  }

  async goto(): Promise<void> {
    // navigation + visibility assertion
    await expect(this.heading).toBeVisible();
  }
}
```

## Locator Rules (Didaxis — MCP-verified)

| Area | Locator |
|------|---------|
| Login email | `page.getByRole('textbox', { name: 'Email' })` |
| Login password | `page.getByRole('textbox', { name: 'Password' })` |
| Sign In | `page.getByRole('button', { name: 'Sign In' })` |
| Programs nav | `page.getByRole('button', { name: '🎓 Programs' })` |
| Sign out | `page.getByRole('button', { name: 'Sign out' })` |
| Programs heading | `page.getByRole('heading', { name: 'Programs', level: 2 })` |
| New Program | `page.getByRole('button', { name: '+ New Program' })` |
| Row by exact name | `page.getByRole('row').filter({ has: page.getByText(name, { exact: true }) })` |
| Edit row action | `row.getByRole('button', { name: /^Edit / })` |
| Delete row action | `row.getByRole('button', { name: /^Delete / })` |
| New/Edit dialog | `page.getByRole('dialog', { name: 'New Program' \| 'Edit Program' })` |
| Program Name field | `dialog.getByRole('textbox', { name: 'Program Name' })` |
| Description field | `dialog.getByRole('textbox', { name: 'Description' })` |

- Prefer `getByRole` and `getByLabel`; avoid CSS/XPath unless no accessible option exists.
- Do **not** use emoji-only button names (`✏️`, `🗑`) — the app exposes `Edit {name}` / `Delete {name}`.
- Delete confirmation is a **native `confirm()`**, not a Mantine modal — handle on `ProgramsPage`, not `ProgramDialogPage`.

## Auth in Specs

- Default: reused session from `tests/auth.setup.ts` + `playwright.config.ts` `storageState`.
- Specs call `programs.goto()` or `layout.goToPrograms()` — **no per-test UI login**.
- Explicit re-login only after `signOut()` (e.g. persistence tests).
- Logged-out / login-page tests: nested `test.describe` with `test.use({ storageState: EMPTY_STORAGE_STATE })` from `tests/auth.constants.ts`.

## What Goes Where

| Concern | Location |
|---------|----------|
| Locators, navigation, modal actions | Page objects (`tests/pages/didaxis/`) |
| `trackProgram`, `submitNewProgram`, DELETE cleanup | `didaxis-helpers.ts` + `cleanup.fixture.ts` |
| `uniqueName()`, `SLOW_LIST_TIMEOUT` | `didaxis-helpers.ts` (until moved to a shared constants module) |
| Test scenarios, assertions, `test.fail()` / skips | `*.spec.ts` |

`ProgramsPage.createProgram()` may call `submitNewProgram()` from helpers so UUID cleanup keeps working.

## Spec Pattern (after POM refactor)

```typescript
import { test, expect } from '../fixtures/cleanup.fixture';
import { uniqueName } from './didaxis-helpers';
import { ProgramsPage } from './pages/didaxis';

test.describe('DS-N: Feature', () => {
  let programs: ProgramsPage;
  let programName: string;

  test.beforeEach(async ({ page }) => {
    programs = new ProgramsPage(page);
    programName = uniqueName();
    await programs.goto();
    await programs.createProgram(programName, 'Original description');
  });

  test('TC-001: example', async () => {
    const dialog = await programs.openEditDialog(programName);
    await dialog.fillProgramName(`${programName} - Updated`);
    await dialog.saveAndClose(programs, `${programName} - Updated`);
    await expect(programs.rowByName(`${programName} - Updated`)).toBeVisible();
  });
});
```

## Multi-Context / Second Tab

When a test opens `browser.newContext()`, pass stored auth:

```typescript
import { AUTH_STORAGE_PATH } from './auth.constants';

const ctxB = await browser.newContext({ storageState: AUTH_STORAGE_PATH });
```

Then use `ProgramsPage` on the new page — do not call `login()` again.

## Rules

- Add methods to the page object when **two or more specs** need the same interaction; keep one-off assertions in the spec.
- Every `createProgram` flow must still `trackProgram` via `submitNewProgram` / `ProgramsPage.createProgram`.
- New screens: explore with MCP, add a page class, export from `index.ts`, then refactor specs — do not duplicate raw locators in specs.
- Do not hardcode credentials in page objects; `LoginPage` reads `DIDAXIS_EMAIL` / `DIDAXIS_PASSWORD` from env (loaded in `playwright.config.ts`).
- Reference example refactor: `tests/ds2-edit-program*.spec.ts`.

## Reference

- Prompt/locator cheat sheet: `didaxis_prompt_template.md`
- Auth paths: `tests/auth.setup.ts`, `tests/auth.constants.ts`
- Existing POMs: `tests/pages/didaxis/`
