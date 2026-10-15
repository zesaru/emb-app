import { expect, test } from "@playwright/test";
const history = [
  {
    id: "old",
    granted_on: "2026-04-01",
    expires_on: "2027-09-01",
    days_granted: 32,
    days_remaining: 25,
    rule_type: "manual",
    consumptions: [{ id: "consumed", days_used: 7, consumed_at: "2026-08-01T15:01:00Z" }],
    notes: "Caso especial autorizado por administración: acumulación superior a 40 días",
  },
  {
    id: "new",
    granted_on: "2026-09-01",
    expires_on: "2028-09-01",
    days_granted: 20,
    days_remaining: 20,
    rule_type: "manual",
    notes: "20 días nuevos",
  },
];
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-14T15:01:00Z") });
  await page.route("**/fixture-history?*", (route) => route.fulfill({ json: history }));
});
for (const width of [320, 390, 1280, 1536]) {
  test(`bolsas, detalle y foco sin desbordamiento a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const special =
      width >= 1280
        ? page.getByRole("row").filter({ hasText: "Persona Especial" })
        : page.getByRole("article", { name: "Persona Especial" });
    await expect(special.getByText("45 días", { exact: false })).toBeVisible();
    await expect(special.getByText("25 días vencen el 01/09/2027")).toBeVisible();
    await expect(special.getByText("20 días vencen el 01/09/2028")).toBeVisible();
    await expect(special.getByText("Revisar fecha manual")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true);
    const open = special.getByRole("button", { name: "Ver vacaciones de Persona Especial" });
    await open.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByText("32 días otorgados · 7 días utilizados o ajustados · 25 días restantes"),
    ).toBeVisible();
    await expect(dialog.getByText("7 días consumidos el 02/08/2026")).toBeVisible();
    await expect(
      dialog.getByText("Caso especial autorizado por administración", { exact: false }),
    ).toBeVisible();
    const box = (await dialog.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(open).toBeFocused();
    await page.screenshot({ path: `/tmp/emb-users-${width}.png`, fullPage: true });
  });
}

test("columnas alineadas, unidades y filtros combinados con orden", async ({ page }) => {
  await page.setViewportSize({ width: 1536, height: 1000 });
  await page.goto("/");
  const row = page.getByRole("row").filter({ hasText: "Ana Automática" });
  await expect(page.getByRole("columnheader")).toHaveText([
    "Usuario",
    "Cargo y rol",
    "Estado y acceso",
    "Vacaciones disponibles",
    "Asignación",
    "Compensatorios",
    "Acciones",
  ]);
  const cells = row.getByRole("cell");
  await expect(cells).toHaveCount(7);
  await expect(cells.nth(1)).toContainText("Sistemas");
  await expect(cells.nth(2)).toContainText("Activo");
  await expect(cells.nth(5)).toHaveText("0 h");
  await page.getByLabel("Asignación de vacaciones").selectOption("special");
  await expect(page.getByRole("status")).toHaveText("1 de 4 usuarios");
  await page.getByLabel("Buscar usuario").fill("[sin coincidencias]");
  await expect(page.getByText("No hay usuarios que coincidan")).toBeVisible();
  await page.getByRole("button", { name: "Restablecer filtros" }).click();
  await page.getByLabel("Ordenar por").selectOption("balance");
  await expect(page.getByRole("row").nth(1)).toContainText("Persona Especial");
  await page.getByRole("combobox", { name: "Revisión", exact: true }).selectOption("expiry");
  await expect(page.getByRole("status")).toHaveText("1 de 4 usuarios");
  await expect(row).toBeVisible();
  await page.getByRole("button", { name: "Restablecer filtros" }).click();
  await page.getByLabel("Asignación de vacaciones").selectOption("not-applicable");
  await expect(
    page.getByRole("row").filter({ hasText: "Diplomático" }).getByRole("cell").nth(4),
  ).toHaveText("No aplica");
});

test("error del historial permite reintentar sin parecer vacío", async ({ page }) => {
  let failed = true;
  await page.route("**/fixture-history?*", (route) =>
    failed ? route.fulfill({ status: 500 }) : route.fulfill({ json: history }),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Ver vacaciones de Persona Especial" }).last().click();
  await expect(page.getByRole("alert")).toContainText("No se pudo cargar el historial");
  await expect(page.getByText("No hay asignaciones registradas.")).not.toBeVisible();
  failed = false;
  await page.getByRole("button", { name: "Reintentar historial" }).click();
  await expect(
    page.getByText("32 días otorgados · 7 días utilizados o ajustados · 25 días restantes"),
  ).toBeVisible();
});

test("filtros móviles desplegables, cuenta inactiva y herramientas fuera de la tabla", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByText("Saldos y fechas al 15/10/2026 · Tokio")).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Estado", exact: true })).not.toBeVisible();
  await page.getByRole("button", { name: "Filtros y orden" }).click();
  await page.getByRole("combobox", { name: "Estado", exact: true }).selectOption("inactive");
  await expect(page.getByRole("article", { name: "Cuenta Inactiva" })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("1 de 4 usuarios");
  await expect(page.getByRole("button", { name: "Herramienta de prueba" })).not.toBeVisible();
  await page.getByText("Herramientas administrativas", { exact: true }).click();
  await expect(page.getByRole("button", { name: "Herramienta de prueba" })).toBeVisible();
});

test("el fallo del directorio no se presenta como una lista vacía", async ({ page }) => {
  await page.goto("/?error&empty");
  await expect(page.getByRole("alert")).toContainText("No se pudieron cargar los usuarios");
  await expect(page.getByText("No hay usuarios que coincidan")).not.toBeVisible();
  await expect(page.getByRole("status")).toContainText("No se pudo actualizar el directorio");
});
