import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./ui",
  testMatch: "calendar.spec.ts",
  outputDir: "/tmp/emb-calendar-ui-results",
  reporter: "list",
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3101",
    timezoneId: "America/Los_Angeles",
    hasTouch: true,
    trace: "off",
    screenshot: "off",
  },
  webServer: {
    cwd: process.cwd(),
    command: "node scripts/test-calendar-ui-server.mjs",
    url: "http://127.0.0.1:3101",
    reuseExistingServer: false,
  },
});
