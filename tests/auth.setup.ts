import { test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { AUTH_STORAGE_PATH } from './auth.constants';
import { login } from './didaxis-helpers';

setup('authenticate as admin', async ({ page }) => {
  fs.mkdirSync(path.dirname(AUTH_STORAGE_PATH), { recursive: true });
  await login(page);
  await page.context().storageState({ path: AUTH_STORAGE_PATH });
});
