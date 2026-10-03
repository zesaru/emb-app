import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import DashboardLoading from "@/app/(dashboard)/(routes)/loading";
import HomeLoading from "@/app/(dashboard)/(routes)/(root)/loading";
import CompensatoryLoading from "@/app/(dashboard)/(routes)/compensatorios/loading";
import VacationLoading from "@/app/(dashboard)/(routes)/vacaciones/loading";
import ReportLoading from "@/app/(dashboard)/(routes)/report/loading";
import UsersLoading from "@/app/(dashboard)/(routes)/admin/users/loading";
import CalendarLoading from "@/app/(dashboard)/(routes)/calendar/loading";

afterEach(cleanup);

describe("estados de carga de las rutas", () => {
  it.each([
    [DashboardLoading, "Cargando pantalla…"], [HomeLoading, "Cargando inicio…"],
    [CompensatoryLoading, "Cargando compensatorios…"], [VacationLoading, "Cargando vacaciones…"],
    [ReportLoading, "Cargando reportes…"], [UsersLoading, "Cargando usuarios…"],
    [CalendarLoading, "Cargando calendario…"],
  ])("anuncia la carga de %s sin presentar resultados ni controles ficticios", (Loading, message) => {
    const { container } = render(<Loading />);
    expect(screen.getByRole("status")).toHaveTextContent(message);
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("table")).toBeNull();
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/0 registros|No hay registros|Sin datos/);
    expect(container.querySelector(".motion-safe\\:animate-pulse")).toBeInTheDocument();
  });
});
