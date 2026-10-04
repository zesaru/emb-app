import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CompensatorysWithUser, VacationsWithUser } from "@/types/collections";

const { refresh, approveVacation, success, error } = vi.hoisted(() => ({
  refresh: vi.fn(), approveVacation: vi.fn(), success: vi.fn(), error: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("sonner", () => ({ toast: { success, error } }));
vi.mock("@/actions/updateVacations", () => ({ default: approveVacation }));
vi.mock("@/actions/admin-cancel-compensatorio", () => ({ default: vi.fn() }));

import { CompensatoryRequestActions } from "@/app/(dashboard)/_components/data-table-row-actions";
import { CompensatoryRestActions } from "@/app/(dashboard)/_components/data-table-row-actions-hours";
import { VacationRequestActions } from "@/app/(dashboard)/_components/data-table-row-actions-vacations";

const compensatory = { id: "request", user_id: "owner", hours: 3, email: "owner@example.test" } as unknown as CompensatorysWithUser;
const vacation = { id: "vacation", user_id: "owner", days: 2, email: "owner@example.test", num_vacations: 5 } as unknown as VacationsWithUser;

describe("Acciones compartidas de aprobación del dashboard", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.unstubAllGlobals());

  it.each([
    [CompensatoryRequestActions, "/api/compensatorys/approve"],
    [CompensatoryRestActions, "/api/compensatorys/approve-hour"],
  ] as const)("aprueba mediante el endpoint existente y actualiza las colas", async (Actions, endpoint) => {
    const fetch = vi.fn().mockResolvedValue({ json: async () => ({ success: true }) });
    vi.stubGlobal("fetch", fetch);
    render(<Actions request={compensatory} />);
    fireEvent.click(screen.getByRole("button", { name: "Aprobar" }));
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(fetch).toHaveBeenCalledWith(endpoint, expect.objectContaining({ method: "POST" }));
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({ id: "request", user_id: "owner", email: "owner@example.test" });
    expect(success).toHaveBeenCalled();
  });

  it("reutiliza la acción atómica de vacaciones con los campos del RPC", async () => {
    approveVacation.mockResolvedValue({ success: true });
    render(<VacationRequestActions request={vacation} />);
    fireEvent.click(screen.getByRole("button", { name: "Aprobar" }));
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(approveVacation).toHaveBeenCalledWith({ id: "vacation", user_id: "owner", days: 2, email: "owner@example.test", num_vacations: 5 });
  });

  it("permite reintentar un error de vacaciones sin perder la solicitud", async () => {
    approveVacation.mockRejectedValue(new Error("private server details"));
    render(<VacationRequestActions request={vacation} />);
    fireEvent.click(screen.getByRole("button", { name: "Aprobar" }));
    await waitFor(() => expect(error).toHaveBeenCalledWith("No se pudo aprobar la solicitud. Intenta nuevamente."));
    expect(refresh).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Aprobar" })).toBeEnabled();
  });
});
