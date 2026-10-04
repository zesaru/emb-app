import React from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import Calendar from "@/app/(dashboard)/(routes)/calendar/_components/calendar";
const mocks = vi.hoisted(() => ({ props: {} as any }));
vi.mock("next/dynamic", () => ({ default: () => (props: any) => { mocks.props = props; return <div />; } }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
function range(start: string, end: string) { return { startStr: start, endStr: end }; }
const event = (title: string) => ({ id: title, title, start: "2026-10-03", allDay: true, extendedProps: { type: "vacation" } });

it("elige agenda en móvil y no cambia el periodo ni consulta otra vez al alternar vistas", async () => {
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [{ ...event("Prueba"), extendedProps: { type: "vacation", personName: "Persona de prueba" } }] });
  vi.stubGlobal("fetch", fetchMock);
  render(<Calendar initialDate="2026-10-03" />);
  const calendar = { updateSize: vi.fn() };
  act(() => mocks.props.datesSet({ view: { calendar, title: "octubre de 2026", currentStart: new Date("2026-10-01T00:00:00Z"), currentEnd: new Date("2026-11-01T00:00:00Z") } }));
  await act(async () => { await mocks.props.events(range("2026-09-28", "2026-11-07")); });
  expect(screen.getByRole("button", { name: "Agenda" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("region", { name: "Agenda del mes" })).toHaveTextContent("Persona de prueba");
  fireEvent.click(screen.getByRole("button", { name: "Mes" }));
  fireEvent.click(screen.getByRole("button", { name: "Agenda" }));
  expect(screen.getByRole("heading", { name: "octubre de 2026" })).toBeVisible();
  expect(fetchMock).toHaveBeenCalledOnce();
});

it("abre la ficha de vacaciones con el último día inclusivo y el nombre completo", async () => {
  const vacation = { ...event("🏖️ Persona de prueba con nombre largo"), start: "2026-09-30", end: "2026-10-03", extendedProps: { type: "vacation", personName: "Persona de prueba con nombre largo" } };
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [vacation] }));
  render(<Calendar initialDate="2026-10-03" />);
  await act(async () => { await mocks.props.events(range("2026-09-28", "2026-11-07")); });
  act(() => mocks.props.eventClick({ event: { id: vacation.id }, el: document.createElement("a") }));
  const dialog = screen.getByRole("dialog", { name: "Detalle del evento" });
  expect(within(dialog).getByText("Persona de prueba con nombre largo")).toBeVisible();
  expect(within(dialog).getByText("Vacaciones")).toBeVisible();
  expect(within(dialog).getByText("30/09/2026")).toBeVisible();
  expect(within(dialog).getByText("02/10/2026")).toBeVisible();
  expect(within(dialog).queryByText("03/10/2026")).not.toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole("button", { name: "Cerrar detalle" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("identifica el calendario del equipo y desactiva la navegación hasta que está listo", () => {
  render(<Calendar initialDate="2026-10-03" />);
  expect(screen.getByRole("heading", { name: "Calendario del equipo", level: 1 })).toBeVisible();
  expect(screen.getByRole("button", { name: "Mes anterior" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Mes siguiente" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Hoy" })).toBeDisabled();
});

it("navega con la API del calendario y actualiza el título al cambiar de periodo", () => {
  render(<Calendar initialDate="2026-10-03" />);
  const calendar = { prev: vi.fn(), next: vi.fn(), today: vi.fn() };
  act(() => mocks.props.datesSet({ view: { calendar, title: "octubre de 2026", currentStart: new Date("2026-10-01T00:00:00Z"), currentEnd: new Date("2026-11-01T00:00:00Z") } }));
  expect(screen.getByRole("heading", { name: "octubre de 2026", level: 2 })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Mes anterior" }));
  fireEvent.click(screen.getByRole("button", { name: "Mes siguiente" }));
  fireEvent.click(screen.getByRole("button", { name: "Hoy" }));
  expect(calendar.prev).toHaveBeenCalledOnce();
  expect(calendar.next).toHaveBeenCalledOnce();
  expect(calendar.today).toHaveBeenCalledOnce();
  act(() => mocks.props.datesSet({ view: { calendar, title: "noviembre de 2026", currentStart: new Date("2026-11-01T00:00:00Z"), currentEnd: new Date("2026-12-01T00:00:00Z") } }));
  expect(screen.getByRole("heading", { name: "noviembre de 2026", level: 2 })).toBeVisible();
  expect(screen.queryByRole("heading", { name: "octubre de 2026" })).not.toBeInTheDocument();
});

it("comparte solicitudes simultáneas del mismo periodo, sin guardar respuestas finalizadas", async () => {
  let resolve!: (value: unknown) => void;
  const fetchMock = vi.fn(() => new Promise(r => { resolve = r; }));
  vi.stubGlobal("fetch", fetchMock);
  render(<Calendar initialDate="2026-10-03" />);
  let first!: Promise<unknown>, second!: Promise<unknown>;
  act(() => {
    first = mocks.props.events(range("2026-09-28", "2026-11-07"));
    second = mocks.props.events(range("2026-09-28", "2026-11-07"));
  });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  await act(async () => { resolve({ ok: true, json: async () => [event("Actual")] }); await Promise.all([first, second]); });
  let third!: Promise<unknown>;
  act(() => { third = mocks.props.events(range("2026-09-28", "2026-11-07")); });
  expect(fetchMock).toHaveBeenCalledTimes(2);
  await act(async () => { resolve({ ok: true, json: async () => [] }); await third; });
});
it("una respuesta antigua no sustituye los contadores del nuevo periodo", async () => {
  const resolvers: Array<(value: unknown) => void> = [];
  vi.stubGlobal("fetch", vi.fn(() => new Promise(resolve => { resolvers.push(resolve); })));
  render(<Calendar initialDate="2026-10-03" />);
  let old!: Promise<unknown>, current!: Promise<unknown>;
  act(() => {
    old = mocks.props.events(range("2026-09-28", "2026-11-07"));
    current = mocks.props.events(range("2026-11-02", "2026-12-05"));
    mocks.props.datesSet({ view: { calendar: {}, title: "noviembre de 2026", currentStart: new Date("2026-11-01T00:00:00Z"), currentEnd: new Date("2026-12-01T00:00:00Z") } });
  });
  await act(async () => { resolvers[1]({ ok: true, json: async () => [{ ...event("Actual"), start: "2026-11-03" }] }); await current; });
  await act(async () => { resolvers[0]({ ok: true, json: async () => [event("Anterior"), event("Anterior2")] }); await old; });
  expect(screen.getByText("Vacaciones del mes").parentElement).toHaveTextContent("1");
});
it("muestra el fallo y permite solicitar de nuevo el mismo periodo", async () => {
  const fetchMock = vi.fn().mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true, json: async () => [] });
  vi.stubGlobal("fetch", fetchMock);
  render(<Calendar initialDate="2026-10-03" />);
  await act(async () => { await expect(mocks.props.events(range("2026-09-28", "2026-11-07"))).rejects.toThrow(); });
  expect(screen.getByRole("alert")).toHaveTextContent("No se pudo cargar el calendario");
  expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
  await act(async () => { await mocks.props.events(range("2026-09-28", "2026-11-07")); });
  expect(screen.queryByRole("alert")).toBeNull();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
