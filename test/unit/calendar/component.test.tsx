import React from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import Calendar from "@/app/(dashboard)/(routes)/calendar/_components/calendar";
const mocks = vi.hoisted(() => ({ props: {} as any }));
vi.mock("next/dynamic", () => ({ default: () => (props: any) => { mocks.props = props; return <div />; } }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
function range(start: string, end: string) { return { startStr: start, endStr: end }; }
const event = (title: string) => ({ id: title, title, start: "2026-10-03", allDay: true, extendedProps: { type: "vacation" } });

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
  });
  await act(async () => { resolvers[1]({ ok: true, json: async () => [event("Actual")] }); await current; });
  await act(async () => { resolvers[0]({ ok: true, json: async () => [event("Anterior"), event("Anterior2")] }); await old; });
  expect(screen.getByText("Vacaciones del periodo").parentElement).toHaveTextContent("1");
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
