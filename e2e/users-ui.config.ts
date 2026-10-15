import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./ui",
  testMatch: "users-directory.spec.ts",
  outputDir: "/tmp/emb-users-ui-results",
  reporter: "list",
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3102",
    timezoneId: "America/Los_Angeles",
    hasTouch: true,
    trace: "off",
    screenshot: "off",
  },
  webServer: {
    cwd: process.cwd(),
    command: "node scripts/test-users-ui-server.mjs",
    url: "http://127.0.0.1:3102",
    reuseExistingServer: false,
  },
});
