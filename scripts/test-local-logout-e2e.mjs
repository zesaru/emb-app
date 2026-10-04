import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const status = execFileSync("./node_modules/.bin/supabase", ["status", "-o", "env"], { encoding: "utf8" });
const values = Object.fromEntries(status.split(/\r?\n/).filter(Boolean).map((line) => {
  const separator = line.indexOf("=");
  return [line.slice(0, separator), line.slice(separator + 1).replace(/^"|"$/g, "")];
}));
if (!/^http:\/\/(localhost|127\.0\.0\.1):/.test(values.API_URL ?? "") || !values.SERVICE_ROLE_KEY || !values.ANON_KEY) {
  throw new Error("La prueba exige Supabase local activo");
}
const artifacts = mkdtempSync(join(tmpdir(), "emb-logout-e2e-"));
try {
  const result = spawnSync(process.execPath, ["node_modules/@playwright/test/cli.js", "test", "--config=e2e/local-logout.config.ts", ...process.argv.slice(2)], {
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: values.API_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: values.ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: values.SERVICE_ROLE_KEY,
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      EMAIL_DELIVERY_ENABLED: "false",
      RUN_LOCAL_LOGOUT_E2E: "1",
      LOCAL_LOGOUT_ARTIFACTS: artifacts,
    },
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(artifacts, { recursive: true, force: true });
}
