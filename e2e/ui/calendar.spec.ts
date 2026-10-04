import { expect, test } from "@playwright/test";
import { buildCalendarEvents } from "../../lib/calendar/events";

for (const width of [320, 390, 768, 1280]) {
  test(`cabecera legible y navegación mensual a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.clock.install({ time: new Date("2026-10-03T15:30:00Z") });
    await page.route("**/api/calendar?*", route => route.fulfill({ json: [{
      id: "vacation-fixture", title: "🏖️ Persona de prueba", start: "2026-10-05", end: "2026-10-07",
      allDay: true, backgroundColor: "#10b981", borderColor: "#059669", extendedProps: { type: "vacation", personName: "Persona de prueba" },
    }] }));
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Calendario del equipo", level: 1 })).toBeVisible();
    const title = page.getByRole("heading", { level: 2, name: /de 2026/ });
    const controls = page.getByRole("group", { name: "Navegación del calendario" });
    await expect(title).toHaveText("octubre de 2026");
    await page.getByRole("button", { name: "Mes", exact: true }).tap();
    await expect(page.locator(".fc-event").first()).toBeVisible();
    const titleBox = (await title.boundingBox())!;
    const controlBox = (await controls.boundingBox())!;
    if (width < 640) expect(titleBox.y + titleBox.height).toBeLessThanOrEqual(controlBox.y);
    else expect(titleBox.x + titleBox.width).toBeLessThanOrEqual(controlBox.x);
    for (const button of await controls.getByRole("button").all()) {
      const box = (await button.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.getByRole("button", { name: "Mes siguiente" }).tap();
    await expect(title).toHaveText("noviembre de 2026");
    await page.getByRole("button", { name: "Mes anterior" }).tap();
    await expect(title).toHaveText("octubre de 2026");
    await page.getByRole("button", { name: "Mes anterior" }).tap();
    await expect(title).toHaveText("septiembre de 2026");
    await page.getByRole("button", { name: "Hoy", exact: true }).tap();
    await expect(title).toHaveText("octubre de 2026");
    if (width === 390) await page.screenshot({ path: "/tmp/emb-calendar-phase1-mobile.png", fullPage: true });
  });
}

for (const width of [320, 1280]) {
  test(`detalle completo, Escape, foco y teclado a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 700 });
    await page.route("**/api/calendar?*", route => route.fulfill({ json: [
      { id: "vacation", title: "🏖️ Persona con nombre muy largo para comprobar el detalle", start: "2026-09-30", end: "2026-10-03", allDay: true, extendedProps: { type: "vacation", personName: "Persona con nombre muy largo para comprobar el detalle" } },
      { id: "rest", title: "💼 Persona B: 2h", start: "2026-10-05T09:00:00", end: "2026-10-05T11:00:00", allDay: false, extendedProps: { type: "compensatory", personName: "Persona B", eventName: "Recepción de trabajo", compensatedHours: 2 } },
      { id: "work", title: "💼 Persona C: Trabajo adicional", start: "2026-10-06", allDay: true, extendedProps: { type: "compensatory", personName: "Persona C", eventName: "Traducción de documentos" } },
      { id: "single", title: "🏖️ Usuario", start: "2026-10-07", end: "2026-10-08", allDay: true, extendedProps: { type: "vacation" } },
    ] }));
    await page.goto("/");
    await page.getByRole("button", { name: "Mes", exact: true }).tap();
    const vacation = page.locator(".fc-event").filter({ hasText: "Persona con nombre muy largo" }).first();
    await vacation.tap();
    const dialog = page.getByRole("dialog", { name: "Detalle del evento" });
    await expect(dialog.getByText("Persona con nombre muy largo para comprobar el detalle", { exact: true })).toBeVisible();
    await expect(dialog.getByText("30/09/2026", { exact: true })).toBeVisible();
    await expect(dialog.getByText("02/10/2026", { exact: true })).toBeVisible();
    const box = (await dialog.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    const close = dialog.getByRole("button", { name: "Cerrar detalle" });
    // Radix's entry animation scales the dialog briefly; measure its settled size.
    await expect.poll(async () => Math.round((await close.boundingBox())!.width)).toBeGreaterThanOrEqual(44);
    if (width === 320) await page.screenshot({ path: "/tmp/emb-calendar-phase2-detail.png" });
    await page.keyboard.press("Tab");
    await expect(close).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(close).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(vacation).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Cerrar detalle" }).tap();
    await expect(vacation).toBeFocused();
    await page.keyboard.press("Space");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");

    await page.locator(".fc-event").filter({ hasText: "Persona B" }).tap();
    await expect(dialog.getByText("Descanso compensatorio", { exact: true })).toBeVisible();
    await expect(dialog.getByText("05/10/2026", { exact: true })).toBeVisible();
    await expect(dialog.getByText("09:00 – 11:00", { exact: true })).toBeVisible();
    await expect(dialog.getByText("2 h", { exact: true })).toBeVisible();
    await page.keyboard.press("Escape");

    await page.getByLabel("Ver detalle: 💼 Persona C: Trabajo adicional", { exact: true }).tap();
    await expect(dialog.getByText("Trabajo adicional", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Traducción de documentos", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Horario", { exact: true })).toHaveCount(0);
    await page.keyboard.press("Escape");

    await page.locator(".fc-event").filter({ hasText: "Usuario" }).tap();
    await expect(dialog.getByText("Usuario", { exact: true })).toBeVisible();
    await expect(dialog.getByText("07/10/2026", { exact: true })).toHaveCount(2);
  });
}

