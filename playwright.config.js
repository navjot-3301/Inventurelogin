// playwright.config.js
require('dotenv').config();

const { defineConfig, devices } = require('@playwright/test');

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

    // ── Screenshots ──────────────────────────────────────────────
    screenshot: 'on',                         // capture on every test end
    screenshotsPath: process.env.SCREENSHOTS_DIR || 'screenshots',

    // ── Videos ───────────────────────────────────────────────────
    video: 'on',                              // record every test
    videosDir: process.env.VIDEOS_DIR || 'videos',
    videoSize: { width: 1280, height: 720 },

    // ── Tracing ──────────────────────────────────────────────────
    trace: 'retain-on-failure',

    // ── Context ──────────────────────────────────────────────────
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'chromium-incognito',
      use: {
        ...devices['Desktop Chrome'],
        contextOptions: {
          // fresh session for every test — mirrors incognito behaviour
          storageState: undefined,
          
        },
        launchOptions: {
      args: ['--start-maximized'],
        },
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        launchOptions: {
          args: ['--start-maximized'],
        },
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        launchOptions: {
          args: ['--start-maximized'],
        },    
      },
    },
  ],
});
