import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.ts",
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
    // Set PW_CHROMIUM_PATH to run against an already-installed Chromium instead of `npx playwright install`.
    launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH || undefined },
  },
  webServer: {
    command: "npm run build && npx next start -p 3100",
    url: "http://localhost:3100/login",
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
