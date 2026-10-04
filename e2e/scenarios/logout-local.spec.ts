import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

for (const keyboard of [false, true]) {
  test(`cierra la sesión desde el menú con ${keyboard ? "teclado" : "ratón"} y protege el panel`, async ({ page }) => {
    test.skip(process.env.RUN_LOCAL_LOGOUT_E2E !== "1", "Usar pnpm test:logout:local");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    expect(url).toMatch(/^http:\/\/(localhost|127\.0\.0\.1):/);
    const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
    const otherSession = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
    const email = `logout-${randomUUID()}@example.test`;
    const password = `Test-${randomUUID()}!`;
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    expect(error).toBeNull();
    const id = data.user!.id;
    try {
      const profile = await admin.from("users").update({
        name: "Prueba cierre de sesión", is_active: true, provisioning_status: "ready", invitation_status: "accepted",
      }).eq("id", id);
      expect(profile.error).toBeNull();
      expect((await otherSession.auth.signInWithPassword({ email, password })).error).toBeNull();
      await page.goto("/login");
      await page.getByLabel("Email", { exact: true }).fill(email);
      await page.getByLabel("Contraseña", { exact: true }).fill(password);
      await page.getByRole("button", { name: "Ingresar", exact: true }).click();
      await expect(page).toHaveURL("http://localhost:3000/");
      await page.goto("/compensatorios");
      await page.getByRole("button", { name: "Menú de usuario" }).click();
      const logout = page.getByRole("menuitem", { name: "Cerrar sesión", exact: true });
      if (!keyboard && process.env.LOCAL_LOGOUT_SCREENSHOT) {
        await expect(logout).toBeVisible();
        await page.getByRole("menu").screenshot({ path: process.env.LOCAL_LOGOUT_SCREENSHOT });
      }

      // A failed request must keep the menu usable and allow a retry.
      await page.route("**/auth/sign-out", (route) => route.fulfill({ status: 503, contentType: "application/json", body: "{}" }), { times: 1 });
      await logout.click();
      await expect(page.getByText("No se pudo cerrar la sesión. Inténtalo de nuevo.")).toBeVisible();
      await expect(logout).toBeEnabled();
      await expect(page).toHaveURL("http://localhost:3000/compensatorios");
      if (keyboard) {
        await logout.focus();
        await page.keyboard.press("Enter");
      } else await logout.click();
      await expect(page).toHaveURL("http://localhost:3000/login");
      expect((await page.context().cookies()).filter((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"))).toHaveLength(0);
      // Refreshing a different session proves this button did not revoke all devices.
      expect((await otherSession.auth.refreshSession()).error).toBeNull();
      await page.goBack();
      await page.reload();
      await expect(page).toHaveURL("http://localhost:3000/login");
      await page.goto("/compensatorios");
      await expect(page).toHaveURL("http://localhost:3000/login");
      expect((await page.request.get("/api/calendar?start=2026-10-01&end=2026-11-01")).status()).toBe(401);
    } finally {
      await otherSession.auth.signOut({ scope: "local" });
      expect.soft((await admin.from("users").delete().eq("id", id)).error).toBeNull();
      expect.soft((await admin.auth.admin.deleteUser(id)).error).toBeNull();
    }
  });
}
