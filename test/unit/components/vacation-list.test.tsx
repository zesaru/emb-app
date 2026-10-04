import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import ErrorPage from "@/app/(dashboard)/(routes)/vacaciones/error";
import { VacationFilters } from "@/app/(dashboard)/(routes)/vacaciones/_components/filters";
import { DataTable } from "@/app/(dashboard)/(routes)/vacaciones/_components/data-table";
const mocks = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => mocks, usePathname: () => "/vacaciones", useSearchParams: () => new URLSearchParams("user=Akiko&status=pending&page=3") }));
vi.mock("next/link", () => ({ default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a> }));
beforeEach(() => vi.clearAllMocks());

it("distingue errores de una tabla vacía y solicita datos nuevos al reintentar", () => {
  const reset = vi.fn(); render(<ErrorPage error={new Error("internal database details")} reset={reset} />);
  expect(screen.getByRole("alert")).toHaveTextContent("No se pudieron cargar las vacaciones");
  expect(screen.queryByText("No hay solicitudes de vacaciones")).not.toBeInTheDocument();
  expect(screen.queryByText("internal database details")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
  expect(mocks.refresh).toHaveBeenCalledOnce(); expect(reset).toHaveBeenCalledOnce();
});
it("los filtros restablecen la página y permiten limpiar todos los campos", () => {
  render(<VacationFilters />);
  expect(screen.getByRole("combobox", { name: "Estado" })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Usuario"), { target: { value: "Cesar" } });
  fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));
  expect(mocks.push).toHaveBeenCalledWith("/vacaciones?user=Cesar&status=pending");
  fireEvent.click(screen.getByRole("button", { name: "Limpiar" }));
  expect(mocks.push).toHaveBeenLastCalledWith("/vacaciones");
});
it("navega páginas conservando filtros y muestra el total de páginas del servidor", () => {
  render(<DataTable columns={[]} data={[]} page={2} pages={3} />);
  expect(screen.getByRole("status")).toHaveTextContent("Página 2 de 3");
  fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
  expect(mocks.push).toHaveBeenCalledWith("/vacaciones?user=Akiko&status=pending&page=3");
});
