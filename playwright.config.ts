import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.JARVIS_LIVE_URL || 'http://127.0.0.1:4173';
const useLocalServer = !process.env.JARVIS_LIVE_URL;

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 1,
  fullyParallel: true,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['./tests/reporters/jarvis-error-reporter.ts']
  ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  webServer: useLocalServer ? {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000
  } : undefined
});
