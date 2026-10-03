import { beforeEach, expect, it, vi } from "vitest";
import { GET } from "@/app/api/calendar/route";
import { CalendarAccessError } from "@/actions/get-calendar-events";
const mocks = vi.hoisted(() => ({ events: vi.fn() }));
vi.mock("@/actions/get-calendar-events", () => ({ getCalendarEvents: mocks.events, CalendarAccessError: class extends Error { constructor(public status: number, message: string) { super(message); } } }));
beforeEach(() => { vi.resetAllMocks(); });
const request = () => new Request("http://localhost/api/calendar?start=2026-10-01&end=2026-11-01");
it("devuelve el periodo sin caché compartida", async () => {
  mocks.events.mockResolvedValue([]);
  const response = await GET(request());
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(mocks.events).toHaveBeenCalledWith({ start: "2026-10-01", end: "2026-11-01" });
});
it("rechaza un periodo arbitrariamente grande sin consultar datos", async () => {
  expect((await GET(new Request("http://localhost/api/calendar?start=2020-01-01&end=2026-11-01"))).status).toBe(400);
  expect(mocks.events).not.toHaveBeenCalled();
});
it.each([401, 403])("conserva el estado de autorización %s", async (status) => {
  mocks.events.mockRejectedValue(new CalendarAccessError(status, "Acceso denegado"));
  expect((await GET(request())).status).toBe(status);
});
