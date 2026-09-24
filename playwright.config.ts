import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://127.0.0.1:4321',
    launchOptions: { executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox', '--enable-unsafe-swiftshader'] },
  },
  webServer: { command: 'npm run dev -- --ignore-lock', url: 'http://127.0.0.1:4321', reuseExistingServer: !process.env.CI },
});
