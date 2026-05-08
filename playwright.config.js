require('dotenv').config();

const { defineConfig, devices } = require('@playwright/test');

const isCI = !!process.env.CI;

module.exports = defineConfig({
  testDir: './tests',

  timeout: 90_000,

  expect: {
    timeout: 15_000,
  },

  fullyParallel: true,

  retries: isCI ? 1 : 0,

  workers: isCI ? 4 : 2,

  forbidOnly: isCI,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ...(isCI ? [['github']] : []),
  ],

  use: {
    baseURL:
      process.env.BASE_URL || 'https://inventuredev4.inventure.mu/',

    headless: isCI,

    slowMo: isCI ? 0 : Number(process.env.SLOW_MO) || 0,

    screenshot: 'only-on-failure',

    video: 'retain-on-failure',

    trace: 'retain-on-failure',

    viewport: { width: 1280, height: 800 },

    ignoreHTTPSErrors: true,

    actionTimeout: 15000,

    navigationTimeout: 30000,

    // ✅ THIS makes each test behave like "private window"
    contextOptions: {
      storageState: undefined, // no login reuse
    },
  },

  projects: [
    // ================= CHROME =================
    {
      name: 'chrome',

      use: {
        ...devices['Desktop Chrome'],

        channel: 'chrome',

        contextOptions: {
          storageState: undefined, // fresh incognito-like session
        },

        launchOptions: isCI
          ? {}
          : {
              args: [
                '--start-maximized',

                // optional: helps enforce clean session behavior
                '--incognito',
              ],
            },
      },
    },

    // ================= FIREFOX =================
    {
      name: 'firefox',

      use: {
        ...devices['Desktop Firefox'],

        contextOptions: {
          storageState: undefined, // fresh session per test
        },
      },
    },
  ],
});