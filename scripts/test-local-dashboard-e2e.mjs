import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.umask(0o077);
const status = execFileSync("./node_modules/.bin/supabase", ["status", "-o", "env"], { encoding: "utf8" });
const values = Object.fromEntries(status.split(/\r?\n/).filter(Boolean).map((line) => {
  const separator = line.indexOf("=");
  return [line.slice(0, separator), line.slice(separator + 1).replace(/^"|"$/g, "")];
}));
if (!/^http:\/\/(localhost|127\.0\.0\.1):55421$/.test(values.API_URL ?? "") || !values.SERVICE_ROLE_KEY || !values.ANON_KEY) {
  throw new Error("La prueba exige Supabase local emb-app activo en el puerto 55421");
}

// Fail before creating fixtures unless the complete local database backup can be verified.
function docker(args, input) {
  const result = spawnSync("docker", ["exec", ...(input ? ["-i"] : []), "supabase_db_emb-app", ...args], { input, maxBuffer: 128 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error("No se pudo completar o verificar el respaldo local");
  return result.stdout;
}
if (docker(["psql", "--username=postgres", "--dbname=postgres", "--tuples-only", "--no-align", "--command=SELECT count(*) FROM storage.objects"]).toString().trim() !== "0") {
  throw new Error("Storage local contiene archivos: respáldalos antes de ejecutar esta prueba");
}
const backup = mkdtempSync(join(tmpdir(), "emb-dashboard-backup-"));
const dump = docker(["pg_dump", "--username=postgres", "--dbname=postgres", "--format=custom"]);
const roles = docker(["pg_dumpall", "--username=postgres", "--roles-only", "--no-role-passwords"]);
writeFileSync(join(backup, "database.dump"), dump);
writeFileSync(join(backup, "roles.sql"), roles);
if (!docker(["pg_restore", "--list"], dump).length) throw new Error("Respaldo local vacío");
docker(["pg_restore", "--file=/dev/null"], dump);
for (const [name, bytes] of [["database.dump", dump], ["roles.sql", roles]]) {
  const hash = (data) => createHash("sha256").update(data).digest("hex");
  if (hash(readFileSync(join(backup, name))) !== hash(bytes)) throw new Error("Falló la verificación del respaldo local");
}
console.log(`Respaldo local verificado antes de las pruebas: ${backup}`);

const artifacts = mkdtempSync(join(tmpdir(), "emb-dashboard-e2e-"));
try {
  const result = spawnSync(process.execPath, ["node_modules/@playwright/test/cli.js", "test", "--config=e2e/local-dashboard.config.ts", ...process.argv.slice(2)], {
    env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: values.API_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY: values.ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: values.SERVICE_ROLE_KEY, NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      EMAIL_DELIVERY_ENABLED: "false", RUN_LOCAL_DASHBOARD_E2E: "1", LOCAL_DASHBOARD_ARTIFACTS: artifacts },
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  try {
    const journal = join(artifacts, "fixture-ids");
    if (existsSync(journal)) {
      const ids = readFileSync(journal, "utf8").trim().split("\n").filter((id) => /^[0-9a-f-]{36}$/.test(id));
      const admin = createClient(values.API_URL, values.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
      if (ids.length) {
        for (const [table, column] of [["compensatorys", "user_id"], ["vacations", "id_user"], ["dev_email_outbox", "triggered_by_user_id"], ["users", "id"]]) {
          const { error } = await admin.from(table).delete().in(column, ids);
          if (error) throw new Error("Error limpiando datos temporales");
        }
        for (const id of ids) {
          const { error } = await admin.auth.admin.deleteUser(id);
          if (error && error.status !== 404) throw new Error("Error limpiando cuenta temporal");
        }
      }
    }
  } catch {
    console.error("No se pudo completar la limpieza de los datos temporales locales.");
    process.exitCode = 1;
  } finally { rmSync(artifacts, { recursive: true, force: true }); }
}
