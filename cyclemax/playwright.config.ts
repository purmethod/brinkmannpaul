import { defineConfig, devices } from "@playwright/test";

// E2E against the real static export + real backend (SQLite) + mocked Claude API.
// Build first: NEXT_PUBLIC_API_BASE=http://localhost:8787 npm run build
const iPhone = devices["iPhone 14 Pro"];

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    ...iPhone,
    browserName: "chromium",
    defaultBrowserType: "chromium",
    baseURL: "http://localhost:3100",
    locale: "de-DE",
    timezoneId: "Europe/Berlin",
    launchOptions: { executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" },
    serviceWorkers: "allow",
  },
  webServer: [
    { command: "node tests/e2e/mock-anthropic.mjs 8788", port: 8788, reuseExistingServer: false },
    {
      command: "node --import tsx server/dev.ts",
      port: 8787,
      reuseExistingServer: false,
      env: {
        PORT: "8787",
        SQLITE_URL: ":memory:",
        ANTHROPIC_API_KEY: "test-key",
        ANTHROPIC_BASE_URL: "http://127.0.0.1:8788",
        CLAUDE_FALLBACKS: "off",
        ADMIN_PASSWORD: "e2e-admin",
        CRON_SECRET: "e2e-cron",
      },
    },
    { command: "node scripts/serve-static.mjs 3100", port: 3100, reuseExistingServer: false },
  ],
});
