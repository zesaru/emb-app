import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./ui",
  testMatch: "staff-report.spec.ts",
  outputDir: "/tmp/emb-report-ui-results",
  reporter: "list",
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3103",
    timezoneId: "America/Los_Angeles",
    hasTouch: true,
    trace: "off",
    screenshot: "off",
  },
  webServer: {
    cwd: process.cwd(),
    command: "node scripts/test-report-ui-server.mjs",
    url: "http://127.0.0.1:3103",
    reuseExistingServer: false,
  },
});
