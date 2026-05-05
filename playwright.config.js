require('dotenv').config();

const { defineConfig } = require('@playwright/test');

if (!process.env.BASE_URL) {
  throw new Error('❌ BASE_URL is not set. Check GitHub Secrets or .env file.');
}

module.exports = defineConfig({
  testDir: './tests',

  timeout: 90_000,
  expect: { timeout: 15_000 },

  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ...(process.env.CI ? [['github']] : []),
  ],

  use: {
    baseURL: process.env.BASE_URL,

    headless: process.env.HEADLESS !== 'false',
    slowMo: Number(process.env.SLOW_MO) || 0,

    screenshot: 'on',
    video: 'on',
    trace: 'on',

    viewport: null,
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',

        viewport: null,

        launchOptions: process.env.CI
          ? {}
          : {
              args: ['--start-maximized'],
            },
      },
    },
  ],
});