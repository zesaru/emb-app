import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CompensatorysWithUser, VacationsWithUser } from "@/types/collections";
import { MobileApprovalQueues } from "@/app/(dashboard)/_components/mobile-approval-queues";

vi.mock("next/link", () => ({ default: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a> }));
vi.mock("@/app/(dashboard)/_components/data-table-row-actions", () => ({
  CompensatoryRequestActions: ({ request }: { request: { id: string } }) => <button data-request={request.id}>Aprobar compensatorio</button>,
}));
vi.mock("@/app/(dashboard)/_components/data-table-row-actions-hours", () => ({
  CompensatoryRestActions: ({ request }: { request: { id: string } }) => <button data-request={request.id}>Aprobar descanso</button>,
}));
vi.mock("@/app/(dashboard)/_components/data-table-row-actions-vacations", () => ({
  VacationRequestActions: ({ request }: { request: { id: string } }) => <button data-request={request.id}>Aprobar vacaciones</button>,
}));

describe("Bandeja de aprobaciones móvil", () => {
  it("muestra las tres colas, sus detalles y la acción de cada solicitud", () => {
    render(<MobileApprovalQueues
      compensatorys={[{ id: "c1", user_id: "u1", user_name: "Persona A", event_name: "Recepción", event_date: "2026-10-03", hours: 3 } as unknown as CompensatorysWithUser]}
      rests={[{ id: "r1", user_id: "u2", user_name: "Persona B", compensated_hours_day: "2026-10-04", compensated_hours: 2, t_time_start: "10:00", t_time_finish: "12:00" } as unknown as CompensatorysWithUser]}
      vacations={[{ id: "v1", user_id: "u3", user_name: "Persona C", start: "2026-10-05", finish: "2026-10-06", days: 2 } as unknown as VacationsWithUser]}
    />);
    const hours = screen.getByRole("region", { name: "Compensatorios por aprobar" });
    expect(within(hours).getByText("Recepción")).toBeVisible();
    expect(within(hours).getByText("03/10/2026")).toBeVisible();
    expect(within(hours).getByRole("button")).toHaveAttribute("data-request", "c1");
    expect(within(hours).getByRole("link", { name: "Ver historial de Persona A" })).toHaveAttribute("href", "/compensatorios/u1");
    const rests = screen.getByRole("region", { name: "Descansos por aprobar" });
    expect(within(rests).getByText("10:00 – 12:00")).toBeVisible();
    expect(within(rests).getByRole("button")).toHaveAttribute("data-request", "r1");
    const vacations = screen.getByRole("region", { name: "Vacaciones por aprobar" });
    expect(within(vacations).getByText("05/10/2026 – 06/10/2026")).toBeVisible();
    expect(within(vacations).getByRole("button")).toHaveAttribute("data-request", "v1");
    expect(within(vacations).getByRole("link")).toHaveAttribute("href", "/vacaciones/u3");
  });

  it("explica que no hay pendientes y no ofrece acciones vacías", () => {
    render(<MobileApprovalQueues compensatorys={[]} rests={[]} vacations={[]} />);
    expect(screen.getByText("No tienes solicitudes pendientes de aprobación.")).toBeVisible();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