for (const width of [320, 390, 1280]) {
  test(`agenda con nombre completo, periodo estable y detalle a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const requests: string[] = [];
    await page.route("**/api/calendar?*", route => {
      requests.push(route.request().url());
      return route.fulfill({ json: [
        { id: "v", title: "🏖️ Persona con nombre completo de prueba", start: "2026-09-30", end: "2026-10-04", allDay: true, extendedProps: { type: "vacation", personName: "Persona con nombre completo de prueba" } },
        { id: "r", title: "💼 Personal B: 2h", start: "2026-10-01T09:00:00", end: "2026-10-01T11:00:00", allDay: false, extendedProps: { type: "compensatory", personName: "Personal B", compensatedHours: 2 } },
      ] });
    });
    await page.goto("/");
    const agendaButton = page.getByRole("button", { name: "Agenda", exact: true });
    const monthButton = page.getByRole("button", { name: "Mes", exact: true });
    await expect(width < 768 ? agendaButton : monthButton).toHaveAttribute("aria-pressed", "true");
    await agendaButton.tap();
    const agenda = page.getByRole("region", { name: "Agenda del mes" });
    await expect(agenda.getByRole("button")).toHaveCount(4);
    await expect(agenda.getByText("Persona con nombre completo de prueba", { exact: true })).toHaveCount(3);
    await expect(agenda.getByRole("heading", { name: "sábado, 3 de octubre", exact: true })).toBeVisible();
    await expect(agenda.getByRole("heading", { name: "domingo, 4 de octubre", exact: true })).toHaveCount(0);
    await expect(agenda.getByRole("heading", { name: "miércoles, 30 de septiembre", exact: true })).toHaveCount(0);
    await expect(agenda.getByText("Descanso compensatorio · 09:00 – 11:00")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await expect(page.locator(".fc-event").first()).not.toBeVisible();
    const card = agenda.getByRole("button", { name: "Ver detalle: 🏖️ Persona con nombre completo de prueba", exact: true }).first();
    await card.tap();
    await expect(page.getByRole("dialog").getByText("03/10/2026", { exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(card).toBeFocused();
    await monthButton.tap();
    await expect(page.locator(".fc-event").first()).toBeVisible();
    await agendaButton.tap();
    await expect(agenda).toBeVisible();
    expect(requests).toHaveLength(1);
    await page.getByRole("button", { name: "Mes siguiente" }).tap();
    await expect(page.getByRole("heading", { level: 2, name: /de 2026/ })).toHaveText("noviembre de 2026");
    await expect(agenda.getByText("No hay eventos en este mes.")).toBeVisible();
    await monthButton.tap();
    await agendaButton.tap();
    await expect(page.getByRole("heading", { level: 2, name: /de 2026/ })).toHaveText("noviembre de 2026");
    expect(requests).toHaveLength(2);
    await page.getByRole("button", { name: "Mes anterior" }).tap();
    await expect(agenda.getByRole("button")).toHaveCount(4);
    if (width === 390) await page.screenshot({ path: "/tmp/emb-calendar-phase3-agenda.png", fullPage: true });
  });
}

test("agenda distingue carga, error y vacío, y permite reintentar", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let release!: () => void;
  const hold = new Promise<void>(resolve => { release = resolve; });
  let attempts = 0;
  await page.route("**/api/calendar?*", async route => {
    if (++attempts === 1) { await hold; await route.fulfill({ status: 500, json: { error: "Fallo de prueba" } }); }
    else await route.fulfill({ json: [] });
  });
  await page.goto("/");
  await expect(page.getByRole("status", { name: "" }).filter({ hasText: "Cargando eventos del periodo" })).toBeVisible();
  await expect(page.getByText("No hay eventos en este mes.")).toHaveCount(0);
  release();
  await expect(page.getByRole("alert")).toContainText("No se pudo cargar el calendario");
  await expect(page.getByText("No hay eventos en este mes.")).toHaveCount(0);
  await page.getByRole("button", { name: "Reintentar", exact: true }).tap();
  await expect(page.getByText("No hay eventos en este mes.")).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

for (const width of [320, 390, 1280]) {
  test(`combina y limpia filtros en Mes y Agenda a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    let requests = 0;
    const fixtures = buildCalendarEvents(
      [{ id: "v", start: "2026-10-02", finish: "2026-10-05", user1: { name: "María López" } }],
      [
        { id: "r", compensated_hours_day: "2026-10-02", t_time_start: "09:00:00", t_time_finish: "11:00:00", compensated_hours: 2, user1: { name: "María López" } },
        { id: "w", event_date: "2026-10-03", event_name: "Recepción de prueba", user1: { name: "Personal B" } },
      ], { start: "2026-10-01", end: "2026-11-01" },
    );
    await page.route("**/api/calendar?*", route => { requests++; return route.fulfill({ json: fixtures }); });
    await page.goto("/");
    await page.getByText("Filtros", { exact: true }).click();
    const search = page.getByRole("searchbox", { name: "Buscar persona", exact: true });
    const kind = page.getByRole("combobox", { name: "Tipo de evento", exact: true });
    const weekends = page.getByRole("checkbox", { name: "Mostrar fines de semana", exact: true });
    const clear = page.getByRole("button", { name: "Limpiar filtros", exact: true });
    const agenda = page.getByRole("region", { name: "Agenda del mes" });
    await page.getByRole("button", { name: "Agenda", exact: true }).tap();
    await expect(agenda.getByRole("button")).toHaveCount(6);
    await expect(clear).toBeDisabled();
    await search.fill("MARIA");
    await expect(agenda.getByRole("button")).toHaveCount(5);
    await kind.selectOption("rest");
    await expect(agenda.getByRole("button")).toHaveCount(1);
    await expect(agenda.getByText("María López", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Mes", exact: true }).tap();
    await expect(page.locator(".fc-event:visible")).toHaveCount(1);
    await expect(page.locator(".fc-event:visible")).toContainText("2h");
    await search.fill("Personal B");
    await expect(page.locator(".fc-event:visible")).toHaveCount(0);
    await page.getByRole("button", { name: "Agenda", exact: true }).tap();
    await expect(agenda.getByText("No hay eventos con estos filtros.")).toBeVisible();
    await kind.selectOption("work");
    await expect(agenda.getByRole("button")).toHaveCount(1);
    await expect(agenda.getByText("Recepción de prueba", { exact: true })).toBeVisible();
    // Person/type filters operate only on the already authorized response.
    expect(requests).toBe(1);
    await weekends.uncheck();
    await expect(agenda.getByText("No hay eventos con estos filtros.")).toBeVisible();
    await clear.tap();
    await expect(search).toHaveValue("");
    await expect(kind).toHaveValue("all");
    await expect(weekends).toBeChecked();
    await expect(agenda.getByRole("button")).toHaveCount(6);
    await weekends.uncheck();
    await expect(agenda.getByRole("button")).toHaveCount(3);
    await expect(agenda.getByRole("heading", { name: "sábado, 3 de octubre", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Mes", exact: true }).tap();
    await expect(page.locator(".fc-col-header-cell")).toHaveCount(5);
    await weekends.check();
    await expect(page.locator(".fc-col-header-cell")).toHaveCount(7);
    await expect(page.locator(".fc-event:visible").filter({ hasText: "Recepción de prueba" })).toHaveCount(1);
    await kind.selectOption("vacation");
    await expect(page.locator(".fc-event:visible").filter({ hasText: "2h" })).toHaveCount(0);
    await expect(page.locator(".fc-event:visible").filter({ hasText: "María López" }).first()).toBeVisible();
    await clear.tap();
    await page.getByRole("button", { name: "Agenda", exact: true }).tap();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    if (width === 390) await page.screenshot({ path: "/tmp/emb-calendar-phase4-filters.png", fullPage: true, animations: "disabled" });
  });
}

for (const width of [320, 1280]) {
  test(`planificación mensual y hoy de Tokio a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.clock.install({ time: new Date("2026-10-03T15:30:00Z") });
    const events = buildCalendarEvents([
      { id: "a", start: "2026-09-30", finish: "2026-10-05", user1: { name: "Persona A" } },
      { id: "b", start: "2026-10-04", finish: "2026-10-05", user1: { name: "Persona B" } },
      { id: "outside", start: "2026-11-01", finish: "2026-11-02", user1: { name: "Fuera del mes" } },
    ], [
      { id: "rest", compensated_hours_day: "2026-10-06", compensated_hours: 2, t_time_start: "09:00", t_time_finish: "11:00", user1: { name: "Persona C" } },
      { id: "work", event_date: "2026-10-06", event_name: "Trabajo", user1: { name: "Persona D" } },
    ], { start: "2026-09-28", end: "2026-11-09" });
    await page.route("**/api/calendar?*", route => route.fulfill({ json: events }));
    await page.goto("/");
    const summary = page.getByRole("region", { name: "Planificación del mes" });
    const counts = page.getByRole("region", { name: "Registros del mes" });
    await expect(summary).toBeVisible();
    await expect(counts.getByText("Vacaciones del mes").locator("..")).toContainText("2");
    await expect(counts.getByText("Descansos del mes").locator("..")).toContainText("1");
    const today = summary.getByRole("heading", { name: "Hoy · Tokio" }).locator("..");
    await expect(today.getByRole("button")).toHaveCount(2);
    const next = summary.getByRole("heading", { name: "Próximos inicios del mes" }).locator("..");
    await expect(next.getByRole("button")).toHaveCount(1);
    await expect(next).toContainText("Persona C");
    await expect(summary).not.toContainText("Fuera del mes");
    await today.getByRole("button").first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(today.getByRole("button").first()).toBeFocused();
    await page.getByText("Filtros", { exact: true }).click();
    await page.getByRole("checkbox", { name: "Mostrar fines de semana" }).uncheck();
    await expect(today).toContainText("Hoy está fuera del mes o de los días visibles.");
    await page.getByRole("searchbox", { name: "Buscar persona" }).fill("Persona C");
    await expect(counts.getByText("Vacaciones del mes").locator("..")).toContainText("0");
    await page.getByRole("button", { name: "Limpiar filtros" }).click();
    await page.getByRole("button", { name: "Mes siguiente" }).click();
    await expect(today).toContainText("Hoy está fuera del mes o de los días visibles.");
    await expect(counts.getByText("Vacaciones del mes").locator("..")).toContainText("1");
    await page.getByRole("button", { name: "Mes anterior" }).click();
    await expect(today.getByRole("button")).toHaveCount(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    if (width === 320) await summary.screenshot({ path: "/tmp/emb-calendar-phase5-planning.png", animations: "disabled" });
  });
}

test("actualiza hoy al cruzar medianoche de Tokio sin recargar", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-04T14:59:30Z") });
  const events = buildCalendarEvents([
    { id: "today", start: "2026-10-04", finish: "2026-10-04", user1: { name: "Domingo" } },
    { id: "tomorrow", start: "2026-10-05", finish: "2026-10-05", user1: { name: "Lunes" } },
  ], [], { start: "2026-09-28", end: "2026-11-09" });
  await page.route("**/api/calendar?*", route => route.fulfill({ json: events }));
  await page.goto("/");
  const today = page.getByRole("region", { name: "Planificación del mes" }).getByRole("heading", { name: "Hoy · Tokio" }).locator("..");
  await expect(today).toContainText("Domingo");
  await page.clock.runFor(65_000);
  await expect(today).toContainText("Lunes");
  await expect(today).not.toContainText("Domingo");
});
