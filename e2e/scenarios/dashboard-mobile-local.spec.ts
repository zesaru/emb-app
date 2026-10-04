import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { appendFileSync } from "node:fs";
import { join } from "node:path";
import { vacationToday } from "../../lib/vacations/dates";

test("el calendario muestra descansos válidos y el inicio móvil permite aprobar las solicitudes", async ({ page }) => {
  test.skip(process.env.RUN_LOCAL_DASHBOARD_E2E !== "1", "Usar pnpm test:dashboard:local");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  expect(url).toMatch(/^http:\/\/(localhost|127\.0\.0\.1):/);
  const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const suffix = randomUUID(), password = `Test-${randomUUID()}!`, ids: string[] = [];
  const email = `dashboard-admin-${suffix}@example.test`;
  const today = vacationToday();
  try {
    for (const index of [0, 1]) {
      const address = index === 0 ? email : `dashboard-staff-${suffix}@example.test`;
      const created = await admin.auth.admin.createUser({ email: address, password, email_confirm: true });
      expect(created.error).toBeNull(); ids.push(created.data.user!.id);
      appendFileSync(join(process.env.LOCAL_DASHBOARD_ARTIFACTS!, "fixture-ids"), `${created.data.user!.id}\n`, { mode: 0o600 });
      expect((await admin.from("users").update({ name: index === 0 ? "Administrador móvil" : "Personal de prueba",
        admin: index === 0 ? "admin" : null, role: "user", is_active: true, is_diplomatic: false,
        num_vacations: 5, num_compensatorys: 5, provisioning_status: "ready", invitation_status: "accepted",
      }).eq("id", ids[index])).error).toBeNull();
    }
    const events = await admin.from("compensatorys").insert([
      { user_id: ids[1], event_name: "Recepción de prueba", event_date: today, hours: 3, approve_request: null },
      { user_id: ids[1], event_name: null, compensated_hours_day: today, compensated_hours: 2, t_time_start: "10:00", t_time_finish: "12:00", final_approve_request: null },
      { user_id: ids[1], event_name: null, compensated_hours_day: today, compensated_hours: 1, t_time_start: "13:00", t_time_finish: "14:00", cancelled_at: new Date().toISOString() },
      { user_id: ids[1], event_name: "Trabajo cancelado", event_date: today, hours: 1, cancelled_at: new Date().toISOString() },
    ]).select("id,event_name,cancelled_at");
    expect(events.error).toBeNull();
    const vacation = await admin.from("vacations").insert({ id_user: ids[1], request_date: today, start: today, finish: today, days: 1, approve_request: null }).select("id").single();
    expect(vacation.error).toBeNull();
    await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Contraseña", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Ingresar", exact: true }).click();
    await expect(page).toHaveURL("http://localhost:3000/");
    const monthStart = `${today.slice(0, 7)}-01`;
    const nextMonth = new Date(`${monthStart}T00:00:00Z`);
    nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
    const response = await page.request.get(`/api/calendar?start=${monthStart}&end=${nextMonth.toISOString().slice(0, 10)}`);
    expect(response.status()).toBe(200);
    const calendarEvents = await response.json();
    const rest = events.data!.find(event => !event.event_name && !event.cancelled_at)!;
    expect(calendarEvents.find((event: { id: string }) => event.id === `compensatory-${rest.id}`)).toMatchObject({
      allDay: false, start: `${today}T10:00:00`, end: `${today}T12:00:00`, extendedProps: { compensatedHours: 2 },
    });
    for (const cancelled of events.data!.filter(event => event.cancelled_at)) {
      expect(calendarEvents.some((event: { id: string }) => event.id === `compensatory-${cancelled.id}`)).toBe(false);
    }
    await page.goto("/calendar");
    await page.getByText("Filtros", { exact: true }).click();
    await page.getByRole("searchbox", { name: "Buscar persona" }).fill("Personal de prueba");
    await page.getByRole("combobox", { name: "Tipo de evento" }).selectOption("rest");
    const agenda = page.getByRole("region", { name: "Agenda del mes" });
    await expect(agenda.getByRole("button")).toHaveCount(1);
    await expect(agenda).toContainText("10:00 – 12:00");
    await expect(page.getByText("Descansos del mes").locator("..")).toContainText("1");
    await agenda.getByRole("button").click();
    await expect(page.getByRole("dialog")).toContainText("2 h");
    await page.getByRole("button", { name: "Cerrar detalle" }).click();
    await page.getByRole("button", { name: "Mes", exact: true }).click();
    await expect(page.locator(".fc-event:visible")).toHaveCount(1);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Aprobaciones pendientes" })).toBeVisible();
    const queues = ["Compensatorios por aprobar", "Descansos por aprobar", "Vacaciones por aprobar"];
    for (const name of queues) await expect(page.getByRole("region", { name }).locator("li").filter({ hasText: "Personal de prueba" }).getByRole("button", { name: "Aprobar", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    // Capture only the header and the fictional compensatory request; other local rows may contain personal data.
    if (process.env.LOCAL_DASHBOARD_SCREENSHOT) await page.screenshot({ path: process.env.LOCAL_DASHBOARD_SCREENSHOT, clip: { x: 0, y: 0, width: 390, height: 700 } });
    for (const name of queues) {
      const card = page.getByRole("region", { name }).locator("li").filter({ hasText: "Personal de prueba" });
      await card.getByRole("button", { name: "Aprobar", exact: true }).click();
      await expect(card).toHaveCount(0);
    }
    expect((await admin.from("compensatorys").select("approve_request").eq("id", events.data!.find((event) => event.event_name)!.id).single()).data?.approve_request).toBe(true);
    expect((await admin.from("compensatorys").select("final_approve_request").eq("id", events.data!.find((event) => !event.event_name)!.id).single()).data?.final_approve_request).toBe(true);
    expect((await admin.from("vacations").select("approve_request").eq("id", vacation.data!.id).single()).data?.approve_request).toBe(true);
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(page.getByRole("heading", { name: "Aprobar solicitudes de vacaciones" })).toBeVisible();
  } finally {
    if (ids.length) {
      expect.soft((await admin.from("compensatorys").delete().in("user_id", ids)).error).toBeNull();
      expect.soft((await admin.from("vacations").delete().in("id_user", ids)).error).toBeNull();
      expect.soft((await admin.from("dev_email_outbox").delete().in("triggered_by_user_id", ids)).error).toBeNull();
      expect.soft((await admin.from("users").delete().in("id", ids)).error).toBeNull();
      for (const id of ids) expect.soft((await admin.auth.admin.deleteUser(id)).error).toBeNull();
    }
  }
});
