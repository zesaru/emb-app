import { createClient } from "@/utils/supabase/server";
import { DataTable } from "./_components/data-table"
import { columns } from "./_components/columns"
import getsCompensatorioswithUser from "@/actions/getCompensatorioswithUser";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/admin-check";
import { canViewAllCompensatorys } from "@/lib/auth/compensatory-permissions";
import { CompensatoryFilters } from "./_components/filters";
import { ReportSummary } from "./_components/report-summary";
import { buildCompensatoryReport } from "@/lib/compensatorios/report";

export const dynamic = "force-dynamic";

export default async function Compensatorios({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }
  const params = await searchParams;
  const value = (key: string) => typeof params[key] === "string" ? params[key] : undefined;
  const month = value("month");
  const view = value("view");
  const statusValue = value("status");
  const admin = await isAdmin(user.id);
  const canViewAll = admin || await canViewAllCompensatorys(user.id);
  const allCompensatorys = await getsCompensatorioswithUser({
    month,
    from: value("from"),
    to: value("to"),
    user: value("user"),
    status: statusValue === "approved" || statusValue === "pending" ? statusValue : "all",
  });
  const compensatorys = canViewAll
    ? allCompensatorys
    : allCompensatorys.filter((c) => c.user_id === user.id);

  const reportRows = month && view === "report" ? buildCompensatoryReport(compensatorys) : [];
  const detailParams = new URLSearchParams();
  for (const key of ["month", "from", "to", "user", "status"]) {
    const current = value(key);
    if (current && !(key === "status" && current === "all")) detailParams.set(key, current);
  }
  const detailHref = `/compensatorios${detailParams.toString() ? `?${detailParams}` : ""}`;

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <div className="container mx-auto space-y-6 px-4 py-8 md:px-6 md:py-10">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">Control de horas</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Compensatorios</h1><p className="mt-1 text-sm text-slate-500">Consulta, filtra y revisa el saldo del equipo.</p></div>
          <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">{compensatorys.length} registros encontrados</div>
        </div>
        <CompensatoryFilters />
        {month && view === "report" ? <ReportSummary rows={reportRows} month={month} detailHref={detailHref} /> : <DataTable columns={columns} data={compensatorys} />}
      </div>
    </div>
  )
}
