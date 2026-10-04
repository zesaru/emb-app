import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./scenarios",
  testMatch: ["logout-local.spec.ts", "smoke-test.spec.ts"],
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: "list",
  outputDir: process.env.LOCAL_LOGOUT_ARTIFACTS,
  use: { baseURL: "http://localhost:3000", trace: "off", screenshot: "off" },
  webServer: {
    cwd: process.cwd(),
    command: "node node_modules/next/dist/bin/next dev --port 3000",
    url: "http://localhost:3000/login",
    reuseExistingServer: false,
    timeout: 90_000,
  },
});
