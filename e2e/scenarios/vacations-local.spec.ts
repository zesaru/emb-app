import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { writeFileSync, unlinkSync, existsSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { vacationToday } from "../../lib/vacations/dates";

test("pagina vacaciones, conserva totales y permisos y recupera un fallo de consulta", async ({ page, browser }) => {
  test.skip(process.env.RUN_LOCAL_VACATION_E2E !== "1", "Usar pnpm test:vacations:local");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  expect(url).toMatch(/^http:\/\/(localhost|127\.0\.0\.1):/);
  const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const ids: string[] = [], suffix = randomUUID(), password = `Test-${randomUUID()}!`;
  const failFile = join(process.env.LOCAL_VACATION_ARTIFACTS!, "fail-vacations");
  const accounts = [
    { email: `vac-admin-${suffix}@example.test`, name: `Vacaciones ${suffix}`, admin: "admin", is_active: true, is_diplomatic: false },
    { email: `vac-staff-${suffix}@example.test`, name: `Vacaciones ${suffix} %_\", Otro`, admin: null, is_active: true, is_diplomatic: false },
    { email: `vac-inactive-${suffix}@example.test`, name: `Vacaciones ${suffix} inactivo`, admin: null, is_active: false, is_diplomatic: false },
    { email: `vac-diplomat-${suffix}@example.test`, name: `Vacaciones ${suffix} diplomático`, admin: null, is_active: true, is_diplomatic: true },
  ];
  const today = vacationToday();
  async function login(target: Page, email: string) {
    await target.goto("/login");
    await target.getByLabel("Email", { exact: true }).fill(email);
    await target.getByLabel("Contraseña", { exact: true }).fill(password);
    await target.getByRole("button", { name: "Ingresar", exact: true }).click();
    await expect(target).toHaveURL("http://localhost:3000/");
  }
  try {
    for (const account of accounts) {
      const result = await test.step("Crear cuenta temporal", () => admin.auth.admin.createUser({ email: account.email, password, email_confirm: true }));
      expect(result.error).toBeNull(); ids.push(result.data.user!.id);
      appendFileSync(join(process.env.LOCAL_VACATION_ARTIFACTS!, "fixture-ids"), `${result.data.user!.id}\n`, { mode: 0o600 });
      expect((await admin.from("users").update({ ...account, provisioning_status: "ready", invitation_status: "accepted" }).eq("id", result.data.user!.id)).error).toBeNull();
    }
    const rows = ids.flatMap((id, owner) => Array.from({ length: owner === 0 ? 26 : 1 }, () => ({
      id_user: id, request_date: today, start: today, finish: today, days: 1, approve_request: true,
    })));
    expect((await admin.from("vacations").insert(rows)).error).toBeNull();
    expect((await admin.from("vacations").insert({ id_user: ids[1], request_date: today, start: today, finish: today, days: 1, approve_request: null })).error).toBeNull();
    await test.step("Ingresar como administrador", () => login(page, accounts[0].email));
    await test.step("Abrir vacaciones filtradas", () => page.goto(`/vacaciones?user=${encodeURIComponent(suffix)}`));
    await expect(page.getByText("28 solicitudes encontradas", { exact: true })).toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(25);
    const days = page.getByText(/^Días Aprobados \(/).locator("..");
    await expect(days).toContainText("27 días");
    await expect(page.getByText("Vacaciones Activas", { exact: true }).locator("..")).toContainText("27");
    await page.getByRole("button", { name: "Siguiente", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Página" })).toHaveText("Página 2 de 2");
    await expect(page.locator("tbody tr")).toHaveCount(3);
    await expect(days).toContainText("27 días");
    await expect(page.locator("tbody")).not.toContainText("inactivo");
    await expect(page.locator("tbody")).not.toContainText("diplomático");
    await expect(page.locator("tbody")).toContainText(`${today.slice(8)}/${today.slice(5,7)}/${today.slice(0,4)}`);
    if (process.env.LOCAL_VACATION_SCREENSHOT) await page.locator("main").screenshot({ path: process.env.LOCAL_VACATION_SCREENSHOT, caret: "initial" });
    await page.getByLabel("Usuario", { exact: true }).fill(accounts[1].name);
    await page.getByRole("button", { name: "Aplicar filtros" }).click();
    await expect(page.getByText("2 solicitudes encontradas", { exact: true })).toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(2);
    await page.getByLabel("Estado", { exact: true }).selectOption("pending");
    await page.getByRole("button", { name: "Aplicar filtros" }).click();
    await expect(page.getByText("1 solicitudes encontradas", { exact: true })).toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(1);
    await expect(page.locator("tbody")).toContainText("Pendiente");
    await page.getByLabel("Usuario", { exact: true }).fill(`sin-resultados-${suffix}`);
    await page.getByRole("button", { name: "Aplicar filtros" }).click();
    await expect(page.getByText("0 solicitudes encontradas", { exact: true })).toBeVisible();
    await expect(page.getByText("No hay solicitudes de vacaciones", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Limpiar", exact: true }).click();
    await expect(page).toHaveURL("http://localhost:3000/vacaciones");

    // Only the isolated server transport fails. No database schema or shared data is changed.
    writeFileSync(failFile, "fail", { mode: 0o600 });
    await page.reload();
    const errorAlert = page.getByRole("alert").filter({ hasText: "No se pudieron cargar las vacaciones" });
    await expect(errorAlert).toBeVisible();
    await expect(page.getByText("No hay solicitudes de vacaciones", { exact: true })).toHaveCount(0);
    unlinkSync(failFile);
    await page.getByRole("button", { name: "Reintentar", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Personal administrativo activo" })).toBeVisible();
    await expect(errorAlert).toHaveCount(0);

    const context = await browser.newContext({ timezoneId: "America/Los_Angeles" });
    try {
      const staff = await context.newPage(); await login(staff, accounts[1].email);
      await staff.goto("/vacaciones");
      await expect(staff.getByText("2 solicitudes encontradas", { exact: true })).toBeVisible();
      await expect(staff.locator("tbody tr")).toHaveCount(2);
      await staff.goto(`/vacaciones?user=${encodeURIComponent(accounts[0].email)}&page=999`);
      await expect(staff.getByText("0 solicitudes encontradas", { exact: true })).toBeVisible();
    } finally { await context.close(); }
  } finally {
    if (existsSync(failFile)) unlinkSync(failFile);
    if (ids.length) expect.soft((await admin.from("vacations").delete().in("id_user", ids)).error).toBeNull();
    for (const id of ids) {
      expect.soft((await admin.from("users").delete().eq("id", id)).error).toBeNull();
      expect.soft((await admin.auth.admin.deleteUser(id)).error).toBeNull();
    }
  }
});
