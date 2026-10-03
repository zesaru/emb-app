import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./scenarios",
  testMatch: "admin-invitation-local.spec.ts",
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: "list",
  outputDir: process.env.LOCAL_INVITATION_ARTIFACTS,
  use: { baseURL: "http://localhost:3000", trace: "off", screenshot: "off" },
  webServer: {
    cwd: process.cwd(),
    command: "node node_modules/next/dist/bin/next dev --port 3000",
    url: "http://localhost:3000/login",
    reuseExistingServer: false,
    timeout: 90_000,
    env: { NODE_OPTIONS: `--require=${process.cwd()}/e2e/helpers/local-invitation-transport.cjs` },
  },
});
