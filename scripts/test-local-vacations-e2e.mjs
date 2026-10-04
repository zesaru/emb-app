import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { tmpdir } from "node:os";
import { join } from "node:path";
const status = execFileSync("./node_modules/.bin/supabase", ["status", "-o", "env"], { encoding: "utf8" });
const values = Object.fromEntries(status.split(/\r?\n/).filter(Boolean).map((line) => {
  const separator = line.indexOf("=");
  return [line.slice(0, separator), line.slice(separator + 1).replace(/^"|"$/g, "")];
}));
if (!/^http:\/\/(localhost|127\.0\.0\.1):/.test(values.API_URL ?? "") || !values.SERVICE_ROLE_KEY || !values.ANON_KEY) throw new Error("La prueba exige Supabase local activo");
const artifacts = mkdtempSync(join(tmpdir(), "emb-vacations-e2e-"));
try {
  const result = spawnSync(process.execPath, ["node_modules/@playwright/test/cli.js", "test", "--config=e2e/local-vacations.config.ts", ...process.argv.slice(2)], {
    env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: values.API_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY: values.ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: values.SERVICE_ROLE_KEY, NEXT_PUBLIC_APP_URL: "http://localhost:3000", EMAIL_DELIVERY_ENABLED: "false",
      RUN_LOCAL_VACATION_E2E: "1", LOCAL_VACATION_ARTIFACTS: artifacts },
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  // The parent also cleans journaled fixtures if Playwright times out or terminates a worker.
  const journal = join(artifacts, "fixture-ids");
  try {
    if (existsSync(journal)) {
      const ids = readFileSync(journal, "utf8").trim().split("\n").filter((id) => /^[0-9a-f-]{36}$/.test(id));
      const admin = createClient(values.API_URL, values.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
      if (ids.length) {
        const vacations = await admin.from("vacations").delete().in("id_user", ids);
        if (vacations.error) throw vacations.error;
        const profiles = await admin.from("users").delete().in("id", ids);
        if (profiles.error) throw profiles.error;
        for (const id of ids) {
          const { error } = await admin.auth.admin.deleteUser(id);
          if (error && error.status !== 404) throw error;
        }
      }
    }
  } catch {
    console.error("No se pudo completar la limpieza de las cuentas temporales locales.");
    process.exitCode = 1;
  } finally { rmSync(artifacts, { recursive: true, force: true }); }
}
