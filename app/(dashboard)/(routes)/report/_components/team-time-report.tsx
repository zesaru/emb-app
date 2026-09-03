"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CalendarDays, Search, Sparkles } from "lucide-react";
import type { EmployeeTimeReportRow } from "@/lib/reporting/dashboard-metrics";

const date = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeZone: "Asia/Tokyo" });

function dateValue(value: string | null) {
  return value ? date.format(new Date(`${value}T12:00:00`)) : "—";
}

export function TeamTimeReport({ employees }: { employees: EmployeeTimeReportRow[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | EmployeeTimeReportRow["recommendation"]>("all");
  const rows = useMemo(() => employees.filter((employee) => {
    const matchesQuery = `${employee.name} ${employee.email}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesQuery && (filter === "all" || employee.recommendation === filter);
  }), [employees, filter, query]);

  const recommendation = (employee: EmployeeTimeReportRow) => {
    if (employee.recommendation === "urgent") return <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700"><AlertTriangle className="h-3.5 w-3.5" /> Priorizar antes del vencimiento</span>;
    if (employee.recommendation === "plan") return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800"><CalendarDays className="h-3.5 w-3.5" /> Recomendar descanso</span>;
    return <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Saldo saludable</span>;
  };

  const grantControl = (employee: EmployeeTimeReportRow) => employee.grantMode === "manual"
    ? <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">Control manual</span>
    : null;

  return <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_50px_-36px_rgba(15,23,42,0.45)]">
    <div className="border-b border-slate-100 bg-[linear-gradient(110deg,#fffbeb_0%,#ffffff_45%,#ecfeff_100%)] px-6 py-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-700"><Sparkles className="h-4 w-4" /> Seguimiento de descansos</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Reporte individual del equipo</h2><p className="mt-1 text-sm text-slate-600">Solo personal activo no diplomático. Prioriza primero los saldos que podrían vencer.</p></div>
        <div className="flex flex-col gap-2 sm:flex-row"><label className="relative"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar persona" className="h-9 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none ring-amber-400 transition focus:ring-2" /></label><select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-amber-400"><option value="all">Todas las prioridades</option><option value="urgent">Por vencer</option><option value="plan">Recomendar descanso</option><option value="healthy">Saldo saludable</option></select></div>
      </div>
    </div>
    <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-bold uppercase tracking-wide text-slate-500"><tr><th className="px-6 py-4">Colaborador</th><th className="px-4 py-4">Ingreso</th><th className="px-4 py-4">Vacaciones reales</th><th className="px-4 py-4">Renovación</th><th className="px-4 py-4">Vencimiento</th><th className="px-4 py-4 text-right">Comp. aprobados</th><th className="px-4 py-4 text-right">Comp. por tomar</th><th className="px-6 py-4">Recomendación</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map((employee) => <tr key={employee.id} className="transition-colors hover:bg-amber-50/30"><td className="px-6 py-4"><p className="font-semibold text-slate-900">{employee.name}</p><p className="mt-0.5 text-xs text-slate-500">{employee.email}</p>{grantControl(employee)}</td><td className="px-4 py-4 text-slate-600">{dateValue(employee.hireDate)}</td><td className="px-4 py-4"><span className="text-lg font-semibold text-slate-900">{employee.vacationBalance}</span><span className="ml-1 text-xs text-slate-500">días</span></td><td className="px-4 py-4 font-medium text-slate-700">{dateValue(employee.nextRenewalDate)}</td><td className="px-4 py-4 text-slate-600">{dateValue(employee.nextExpiryDate)}</td><td className="px-4 py-4 text-right font-mono font-semibold text-slate-700">{employee.compensatoryApprovedHours}h</td><td className="px-4 py-4 text-right font-mono font-semibold text-indigo-700">{employee.compensatoryAvailableHours}h</td><td className="px-6 py-4">{recommendation(employee)}</td></tr>)}{rows.length === 0 && <tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-500">No hay colaboradores que coincidan con el filtro.</td></tr>}</tbody></table></div>
  </section>;
}
