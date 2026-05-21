Write Playwright tests for the Didaxis Studio app.

## App context (verified via Playwright MCP exploration)

### Login page — `https://test.didaxis.studio/login`

- Email field: `page.getByRole('textbox', { name: 'Email' })`
  - (also reachable via `page.getByLabel('Email')`, placeholder: `you@college.edu`)
- Password field: `page.getByRole('textbox', { name: 'Password' })`
  - (also reachable via `page.getByLabel('Password')`, placeholder: `Your password`)
- Sign In button: `page.getByRole('button', { name: 'Sign In' })`
- On success, app navigates to `/` and the Dashboard is shown.

### Top navigation (after login)

- Dashboard: `page.getByRole('button', { name: '📊 Dashboard' })`
- Programs: `page.getByRole('button', { name: '🎓 Programs' })` → navigates to `/programs`
- Calendar: `page.getByRole('button', { name: '📅 Calendar' })`
- Validation: `page.getByRole('button', { name: '✅ Validation' })`
- Scheduler: `page.getByRole('button', { name: '⚡ Scheduler' })`
- Export: `page.getByRole('button', { name: '📤 Export' })`
- Settings: `page.getByRole('button', { name: '⚙️ Settings' })`
- Sign out: `page.getByRole('button', { name: 'Sign out' })`

### Programs page — `/programs`

- Page heading: `page.getByRole('heading', { name: 'Programs', level: 2 })`
- New Program button: `page.getByRole('button', { name: '+ New Program' })`
- Programs table: `page.getByRole('table')`
  - Each row contains the program name + description, plus two action buttons:
    - Edit (pencil): accessible name `✏️`
    - Delete (trash): accessible name `🗑`
  - Locate a row by program name and act on it:
    ```ts
    const row = page.getByRole('row').filter({ hasText: programName });
    await row.getByRole('button', { name: '✏️' }).click(); // edit
    await row.getByRole('button', { name: '🗑' }).click();  // delete
    ```

### New Program modal (opened by `+ New Program`)

- Dialog: `page.getByRole('dialog', { name: 'New Program' })`
- Program Name: `dialog.getByRole('textbox', { name: 'Program Name' })`
  - (also reachable via `dialog.getByLabel('Program Name')`, placeholder: `e.g. Computer Science BSc`)
- Description: `dialog.getByRole('textbox', { name: 'Description' })`
  - (also reachable via `dialog.getByLabel('Description')`, placeholder: `Brief description`)
- AI Generation Config toggle: `dialog.getByRole('button', { name: /Show AI Generation Config/ })`
- Cancel: `dialog.getByRole('button', { name: 'Cancel' })`
- Create: `dialog.getByRole('button', { name: 'Create' })` — disabled until Program Name is filled

### Edit Program modal (opened by clicking pencil ✏️ on a row)

- Dialog: `page.getByRole('dialog', { name: 'Edit Program' })`
- Program Name: `dialog.getByRole('textbox', { name: 'Program Name' })`
  - Pre-populated with the program's saved name.
- Description: `dialog.getByRole('textbox', { name: 'Description' })`
  - Pre-populated with the program's saved description (may be empty if none was saved).
- AI Generation Config toggle: `dialog.getByRole('button', { name: /Show AI Generation Config/ })`
- Cancel: `dialog.getByRole('button', { name: 'Cancel' })`
- Save: `dialog.getByRole('button', { name: 'Save' })`

## Credentials

Use dotenv. Read URL, email, and password from `process.env`:

- `process.env.DIDAXIS_URL` (e.g. `https://test.didaxis.studio`)
- `process.env.DIDAXIS_EMAIL`
- `process.env.DIDAXIS_PASSWORD`

Do NOT hardcode credentials in test files. `dotenv` is loaded in `playwright.config.ts`,
and `baseURL` is set to `process.env.DIDAXIS_URL`.

## Test plan

[Paste the test plan for the feature under test, e.g. block2/DS-2/agent_output.md for the Edit Program feature.]

## Requirements

- TypeScript
- Use Playwright locators (`getByRole`, `getByLabel`, `getByText`)
- Login as the first step in each test (use `beforeEach`)
- Each test is independent — seed and clean up its own data
- Use unique test data with `Date.now()` suffix (e.g. `Web Development 2026 - ${Date.now()}`)
- Save files using the naming convention `tests/<ticket>-<feature>.spec.ts`
  - DS-1 (create program) → `tests/ds1-create-program.spec.ts`
  - DS-2 (edit program) → `tests/ds2-edit-program.spec.ts`
