const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Limiter les workers en local pour plus de stabilite
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.05, // Tolérer 5% de pixels différents (antialiasing, etc)
      animations: 'disabled', // Figer les animations pour les captures
    },
  },

  projects: [
    {
      name: 'Desktop PC Plein Écran',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'Desktop PC Fenêtré large',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 }
      },
    },
    {
      name: 'Desktop PC Fenêtré standard',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    },
    {
      name: 'Tablette iPad (Portrait)',
      use: { ...devices['iPad Pro 11'] },
    },
    {
      name: 'Tablette iPad (Paysage)',
      use: {
        ...devices['iPad Pro 11 landscape'],
      },
    },
    {
      name: 'Mobile Galaxy S9+ (Portrait)',
      use: { ...devices['Galaxy S9+'] },
    },
    {
      name: 'Mobile Galaxy S9+ (Paysage)',
      use: { ...devices['Galaxy S9+ landscape'] },
    },
  ],

  webServer: {
    command: 'npx http-server -p 8080 .',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
  },
});
