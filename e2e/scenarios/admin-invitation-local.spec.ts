import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

test("recupera una invitación fallida desde el formulario y acepta el enlace local", async ({ page, browser }) => {
  test.skip(process.env.RUN_LOCAL_INVITATION_E2E !== "1", "Usar pnpm test:invitation:e2e:local");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  expect(url).toMatch(/^http:\/\/(localhost|127\.0\.0\.1):/);
  const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const suffix = randomUUID();
  const email = `invite-${suffix}@example.test`;
  const adminEmail = `admin-${suffix}@example.test`;
  const password = `Test-${randomUUID()}!`;
  const ids: string[] = [];
  try {
    const { data, error } = await admin.auth.admin.createUser({ email: adminEmail, password, email_confirm: true });
    expect(error).toBeNull();
    ids.push(data.user!.id);
    const { error: profileError } = await admin.from("users").update({
      name: "Administrador E2E", admin: "admin", role: "super_admin", is_active: true, provisioning_status: "ready",
    }).eq("id", data.user!.id);
    expect(profileError).toBeNull();

    await page.goto("/login");
    await page.getByRole("textbox", { name: "Email", exact: true }).fill(adminEmail);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole("button", { name: "Ingresar", exact: true }).click();
    await expect(page).toHaveURL("http://localhost:3000/");
    await page.goto("/admin/users");
    await page.getByRole("button", { name: "Crear usuario", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByPlaceholder("Nombre", { exact: true }).fill("Invitación E2E");
    await dialog.getByPlaceholder("Email", { exact: true }).fill(email);
    await dialog.getByRole("button", { name: "Crear", exact: true }).click();
    await expect(dialog.getByRole("heading", { name: "Completar alta" })).toBeVisible();
    await expect(dialog.getByPlaceholder("Email", { exact: true })).toHaveValue(email);

    const { data: pending, error: lookupError } = await admin.from("users")
      .select("id, provisioning_status, is_active, invitation_sent_at").eq("email", email).single();
    expect(lookupError).toBeNull();
    ids.push(pending!.id);
    expect(pending).toMatchObject({ provisioning_status: "pending", is_active: false, invitation_sent_at: null });
    const mailbox = join(process.env.LOCAL_INVITATION_ARTIFACTS!, "emails.jsonl");
    expect(existsSync(mailbox)).toBe(false);
    expect(existsSync(join(process.env.LOCAL_INVITATION_ARTIFACTS!, "first-attempt")), "El primer fallo debe proceder del transporte simulado").toBe(true);

    // Simulate expiry of the dispatch lease, without waiting five minutes.
    const { error: leaseError } = await admin.from("users").update({
      invitation_dispatch_started_at: new Date(Date.now() - 10 * 60_000).toISOString(),
    }).eq("id", pending!.id);
    expect(leaseError).toBeNull();
    await dialog.getByRole("button", { name: "Reintentar alta" }).click();
    await expect(dialog).toBeHidden();
    await page.getByPlaceholder("Buscar por nombre, email o cargo").fill(email);
    await expect(page.getByRole("row").filter({ hasText: email })).toHaveCount(1);
    const { data: ready } = await admin.from("users").select("id, provisioning_status, is_active, invitation_sent_at").eq("email", email).single();
    expect(ready).toMatchObject({ id: pending!.id, provisioning_status: "ready", is_active: true });
    expect(ready!.invitation_sent_at).toBeTruthy();
    const messages = readFileSync(mailbox, "utf8").trim().split("\n").map((line) => JSON.parse(line));
    expect(messages).toHaveLength(1);
    expect(messages[0].to).toEqual([email]);
    const href = messages[0].html.match(/href="([^"]*\/auth\/v1\/verify[^"]*)"/)?.[1]?.replaceAll("&amp;", "&");
    expect(new URL(href).origin).toBe(new URL(url).origin);
    const invitedContext = await browser.newContext();
    try {
      const invitedPage = await invitedContext.newPage();
      await invitedPage.goto(href);
      await expect(invitedPage).toHaveURL("http://localhost:3000/welcome");
      await expect(invitedPage.getByRole("heading", { name: "Bienvenido al Portal de Vacaciones y Compensatorios" })).toBeVisible();
      await expect(invitedPage.getByRole("link", { name: "Ir a mi panel" })).toHaveCount(0);
      const { data: beforePassword } = await admin.from("users").select("invitation_status").eq("id", pending!.id).single();
      expect(beforePassword?.invitation_status).toBe("pending");
      await invitedPage.goto("/");
      await expect(invitedPage).toHaveURL("http://localhost:3000/welcome");
      const newPassword = `Nueva-${randomUUID()}!`;
      await invitedPage.getByLabel("Nueva contraseña", { exact: true }).fill(newPassword);
      await invitedPage.getByLabel("Confirmar contraseña", { exact: true }).fill("Otra-contraseña1!");
      await invitedPage.getByRole("button", { name: "Guardar contraseña" }).click();
      await expect(invitedPage.getByText("Las contraseñas no coinciden", { exact: true })).toBeVisible();
      await invitedPage.getByLabel("Confirmar contraseña", { exact: true }).fill(newPassword);
      await invitedPage.getByRole("button", { name: "Guardar contraseña" }).click();
      await expect(invitedPage.getByRole("link", { name: "Ir a mi panel" })).toBeVisible();
      await invitedPage.getByRole("link", { name: "Ir a mi panel" }).click();
      await expect(invitedPage).toHaveURL("http://localhost:3000/");
      const { data: accepted } = await admin.from("users").select("invitation_status").eq("id", pending!.id).single();
      expect(accepted?.invitation_status).toBe("accepted");
      const login = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
      const { data: signedIn, error: signInError } = await login.auth.signInWithPassword({ email, password: newPassword });
      expect(signInError).toBeNull();
      expect(signedIn.user?.id).toBe(pending!.id);
      await login.auth.signOut();
    } finally {
      await invitedContext.close();
    }
  } finally {
    // Only remove the random disposable accounts belonging to this run.
    const { data: remaining } = await admin.from("users").select("id").eq("email", email);
    for (const id of Array.from(new Set([...ids, ...(remaining ?? []).map((row) => row.id)]))) {
      const { error: profileDeleteError } = await admin.from("users").delete().eq("id", id);
      expect.soft(profileDeleteError, "Limpieza del perfil temporal").toBeNull();
      const { error } = await admin.auth.admin.deleteUser(id);
      expect.soft(error?.message ?? null, "Limpieza de la cuenta temporal").toBeNull();
    }
  }
});
