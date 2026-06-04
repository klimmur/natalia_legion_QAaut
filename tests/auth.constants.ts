import path from 'path';

/** Path relative to project root (used in playwright.config). */
export const AUTH_STORAGE_RELATIVE = 'playwright/.auth/user.json';

/** Absolute path for auth.setup and browser.newContext({ storageState }). */
export const AUTH_STORAGE_PATH = path.join(__dirname, '..', AUTH_STORAGE_RELATIVE);

/** Opt out of stored auth for login / logged-out tests (Playwright test.use). */
export const EMPTY_STORAGE_STATE = { cookies: [], origins: [] };
