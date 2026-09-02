import { Clock3, TrendingDown, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompensatoryReportRow, getReportTotals } from "@/lib/compensatorios/report";

function Hours({ value, tone = "slate" }: { value: number; tone?: "slate" | "green" | "blue" | "amber" }) {
  const tones = { slate: "text-slate-900", green: "text-emerald-600", blue: "text-blue-600", amber: "text-amber-600" };
  return <span className={`font-mono text-sm font-semibold ${tones[tone]}`}>{value}h</span>;
}

export function ReportSummary({ rows, month, detailHref }: { rows: CompensatoryReportRow[]; month: string; detailHref: string }) {
  const totals = getReportTotals(rows);
  const [year, monthNumber] = month.split("-");
  const label = new Intl.DateTimeFormat("es-PE", { month: "long", year: "numeric", timeZone: "Asia/Tokyo" }).format(new Date(Date.UTC(Number(year), Number(monthNumber) - 1, 1)));

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white shadow-xl shadow-slate-900/10">
      <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Reporte mensual</p>
          <h2 className="mt-1 text-2xl font-semibold capitalize tracking-tight">{label}</h2>
          <p className="mt-1 text-sm text-slate-400">Horas separadas por usuario según los filtros aplicados.</p>
        </div>
        <div className="flex items-center gap-3"><div className="flex items-center gap-2 text-sm text-slate-300"><Users className="h-4 w-4 text-amber-300" /> {rows.length} usuarios</div><Button asChild variant="outline" size="sm" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"><Link href={detailHref}><ArrowLeft className="mr-2 h-4 w-4" /> Ver detalle</Link></Button></div>
      </div>
      <div className="grid grid-cols-2 gap-px bg-white/10 md:grid-cols-4">
        <div className="bg-slate-950 p-4"><p className="text-xs text-slate-400">Registradas</p><p className="mt-1"><Hours value={totals.registeredHours} /></p></div>
        <div className="bg-slate-950 p-4"><p className="text-xs text-slate-400">Aprobadas</p><p className="mt-1"><Hours value={totals.approvedHours} tone="green" /></p></div>
        <div className="bg-slate-950 p-4"><p className="text-xs text-slate-400">Utilizadas</p><p className="mt-1"><Hours value={totals.usedHours} tone="blue" /></p></div>
        <div className="bg-slate-950 p-4"><p className="text-xs text-slate-400">Saldo del mes</p><p className="mt-1"><Hours value={totals.balance} tone="amber" /></p></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Usuario</th><th className="px-5 py-3 text-right">Registradas</th><th className="px-5 py-3 text-right">Aprobadas</th><th className="px-5 py-3 text-right">Utilizadas</th><th className="px-5 py-3 text-right">Saldo</th></tr></thead>
          <tbody className="divide-y divide-white/10">
            {rows.length ? rows.map((row) => <tr key={row.userId} className="transition-colors hover:bg-white/5"><td className="px-5 py-4"><p className="font-medium text-white">{row.name}</p><p className="text-xs text-slate-500">{row.email || "Sin correo"}</p></td><td className="px-5 py-4 text-right"><Hours value={row.registeredHours} /></td><td className="px-5 py-4 text-right"><Hours value={row.approvedHours} tone="green" /></td><td className="px-5 py-4 text-right"><Hours value={row.usedHours} tone="blue" /></td><td className="px-5 py-4 text-right"><Hours value={row.balance} tone="amber" /></td></tr>) : <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400"><Clock3 className="mx-auto mb-2 h-5 w-5" />No hay registros para este mes.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
