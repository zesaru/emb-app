// Browser-only fixture: real calendar and styles, no Auth or database connection.
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import react from "@vitejs/plugin-react";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
const vitestRequire = createRequire(require.resolve("vitest/package.json"));
const { createServer } = await import(pathToFileURL(vitestRequire.resolve("vite")).href);
const fixture = path.join(root, "e2e/fixtures/calendar-ui");
const server = await createServer({
  configFile: false,
  root: fixture,
  plugins: [react()],
  resolve: {
    alias: {
      "next/dynamic": path.join(fixture, "dynamic.tsx"),
      "@": root,
    },
  },
  css: { postcss: root },
  server: { host: "127.0.0.1", port: 3101, strictPort: true, fs: { allow: [root] } },
});
await server.listen();
console.log("Calendar UI fixture: http://127.0.0.1:3101");
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => { await server.close(); process.exit(0); });
}
