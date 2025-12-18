import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
dotenv.config({ path: path.resolve(process.cwd(), '.env'), debug: true });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  //testDir: './tests/',
  testMatch: ['./tests/'],
  testIgnore: ['**/input/**'],
  timeout: 12 * 60 * 1000,
  //timeout for expect assertion
  expect: {
    timeout: 60 * 1000,
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 0 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['line'],
    ['json', { fileName: 'results.json' }],
    ['blob'],
    ['html'],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://127.0.0.1:3000',
    baseURL: process.env['BASE_URL'],

    /* Collect trace when failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-first-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1920, height: 1080 },
    actionTimeout: 60 * 1000,
    navigationTimeout: 60 * 1000,
    launchOptions: {
      slowMo: 1_000,
      args: [
        '--enable-features=ClipboardAPI', // Enable Clipboard API
        '--disable-blink-features=AutomationControlled', // Hide automation
        '--disable-dev-shm-usage',
        '--no-sandbox',
      ],
    },
    permissions: ['clipboard-read', 'clipboard-write'], // Grant clipboard permissions
    // Add extra HTTP headers to make requests look more like a real browser
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'metachart',
      testMatch: 'tests/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
      fullyParallel: true,
    },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
