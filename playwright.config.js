// playwright.config.js
require('dotenv').config();

const { defineConfig, devices } = require('@playwright/test');

const isCI = !!process.env.CI;

module.exports = defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: isCI ? 1 : 0,
  workers: 1,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ...(isCI ? [['github']] : []),
  ],

  use: {
    baseURL: process.env.BASE_URL || 'https://inventuredev4.inventure.mu',

    headless: process.env.HEADLESS !== 'false',

    slowMo: Number(process.env.SLOW_MO) || 0,

    screenshot: 'on',
    video: 'on',
    trace: 'retain-on-failure',

    // ✅ FIXED: Fullscreen logic
    viewport: isCI ? { width: 1920, height: 1080 } : null,

    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'chromium-incognito',
      use: {
        ...devices['Desktop Chrome'],

        contextOptions: {
          storageState: undefined,
        },

        launchOptions: isCI
          ? {}
          : {
              args: ['--start-maximized'],
            },
      },
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }, // Firefox doesn't fully support maximize
      },
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
});