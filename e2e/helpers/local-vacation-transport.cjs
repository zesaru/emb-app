// Fault injection is loaded only by the isolated local test server.
const fs = require("node:fs");
const path = require("node:path");
const target = process.env.NEXT_PUBLIC_SUPABASE_URL;
const directory = process.env.LOCAL_VACATION_ARTIFACTS;
if (process.env.RUN_LOCAL_VACATION_E2E !== "1" || !/^http:\/\/(localhost|127\.0\.0\.1):/.test(target || "") || !directory) {
  throw new Error("El transporte de prueba exige Supabase local y un directorio temporal");
}
const originalFetch = globalThis.fetch;
globalThis.fetch = async function (input, options) {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
  if (url.origin === new URL(target).origin && url.pathname === "/rest/v1/vacations" && fs.existsSync(path.join(directory, "fail-vacations"))) {
    return new Response(JSON.stringify({ code: "LOCAL_TEST", message: "Fallo local de lectura simulado" }), { status: 503, headers: { "Content-Type": "application/json" } });
  }
  return originalFetch(input, options);
};
