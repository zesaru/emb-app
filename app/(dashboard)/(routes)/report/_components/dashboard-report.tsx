import Link from "next/link";
import {
  ArrowUpRight,
  CalendarCheck2,
  CalendarClock,
  Clock3,
  FileBarChart2,
  Palmtree,
  TimerReset,
  UsersRound,
} from "lucide-react";
import type { DashboardReport } from "@/lib/reporting/dashboard-metrics";
import { TeamTimeReport } from "./team-time-report";

const number = new Intl.NumberFormat("es-PE");

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof UsersRound;
  tone: "indigo" | "emerald" | "amber" | "sky";
}) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-700 ring-indigo-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    sky: "bg-sky-50 text-sky-700 ring-sky-100",
  };

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_34px_-24px_rgba(15,23,42,0.38)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{detail}</p>
        </div>
        <span className={`grid h-11 w-11 place-items-center rounded-xl ring-1 ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}

export function DashboardReportView({ report }: { report: DashboardReport }) {
  const maxMonth = Math.max(1, ...report.monthlyVacationDays.map((item) => item.requested));
  const statusTotal = Math.max(1, report.vacationStatus.reduce((total, item) => total + item.value, 0));
  const timestamp = new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(report.generatedAt));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-[0_22px_60px_-30px_rgba(15,23,42,0.85)] sm:px-8">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
              <FileBarChart2 className="h-4 w-4" /> Inteligencia operativa
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Panorama del equipo</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
              Métricas consolidadas de vacaciones, compensatorios y asistencia para priorizar la operación diaria.
            </p>
          </div>
          <p className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium text-slate-200">
            Actualizado con datos reales: {timestamp}
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Equipo activo" value={number.format(report.overview.activeEmployees)} detail="Colaboradores no diplomáticos activos" icon={UsersRound} tone="indigo" />
        <MetricCard label="Saldo disponible" value={`${number.format(report.overview.vacationBalance)} días`} detail="Vacaciones vigentes del equipo" icon={Palmtree} tone="emerald" />
        <MetricCard label="Solicitudes pendientes" value={number.format(report.overview.pendingVacations)} detail="Vacaciones esperando aprobación" icon={Clock3} tone="amber" />
        <MetricCard label="En vacaciones hoy" value={number.format(report.overview.activeVacations)} detail="Personas con periodo activo" icon={CalendarCheck2} tone="sky" />
      </section>

      <TeamTimeReport employees={report.employees} />

      <section className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_34px_-24px_rgba(15,23,42,0.32)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Días de vacaciones por mes</p>
              <p className="mt-1 text-sm text-slate-500">Solicitados y aprobados durante los últimos seis meses.</p>
            </div>
            <Link href="/vacaciones" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-900">
              Ver registros <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid h-56 grid-cols-6 items-end gap-3 border-b border-slate-100 pt-4">
            {report.monthlyVacationDays.map((month) => (
              <div key={month.label} className="flex h-full min-w-0 flex-col justify-end gap-2 text-center">
                <div className="mx-auto flex h-full w-full max-w-12 items-end gap-1">
                  <div title={`${month.requested} días solicitados`} className="w-1/2 rounded-t-md bg-indigo-200" style={{ height: `${Math.max(month.requested ? 10 : 0, (month.requested / maxMonth) * 100)}%` }} />
                  <div title={`${month.approved} días aprobados`} className="w-1/2 rounded-t-md bg-indigo-600" style={{ height: `${Math.max(month.approved ? 10 : 0, (month.approved / maxMonth) * 100)}%` }} />
                </div>
                <span className="text-xs font-medium capitalize text-slate-500">{month.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-5 text-xs text-slate-500">
            <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-indigo-200" /> Solicitados</span>
            <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-indigo-600" /> Aprobados</span>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_34px_-24px_rgba(15,23,42,0.32)]">
          <p className="text-sm font-semibold text-slate-900">Estado de vacaciones</p>
          <p className="mt-1 text-sm text-slate-500">Distribución de solicitudes registradas.</p>
          <div className="mt-7 space-y-5">
            {report.vacationStatus.map((status) => (
              <div key={status.label}>
                <div className="mb-2 flex items-center justify-between text-sm"><span className="font-medium text-slate-700">{status.label}</span><span className="font-semibold text-slate-900">{number.format(status.value)}</span></div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${status.color}`} style={{ width: `${(status.value / statusTotal) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5"><div className="flex items-center gap-3 text-amber-800"><Clock3 className="h-5 w-5" /><p className="font-semibold">Cola de compensatorios</p></div><p className="mt-4 text-3xl font-semibold text-slate-900">{number.format(report.overview.pendingCompensatoryRequests)}</p><p className="mt-1 text-sm text-slate-600">Solicitudes de horas por aprobar.</p><Link href="/compensatorios" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-amber-800">Gestionar <ArrowUpRight className="h-4 w-4" /></Link></article>
        <article className="rounded-2xl border border-sky-100 bg-sky-50/60 p-5"><div className="flex items-center gap-3 text-sky-800"><TimerReset className="h-5 w-5" /><p className="font-semibold">Descansos pendientes</p></div><p className="mt-4 text-3xl font-semibold text-slate-900">{number.format(report.overview.pendingCompensatoryRests)}</p><p className="mt-1 text-sm text-slate-600">Compensatorios listos para descanso.</p><Link href="/compensatorios" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-sky-800">Revisar <ArrowUpRight className="h-4 w-4" /></Link></article>
        <article className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5"><div className="flex items-center gap-3 text-emerald-800"><CalendarClock className="h-5 w-5" /><p className="font-semibold">Vacaciones aprobadas</p></div><p className="mt-4 text-3xl font-semibold text-slate-900">{number.format(report.overview.approvedVacationDaysThisMonth)} días</p><p className="mt-1 text-sm text-slate-600">Días aprobados durante el mes actual.</p><Link href="/vacaciones" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-800">Ver vacaciones <ArrowUpRight className="h-4 w-4" /></Link></article>
      </section>
    </div>
  );
}
