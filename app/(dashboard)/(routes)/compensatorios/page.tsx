import { getRequestUser } from "@/lib/auth/request-user";
import { DataTable } from "./_components/data-table"
import { columns } from "./_components/columns"
import { listCompensatoryRecords } from "@/actions/list-compensatory-records";
import { redirect } from "next/navigation";
import { CompensatoryFilters } from "./_components/filters";
import { ReportSummary } from "./_components/report-summary";
import { parseCompensatoryMonth } from "@/lib/compensatorios/filters";
import { buildCompensatoryReport } from "@/lib/compensatorios/report";

export const dynamic = "force-dynamic";

export default async function Compensatorios({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {

  const {
    data: { user },
  } = await getRequestUser();

  if (!user) {
    redirect("/login");
  }
  const params = await searchParams;
  const value = (key: string) => typeof params[key] === "string" ? params[key] : undefined;
  const month = parseCompensatoryMonth(value("month"));
  const view = value("view");
  const statusValue = value("status");
  const isReport = Boolean(month && view === "report");
  const result = await listCompensatoryRecords({
    month, from: value("from"), to: value("to"), user: value("user"),
    status: statusValue === "approved" || statusValue === "pending" ? statusValue : "all",
    page: Number(value("page")), sort: value("sort") === "asc" ? "asc" : "desc",
  }, isReport);
  const compensatorys = result.rows;

  const reportRows = isReport ? buildCompensatoryReport(compensatorys) : [];
  const detailParams = new URLSearchParams();
  for (const key of ["month", "from", "to", "user", "status"]) {
    const current = key === "month" ? month : value(key);
    if (current && !(key === "status" && current === "all")) detailParams.set(key, current);
  }
  const detailHref = `/compensatorios${detailParams.toString() ? `?${detailParams}` : ""}`;

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <div className="container mx-auto space-y-6 px-4 py-8 md:px-6 md:py-10">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">Control de horas</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Compensatorios</h1><p className="mt-1 text-sm text-slate-500">Consulta, filtra y revisa el saldo del equipo.</p></div>
          <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">{result.total} registros encontrados</div>
        </div>
        <CompensatoryFilters />
        {isReport ? <ReportSummary rows={reportRows} month={month!} detailHref={detailHref} /> : <DataTable columns={columns} data={compensatorys} page={result.page} pages={result.pages} />}
      </div>
    </div>
  )
}
