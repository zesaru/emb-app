import { beforeEach, expect, it, vi } from "vitest";
import Compensatorios from "@/app/(dashboard)/(routes)/compensatorios/page";
const mocks = vi.hoisted(() => ({ list: vi.fn(), report: vi.fn() }));
vi.mock("@/lib/auth/request-user", () => ({ getRequestUser: async () => ({ data: { user: { id: "user" } } }) }));
vi.mock("@/actions/list-compensatory-records", () => ({ listCompensatoryRecords: mocks.list }));
vi.mock("@/lib/compensatorios/report", () => ({ buildCompensatoryReport: mocks.report }));
vi.mock("@/app/(dashboard)/(routes)/compensatorios/_components/filters", () => ({ CompensatoryFilters: () => null }));
vi.mock("@/app/(dashboard)/(routes)/compensatorios/_components/columns", () => ({ columns: [] }));
vi.mock("@/app/(dashboard)/(routes)/compensatorios/_components/data-table", () => ({ DataTable: () => null }));
vi.mock("@/app/(dashboard)/(routes)/compensatorios/_components/report-summary", () => ({ ReportSummary: () => null }));
beforeEach(() => { vi.resetAllMocks(); mocks.list.mockResolvedValue({ rows: [], total: 0, page: 1, pages: 1 }); mocks.report.mockReturnValue([]); });
it("un mes inválido vuelve al detalle paginado y no construye el reporte", async () => {
  await Compensatorios({ searchParams: Promise.resolve({ month: "2026-13", view: "report" }) });
  expect(mocks.list).toHaveBeenCalledWith(expect.objectContaining({ month: undefined }), false);
  expect(mocks.report).not.toHaveBeenCalled();
});
it("un mes válido conserva el reporte completo", async () => {
  await Compensatorios({ searchParams: Promise.resolve({ month: "2026-10", view: "report" }) });
  expect(mocks.list).toHaveBeenCalledWith(expect.objectContaining({ month: "2026-10" }), true);
  expect(mocks.report).toHaveBeenCalledWith([]);
});
