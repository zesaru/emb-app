import Link from "next/link";
import { ArrowUpRight, CalendarClock, Clock3, TimerReset } from "lucide-react";
import type { DashboardApprovalSummary } from "@/actions/get-dashboard-approval-summary";

const number = new Intl.NumberFormat("es-PE");

export function ApprovalSummary({ summary, compactOnMobile = false }: { summary: DashboardApprovalSummary; compactOnMobile?: boolean }) {
  if (compactOnMobile) {
    return <>
      <section aria-label="Resumen de aprobaciones" className="grid grid-cols-3 gap-2 md:hidden">
        {[
          { label: "Horas extra", count: summary.pendingCompensatoryRequests, target: "mobile-compensatory-requests" },
          { label: "Descansos", count: summary.pendingCompensatoryRests, target: "mobile-compensatory-rests" },
          { label: "Vacaciones", count: summary.pendingVacations, target: "mobile-vacation-requests" },
        ].map(({ label, count, target }) => (
          <article key={target} className="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
            <p className="break-words text-xs font-medium text-slate-600">{label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-950">{number.format(count)}</p>
            {count > 0 ? <Link href={`#${target}`} aria-label={`Ver ${label.toLowerCase()} pendientes`} className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-sky-800">Ver <ArrowUpRight aria-hidden="true" className="h-3 w-3" /></Link>
              : <p className="mt-3 text-xs text-slate-500">Sin pendientes</p>}
          </article>
        ))}
      </section>
      <div className="hidden md:block"><ApprovalSummary summary={summary} /></div>
    </>;
  }
  return (
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5"><div className="flex items-center gap-3 text-amber-800"><Clock3 className="h-5 w-5" /><p className="font-semibold">Cola de compensatorios</p></div><p className="mt-4 text-3xl font-semibold text-slate-900">{number.format(summary.pendingCompensatoryRequests)}</p><p className="mt-1 text-sm text-slate-600">Solicitudes de horas por aprobar.</p><Link href="/compensatorios" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-amber-800">Gestionar <ArrowUpRight className="h-4 w-4" /></Link></article>
        <article className="rounded-2xl border border-sky-100 bg-sky-50/60 p-5"><div className="flex items-center gap-3 text-sky-800"><TimerReset className="h-5 w-5" /><p className="font-semibold">Descansos pendientes</p></div><p className="mt-4 text-3xl font-semibold text-slate-900">{number.format(summary.pendingCompensatoryRests)}</p><p className="mt-1 text-sm text-slate-600">Compensatorios listos para descanso.</p><Link href="/compensatorios" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-sky-800">Revisar <ArrowUpRight className="h-4 w-4" /></Link></article>
        <article className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5"><div className="flex items-center gap-3 text-emerald-800"><CalendarClock className="h-5 w-5" /><p className="font-semibold">Vacaciones por aprobar</p></div><p className="mt-4 text-3xl font-semibold text-slate-900">{number.format(summary.pendingVacations)}</p><p className="mt-1 text-sm text-slate-600">Solicitudes esperando aprobación.</p><Link href="/vacaciones" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-800">Ver vacaciones <ArrowUpRight className="h-4 w-4" /></Link></article>
      </section>
  );
}
