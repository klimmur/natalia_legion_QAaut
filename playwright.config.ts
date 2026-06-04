import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { AUTH_STORAGE_RELATIVE } from './tests/auth.constants';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
dotenv.config({ path: path.resolve(__dirname, '.env') });

/** Set PER_TEST_LOGIN=1 to benchmark UI login per test (no storageState / setup project). */
const reuseAuth = process.env.PER_TEST_LOGIN !== '1';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  globalSetup: './support/global-setup.ts',
  globalTeardown: './support/global-teardown.ts',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['./support/program-cleanup-reporter.ts'], ['html']],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: process.env.DIDAXIS_URL,

    /* Always collect a trace for every test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on',
  },

  /* Configure projects for major browsers */
  projects: [
    ...(reuseAuth ? [{ name: 'setup', testMatch: /auth\.setup\.ts/ }] : []),

    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(reuseAuth ? { storageState: AUTH_STORAGE_RELATIVE } : {}),
      },
      ...(reuseAuth ? { dependencies: ['setup' as const] } : {}),
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        ...(reuseAuth ? { storageState: AUTH_STORAGE_RELATIVE } : {}),
      },
      ...(reuseAuth ? { dependencies: ['setup' as const] } : {}),
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        ...(reuseAuth ? { storageState: AUTH_STORAGE_RELATIVE } : {}),
      },
      ...(reuseAuth ? { dependencies: ['setup' as const] } : {}),
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
