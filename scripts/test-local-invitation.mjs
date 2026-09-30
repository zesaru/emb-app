import { execFileSync, spawnSync } from "node:child_process";

const status = execFileSync("./node_modules/.bin/supabase", ["status", "-o", "env"], {
  encoding: "utf8",
});
const values = Object.fromEntries(status.split(/\r?\n/).filter(Boolean).map((line) => {
  const separator = line.indexOf("=");
  return [line.slice(0, separator), line.slice(separator + 1).replace(/^"|"$/g, "")];
}));

if (!/^http:\/\/(localhost|127\.0\.0\.1):/.test(values.API_URL ?? "") || !values.SERVICE_ROLE_KEY) {
  throw new Error("La prueba requiere Supabase local activo");
}

const result = spawnSync("pnpm", ["exec", "vitest", "run", "test/integration/admin-invitation-local.spec.ts"], {
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: values.API_URL,
    SUPABASE_SERVICE_ROLE_KEY: values.SERVICE_ROLE_KEY,
    RUN_LOCAL_INVITATION_INTEGRATION: "1",
  },
  stdio: "inherit",
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
