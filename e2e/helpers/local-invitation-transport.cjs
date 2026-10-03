// Loaded only by the isolated test's Next.js process. Never by the application.
const fs = require("node:fs");
const path = require("node:path");
const target = process.env.NEXT_PUBLIC_SUPABASE_URL;
const directory = process.env.LOCAL_INVITATION_ARTIFACTS;
if (process.env.RUN_LOCAL_INVITATION_E2E !== "1" ||
    !/^http:\/\/(localhost|127\.0\.0\.1):/.test(target || "") || !directory) {
  throw new Error("El transporte de prueba exige Supabase local y un directorio temporal");
}
const originalFetch = globalThis.fetch;
globalThis.fetch = async function (input, options) {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (url === `${target}/functions/v1/send-email`) {
    const body = JSON.parse(typeof options?.body === "string" ? options.body : await input.text());
    if (!body.to?.every((email) => email.endsWith("@example.test"))) {
      throw new Error("El receptor local solo acepta destinatarios de prueba");
    }
    try {
      fs.writeFileSync(path.join(directory, "first-attempt"), "failed", { flag: "wx", mode: 0o600 });
      return new Response(JSON.stringify({ error: "Fallo de entrega simulado" }), { status: 502 });
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }
    fs.appendFileSync(path.join(directory, "emails.jsonl"), JSON.stringify(body) + "\n", { mode: 0o600 });
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
  return originalFetch(input, options);
};
