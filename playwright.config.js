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
    trace: 'on',

    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',

        viewport: null,

        launchOptions: isCI
          ? {}
          : {
              args: ['--start-maximized'],
            },

        contextOptions: {
          storageState: undefined,
        },
      },
    },
  ],
});