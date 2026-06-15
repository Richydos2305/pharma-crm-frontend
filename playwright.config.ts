import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.claude/tmp',
  outputDir: '.claude/tmp/.output',
  use: {
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    baseURL: 'http://localhost:5173'
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true
  }
});
