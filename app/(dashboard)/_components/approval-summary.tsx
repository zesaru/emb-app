import Link from "next/link";
import { ArrowUpRight, CalendarClock, Clock3, TimerReset } from "lucide-react";
import type { DashboardApprovalSummary } from "@/actions/get-dashboard-approval-summary";

const number = new Intl.NumberFormat("es-PE");

export function ApprovalSummary({ summary }: { summary: DashboardApprovalSummary }) {
  return (
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5"><div className="flex items-center gap-3 text-amber-800"><Clock3 className="h-5 w-5" /><p className="font-semibold">Cola de compensatorios</p></div><p className="mt-4 text-3xl font-semibold text-slate-900">{number.format(summary.pendingCompensatoryRequests)}</p><p className="mt-1 text-sm text-slate-600">Solicitudes de horas por aprobar.</p><Link href="/compensatorios" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-amber-800">Gestionar <ArrowUpRight className="h-4 w-4" /></Link></article>
        <article className="rounded-2xl border border-sky-100 bg-sky-50/60 p-5"><div className="flex items-center gap-3 text-sky-800"><TimerReset className="h-5 w-5" /><p className="font-semibold">Descansos pendientes</p></div><p className="mt-4 text-3xl font-semibold text-slate-900">{number.format(summary.pendingCompensatoryRests)}</p><p className="mt-1 text-sm text-slate-600">Compensatorios listos para descanso.</p><Link href="/compensatorios" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-sky-800">Revisar <ArrowUpRight className="h-4 w-4" /></Link></article>
        <article className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5"><div className="flex items-center gap-3 text-emerald-800"><CalendarClock className="h-5 w-5" /><p className="font-semibold">Vacaciones por aprobar</p></div><p className="mt-4 text-3xl font-semibold text-slate-900">{number.format(summary.pendingVacations)}</p><p className="mt-1 text-sm text-slate-600">Solicitudes esperando aprobación.</p><Link href="/vacaciones" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-800">Ver vacaciones <ArrowUpRight className="h-4 w-4" /></Link></article>
      </section>
  );
}
