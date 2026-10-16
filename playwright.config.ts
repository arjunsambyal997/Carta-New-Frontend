import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run against a real backend and database (see e2e/README.md).
 * The backend must be started with DEV_SKIP_MFA=true so tests can sign in without an authenticator.
 */
const PORT = Number(process.env.E2E_PORT ?? 3100);
const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8090";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // Every test creates its own organization through the API, so tests never share data and can run in parallel.
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { BACKEND_URL: BACKEND },
  },
});
