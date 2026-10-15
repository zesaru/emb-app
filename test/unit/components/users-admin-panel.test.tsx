import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ history: vi.fn(), update: vi.fn() }));
vi.mock("@/actions/admin/users/create-user", () => ({ default: vi.fn() }));
vi.mock("@/actions/admin/users/deactivate-user", () => ({ default: vi.fn() }));
vi.mock("@/actions/admin/users/list-users", () => ({ default: vi.fn() }));
vi.mock("@/actions/admin/users/reactivate-user", () => ({ default: vi.fn() }));
vi.mock("@/actions/admin/users/resend-user-invitation", () => ({ default: vi.fn() }));
vi.mock("@/actions/admin/users/send-password-reset-link", () => ({ default: vi.fn() }));
vi.mock("@/actions/admin/users/set-temporary-password", () => ({ default: vi.fn() }));
vi.mock("@/actions/admin/users/update-user", () => ({ default: vi.fn() }));
vi.mock("@/actions/admin/vacation-grants/issue-next-user-grant", () => ({ default: vi.fn() }));
vi.mock("@/actions/admin/vacation-grants/issue-user-grant", () => ({ default: vi.fn() }));
vi.mock("@/actions/admin/vacation-grants/list-user-grants", () => ({ default: mocks.history }));
vi.mock("@/actions/admin/vacation-grants/update-user-grant", () => ({ default: mocks.update }));
import { UsersAdminPanel } from "@/app/(dashboard)/(routes)/admin/users/_components/users-admin-panel";
import { normalizeUserRow } from "@/lib/users/user-mappers";
describe("gestión desde el directorio", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("traduce los tramos y reglas sin cambiar los valores del contrato de actualización", async () => {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    const user = normalizeUserRow({
      id: "person",
      name: "Persona",
      email: "persona@example.test",
      hire_date: "2013-03-06",
      grant_mode: "manual",
    });
    mocks.history.mockResolvedValue({
      success: true,
      data: [
        {
          id: "grant",
          granted_on: "2026-09-01",
          expires_on: "2028-09-01",
          days_granted: 20,
          days_remaining: 20,
          service_band: "6_years_6_months_plus",
          rule_type: "manual",
          notes: "Caso especial autorizado",
        },
      ],
    });
    mocks.update.mockResolvedValue({ success: false, error: "Respuesta de prueba" });
    render(
      <UsersAdminPanel
        initialUsers={[user]}
        initialError={null}
        isSuperAdmin
        businessDate="2026-10-15"
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Editar a Persona" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Gestionar asignaciones" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Editar" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    expect(screen.getByRole("option", { name: "6 años y 6 meses o más" })).toHaveValue(
      "6_years_6_months_plus",
    );
    expect(screen.getByRole("option", { name: "Manual" })).toHaveValue("manual");
    fireEvent.click(screen.getByRole("button", { name: /Guardar/ }));
    await waitFor(() =>
      expect(mocks.update).toHaveBeenCalledWith(
        expect.objectContaining({
          serviceBand: "6_years_6_months_plus",
          ruleType: "manual",
          daysRemaining: 20,
        }),
      ),
    );
  });
});
