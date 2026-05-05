require('dotenv').config();

const { defineConfig, devices } = require('@playwright/test');

const isCI = !!process.env.CI;

module.exports = defineConfig({
  testDir: './tests',
  timeout: isCI ? 120_000 : 90_000,   // CI runners are slower — give them more time
  expect: { timeout: isCI ? 20_000 : 15_000 },
  fullyParallel: false,
  retries: isCI ? 2 : 0,              // bumped to 2 for flaky CI network conditions
  workers: 1,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ...(isCI ? [['github']] : []),
  ],

  use: {
    baseURL: process.env.BASE_URL || 'https://inventuredev4.inventure.mu',

    headless: isCI ? true : process.env.HEADLESS !== 'false',
    slowMo: Number(process.env.SLOW_MO) || 0,

    // FIX: viewport: null is unsafe in headless CI — no window manager exists.
    // Use a fixed size in CI; allow null (native OS window) on local.
    viewport: isCI ? { width: 1440, height: 900 } : null,

    screenshot: 'on',
    video: 'on',
    trace: 'on',

    ignoreHTTPSErrors: true,

    // Auth0 flows involve redirects — give navigation more room in CI
    navigationTimeout: isCI ? 45_000 : 30_000,
    actionTimeout: isCI ? 20_000 : 10_000,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',

        // FIX: removed viewport: null here too — it was overriding the fix above.
        // The global viewport setting now applies cleanly.

        launchOptions: {
          args: isCI
            ? [
                '--no-sandbox',            // required on Linux CI runners
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage', // prevents crashes on low-memory runners
              ]
            : ['--start-maximized'],
        },

        contextOptions: {
          storageState: undefined,
        },
      },
    },
  ],
});