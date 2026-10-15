import { test, expect } from "@playwright/test";
import { individual, report } from "../fixtures/report-ui/data";

test.beforeEach(async ({ page }) => {
  await page.route("**/fixture-report", async (route) => {
    const body = route.request().postDataJSON();
    const result = body.userId
      ? { ...individual(body.userId), period: body.period }
      : { ...report, period: body.period };
    await route.fulfill({ json: result });
  });
  await page.goto("/");
});
for (const width of [320, 390, 1280, 1536]) {
  test(`resumen legible a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await expect(page.getByRole("heading", { name: "Reportes del equipo" })).toBeVisible();
    const desktop = width >= 1280;
    const container = page.locator(desktop ? ".report-desktop" : ".report-mobile");
    await expect(container.getByText("Persona Especial", { exact: true })).toBeVisible();
    await expect(container.getByText("45 días", { exact: true })).toBeVisible();
    await expect(container.getByText("25 días · 01/09/2027", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (width === 390 || width === 1536)
      await page.screenshot({ path: `/private/tmp/emb-report-${width}.png`, fullPage: true });
  });
}
test("filtra activos, inactivos, búsquedas y días por vencer", async ({ page }) => {
  await page.setViewportSize({ width: 1536, height: 1000 });
  await page.getByRole("checkbox", { name: "Con días por vencer" }).check();
  await expect(page.locator(".report-desktop").getByText("Ana Automática")).toBeVisible();
  await expect(page.locator(".report-desktop").getByText("Persona Especial")).toHaveCount(0);
  await page.getByRole("checkbox", { name: "Con días por vencer" }).uncheck();
  await page.getByRole("combobox", { name: "Estado del colaborador" }).selectOption("inactive");
  await expect(page.locator(".report-desktop").getByText("Cuenta Inactiva")).toBeVisible();
  await page.getByRole("searchbox", { name: "Buscar colaborador" }).fill("inexistente");
  await expect(page.getByText("No hay colaboradores que coincidan con los filtros.")).toBeVisible();
});
test("informe individual distingue estados, saldo, vencimientos y todos los registros al imprimir", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1536, height: 1000 });
  await page
    .locator(".report-desktop")
    .getByRole("button", { name: "Ver informe de Persona Especial" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Días disponibles y vencimientos" }),
  ).toBeVisible();
  await expect(page.getByText("25 días", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("20 días", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Disfrutada", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Programada", { exact: true })).toBeVisible();
  await expect(page.getByText("Pendiente", { exact: true })).toBeVisible();
  await expect(page.getByText("Cancelada", { exact: true })).toBeVisible();
  await expect(page.getByText("internal:marker")).toHaveCount(0);
  await expect(page.getByText("Página 1 de 2")).toBeVisible();
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await expect(page.getByText("Página 2 de 2")).toBeVisible();
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("[data-dashboard-chrome]")).toBeHidden();
  await expect(page.locator(".report-history tbody tr:visible")).toHaveCount(28);
  await expect(page.getByRole("button", { name: "Imprimir / Guardar PDF" })).toBeHidden();
  await page.pdf({
    path: "/private/tmp/emb-report-individual.pdf",
    format: "A4",
    printBackground: true,
  });
});
test("maneja errores de detalle con reintento y nunca imprime datos incompletos", async ({
  page,
}) => {
  let failures = 1;
  await page.route("**/fixture-report", async (route) => {
    if (failures-- > 0) return route.fulfill({ status: 500 });
    return route.fulfill({ json: individual(route.request().postDataJSON().userId) });
  });
  await page.getByRole("tab", { name: "Informe individual" }).click();
  await page.getByRole("combobox", { name: "Seleccionar colaborador" }).selectOption("special");
  await expect(page.getByRole("alert")).toContainText("No se pudo cargar");
  await expect(page.getByRole("button", { name: "Imprimir / Guardar PDF" })).toBeDisabled();
  await page.getByRole("button", { name: "Reintentar informe" }).click();
  await expect(
    page.getByRole("heading", { name: "Días disponibles y vencimientos" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Imprimir / Guardar PDF" })).toBeEnabled();
});
test("actualiza el período y muestra errores de lectura sin presentar cero registros", async ({
  page,
}) => {
  await page.getByLabel("Historial desde").fill("2025-01-01");
  await page.getByRole("button", { name: "Actualizar reporte" }).click();
  await expect(page.getByText("Historial: 01/01/2025 – 31/12/2026")).toBeVisible();
  await page.route("**/fixture-report", (route) => route.fulfill({ status: 500 }));
  await page.getByRole("button", { name: "Actualizar reporte" }).click();
  await expect(page.getByRole("alert")).toContainText("datos anteriores siguen visibles");
  await expect(page.getByRole("button", { name: "Imprimir / Guardar PDF" })).toBeDisabled();
});
test("muestra No aplica en diplomáticos y cambia de persona sin conservar el saldo anterior", async ({
  page,
}) => {
  await page.getByRole("tab", { name: "Informe individual" }).click();
  await page.getByRole("combobox", { name: "Seleccionar colaborador" }).selectOption("special");
  await expect(page.getByRole("heading", { name: "Persona Especial", exact: true })).toBeVisible();
  await page.getByRole("combobox", { name: "Seleccionar colaborador" }).selectOption("diplomat");
  await expect(page.getByRole("heading", { name: "Diego Diplomático", exact: true })).toBeVisible();
  await expect(page.getByText("45 días", { exact: true })).toHaveCount(0);
  await expect(page.getByText("No aplica", { exact: true }).first()).toBeVisible();
});
