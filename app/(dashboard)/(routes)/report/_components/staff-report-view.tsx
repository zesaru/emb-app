"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  FileText,
  Printer,
  Search,
  UsersRound,
} from "lucide-react";
import { getIndividualStaffReport, getStaffReport } from "@/actions/get-staff-report";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatVacationDate } from "@/lib/vacations/dates";
import { GRANT_RULE_LABELS } from "@/lib/vacations/grant-history";
import { isExpiringSoon, vacationReportStatus } from "@/lib/reporting/staff-report";
import type {
  IndividualStaffReport,
  ReportPeriod,
  StaffReport,
  StaffReportEmployee,
} from "@/lib/reporting/staff-report";
import "./staff-report.css";

const number = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 });
const days = (value: number) => `${number.format(value)} ${value === 1 ? "día" : "días"}`;
const stamp = (value: string) =>
  new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tokyo",
  }).format(new Date(value));
const inputClass =
  "h-10 min-w-0 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700";
function Badge({ children, warning = false }: { children: React.ReactNode; warning?: boolean }) {
  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${warning ? "bg-amber-50 text-amber-900 ring-1 ring-inset ring-amber-200" : "bg-slate-100 text-slate-700"}`}
    >
      {children}
    </span>
  );
}
function Expirations({ employee, today }: { employee: StaffReportEmployee; today: string }) {
  if (employee.diplomatic) return <p className="text-sm text-slate-500">No aplica</p>;
  if (!employee.expirations.length)
    return <p className="text-sm text-slate-500">Sin días vigentes disponibles.</p>;
  return (
    <ul className="space-y-2">
      {employee.expirations.map((item) => (
        <li
          key={item.date}
          className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-700"
        >
          <span>
            <strong className="text-slate-950">{days(item.days)}</strong>{" "}
            {item.days === 1 ? "vence" : "vencen"} el{" "}
            <strong className="font-medium">{formatVacationDate(item.date)}</strong>.
          </span>
          {isExpiringSoon(item.date, today) && <Badge warning>Vence en 90 días o menos</Badge>}
        </li>
      ))}
    </ul>
  );
}
function Metric({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof UsersRound;
}) {
  return (
    <article className="report-metric rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-slate-600">{label}</p>
        <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
      </div>
      <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
    </article>
  );
}
function EmployeeName({ employee }: { employee: StaffReportEmployee }) {
  return (
    <>
      <p className="font-semibold text-slate-950">{employee.name}</p>
      <p className="mt-1 text-xs text-slate-500">{employee.position || employee.email}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {!employee.active && <Badge>Inactivo</Badge>}
        {employee.diplomatic && <Badge>Diplomático</Badge>}
        {employee.special && <Badge>Acumulación especial</Badge>}
      </div>
    </>
  );
}
function NextExpiry({ employee, today }: { employee: StaffReportEmployee; today: string }) {
  const item = employee.expirations[0];
  if (employee.diplomatic) return <span className="text-slate-500">No aplica</span>;
  if (!item) return <span className="text-slate-500">Sin vencimientos</span>;
  return (
    <>
      <p className="font-medium text-slate-800">
        {days(item.days)} · {formatVacationDate(item.date)}
      </p>
      {isExpiringSoon(item.date, today) && (
        <span className="mt-1 inline-block text-xs font-medium text-amber-800">
          Próximo a vencer
        </span>
      )}
    </>
  );
}
function IndividualReport({ report }: { report: IndividualStaffReport }) {
  const { employee, today, grants, vacations } = report;
  const [historyPage, setHistoryPage] = useState(1);
  useEffect(() => {
    setHistoryPage(1);
  }, [report]);
  const pages = Math.max(1, Math.ceil(vacations.length / 25));
  return (
    <div className="space-y-6">
      <section className="report-person rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Informe individual
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {employee.name}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {employee.position || "Cargo sin registrar"} · {employee.email}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{employee.active ? "Activo" : "Inactivo"}</Badge>
            {employee.diplomatic ? (
              <Badge>Diplomático</Badge>
            ) : (
              <Badge>
                {employee.mode === "manual" ? "Asignación manual" : "Asignación automática"}
              </Badge>
            )}
          </div>
        </div>
        <dl className="mt-5 grid gap-4 border-t border-slate-100 pt-5 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-slate-500">Fecha de ingreso</dt>
            <dd className="mt-1 font-medium">{formatVacationDate(employee.hireDate)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Período del historial</dt>
            <dd className="mt-1 font-medium">
              {formatVacationDate(report.period.from)} – {formatVacationDate(report.period.to)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Emitido · hora de Tokio</dt>
            <dd className="mt-1 font-medium">{stamp(report.generatedAt)}</dd>
          </div>
        </dl>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        <Metric
          label="Saldo actual de vacaciones"
          value={employee.diplomatic ? "No aplica" : days(employee.balance)}
          detail={`Al ${formatVacationDate(today)} · incluye vencimientos de hoy`}
          icon={CalendarDays}
        />
        <Metric
          label="Vacaciones aprobadas"
          value={days(employee.approvedDays)}
          detail={`${employee.approvedRequests} solicitudes del período · incluye programadas`}
          icon={FileText}
        />
        <Metric
          label="Compensatorios disponibles"
          value={`${number.format(employee.compensatoryHours)} h`}
          detail={`${number.format(employee.compensatoryReservedHours)} h utilizadas o reservadas · saldo actual`}
          icon={Clock3}
        />
      </section>
      <section className="rounded-xl border border-slate-200 border-l-4 border-l-slate-800 bg-white p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-slate-950">Días disponibles y vencimientos</h3>
        <p className="mb-4 mt-1 text-sm text-slate-500">
          Cada grupo conserva su fecha de vencimiento. Los días están disponibles hasta esa fecha
          inclusive.
        </p>
        <Expirations employee={employee} today={today} />
        {employee.special && (
          <p className="mt-4 text-sm font-medium text-slate-700">
            Acumulación especial autorizada, registrada en las asignaciones.
          </p>
        )}
        <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
          {employee.diplomatic
            ? "Vacaciones: no aplica para este perfil."
            : employee.mode === "manual"
              ? `Fecha manual prevista: ${formatVacationDate(employee.nextGrantDate)}${employee.nextGrantDate && employee.nextGrantDate < today ? " · pendiente de revisión" : ""}.`
              : `Próxima asignación prevista: ${formatVacationDate(employee.nextGrantDate)}.`}{" "}
          Las solicitudes pendientes se muestran por separado y todavía no descuentan días.
        </p>
      </section>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="report-section-heading border-b border-slate-200 p-5 sm:p-6">
          <h3 className="text-lg font-semibold">Vacaciones registradas</h3>
          <p className="mt-1 text-sm text-slate-500">
            {vacations.length} registros que se cruzan con el período. Se muestran los días
            completos de cada solicitud; las canceladas no suman días aprobados.
          </p>
        </div>
        {vacations.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            No hay vacaciones registradas en este período.
          </p>
        ) : (
          <>
            <div className="report-table-wrap overflow-x-auto">
              <table className="report-history w-full text-left text-sm">
                <caption className="sr-only">Vacaciones de {employee.name}</caption>
                <thead className="bg-slate-50 text-xs text-slate-600">
                  <tr>
                    <th scope="col" className="p-4">
                      Inicio
                    </th>
                    <th scope="col" className="p-4">
                      Fin
                    </th>
                    <th scope="col" className="p-4">
                      Días registrados
                    </th>
                    <th scope="col" className="p-4">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vacations.map((row, index) => (
                    <tr
                      key={row.id}
                      className={
                        index < (historyPage - 1) * 25 || index >= historyPage * 25
                          ? "report-print-row hidden"
                          : ""
                      }
                    >
                      <td className="p-4 whitespace-nowrap">{formatVacationDate(row.start)}</td>
                      <td className="p-4 whitespace-nowrap">{formatVacationDate(row.finish)}</td>
                      <td className="p-4 tabular-nums">
                        {row.days == null ? "Sin registrar" : days(Math.abs(row.days))}
                      </td>
                      <td className="p-4">
                        <Badge warning={vacationReportStatus(row, today) === "Pendiente"}>
                          {vacationReportStatus(row, today)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pages > 1 && (
              <div className="report-controls flex items-center justify-between gap-2 border-t p-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={historyPage === 1}
                  onClick={() => setHistoryPage((p) => p - 1)}
                >
                  Anterior
                </Button>
                <span className="text-xs text-slate-600">
                  Página {historyPage} de {pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={historyPage === pages}
                  onClick={() => setHistoryPage((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </>
        )}
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <h3 className="text-lg font-semibold">Asignaciones y ajustes del saldo</h3>
        <p className="mt-1 text-sm text-slate-500">
          Historial completo de días otorgados. La diferencia entre otorgados y remanentes puede
          incluir consumos y ajustes administrativos.
        </p>
        {!grants.length ? (
          <p className="mt-4 text-sm text-slate-500">No hay asignaciones registradas.</p>
        ) : (
          <div className="mt-5 space-y-4">
            {grants.map((grant) => {
              const status =
                grant.granted_on > today
                  ? "Futura"
                  : grant.expires_on < today
                    ? "Vencida"
                    : Number(grant.days_remaining) <= 0
                      ? "Agotada"
                      : "Vigente";
              const notes = grant.notes?.replace(/\[[^\]]*\]/g, "").trim();
              return (
                <article
                  key={grant.id}
                  className="report-grant rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">
                      Otorgada el {formatVacationDate(grant.granted_on)}
                    </p>
                    <div className="flex gap-2">
                      <Badge>{GRANT_RULE_LABELS[grant.rule_type] ?? "Sin regla registrada"}</Badge>
                      <Badge>{status}</Badge>
                    </div>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                    <div>
                      <dt className="text-xs text-slate-500">Otorgados</dt>
                      <dd className="mt-1 font-medium">{days(Number(grant.days_granted))}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Utilizados o ajustados</dt>
                      <dd className="mt-1 font-medium">
                        {days(Number(grant.days_granted) - Number(grant.days_remaining))}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Remanente registrado</dt>
                      <dd className="mt-1 font-medium">{days(Number(grant.days_remaining))}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Vencimiento</dt>
                      <dd className="mt-1 font-medium">{formatVacationDate(grant.expires_on)}</dd>
                    </div>
                  </dl>
                  {notes && (
                    <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                      {notes}
                    </p>
                  )}
                  {grant.consumptions.length > 0 && (
                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <p className="text-xs font-semibold text-slate-600">
                        Descuentos registrados al aprobar solicitudes
                      </p>
                      <ul className="mt-2 space-y-1 text-xs text-slate-500">
                        {grant.consumptions.map((item) => (
                          <li key={item.id}>
                            {days(item.days_used)} · {formatVacationDate(item.consumed_at)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
        <p className="mt-4 text-xs text-slate-500">
          Los remanentes de asignaciones vencidas o futuras no forman parte del saldo disponible
          actual.
        </p>
      </section>
    </div>
  );
}

export function StaffReportView({ initialReport }: { initialReport: StaffReport }) {
  const [report, setReport] = useState(initialReport);
  const [draftPeriod, setDraftPeriod] = useState<ReportPeriod>(initialReport.period);
  const [view, setView] = useState("general");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("active");
  const [expiryOnly, setExpiryOnly] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [individual, setIndividual] = useState<IndividualStaffReport | null>(null);
  const [individualLoading, setIndividualLoading] = useState(false);
  const [individualError, setIndividualError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    setIndividual(null);
    setIndividualError("");
    if (view !== "individual" || !selectedId) {
      setIndividualLoading(false);
      return;
    }
    let cancelled = false;
    setIndividualLoading(true);
    getIndividualStaffReport({ userId: selectedId, period: report.period })
      .then((value) => {
        if (!cancelled) setIndividual(value);
      })
      .catch(() => {
        if (!cancelled)
          setIndividualError(
            "No se pudo cargar el informe individual completo. Vuelve a intentarlo.",
          );
      })
      .finally(() => {
        if (!cancelled) setIndividualLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, report, view, retry]);
  const employees = report.employees.filter(
    (e) =>
      (status === "all" || (status === "active" ? e.active : !e.active)) &&
      `${e.name} ${e.email} ${e.position ?? ""}`
        .toLocaleLowerCase("es")
        .includes(query.trim().toLocaleLowerCase("es")) &&
      (!expiryOnly || e.expirations.some((item) => isExpiringSoon(item.date, report.today))),
  );
  const balance = employees.reduce((sum, e) => sum + e.balance, 0);
  const expiring = employees.reduce(
    (sum, e) =>
      sum +
      e.expirations
        .filter((item) => isExpiringSoon(item.date, report.today))
        .reduce((n, item) => n + item.days, 0),
    0,
  );
  const pending = employees.reduce((sum, e) => sum + (e.diplomatic ? 0 : e.pendingRequests), 0);
  const currentIndividual =
    individual &&
    individual.employee.id === selectedId &&
    individual.period.from === report.period.from &&
    individual.period.to === report.period.to
      ? individual
      : null;
  const printable =
    !loading &&
    !error &&
    (view === "general" || (!!currentIndividual && !individualLoading && !individualError));
  async function refresh(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      setReport(await getStaffReport(draftPeriod));
    } catch {
      setError(
        "No se pudo actualizar el reporte. Comprueba las fechas y vuelve a intentarlo; los datos anteriores siguen visibles.",
      );
    } finally {
      setLoading(false);
    }
  }
  function openIndividual(id: string) {
    setSelectedId(id);
    setView("individual");
  }
  return (
    <div className="staff-report mx-auto max-w-7xl space-y-6 text-slate-900">
      <header className="report-heading flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Embajada del Perú en Japón
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Reportes del equipo
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Vacaciones registradas, días disponibles y vencimientos de cada colaborador.
          </p>
        </div>
        <Button
          variant="outline"
          className="report-controls shrink-0 self-start bg-white"
          disabled={!printable}
          onClick={() => window.print()}
        >
          <Printer className="mr-2 h-4 w-4" aria-hidden="true" />
          Imprimir / Guardar PDF
        </Button>
      </header>
      <form
        onSubmit={refresh}
        className="report-controls flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4"
      >
        <div>
          <label htmlFor="report-from" className="mb-1.5 block text-xs font-medium text-slate-600">
            Historial desde
          </label>
          <input
            id="report-from"
            type="date"
            required
            max={draftPeriod.to || undefined}
            value={draftPeriod.from}
            onChange={(e) => setDraftPeriod({ ...draftPeriod, from: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="report-to" className="mb-1.5 block text-xs font-medium text-slate-600">
            Hasta
          </label>
          <input
            id="report-to"
            type="date"
            required
            min={draftPeriod.from || undefined}
            value={draftPeriod.to}
            onChange={(e) => setDraftPeriod({ ...draftPeriod, to: e.target.value })}
            className={inputClass}
          />
        </div>
        <Button disabled={loading} type="submit">
          {loading ? "Actualizando…" : "Actualizar reporte"}
        </Button>
        <p className="basis-full text-xs leading-5 text-slate-500 lg:basis-auto lg:flex-1">
          El período filtra las vacaciones registradas. Los saldos y vencimientos corresponden a la
          fecha de actualización.
        </p>
      </form>
      {error && (
        <p
          role="alert"
          className="report-controls rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <p>
          Historial: {formatVacationDate(report.period.from)} –{" "}
          {formatVacationDate(report.period.to)}
        </p>
        <p>Actualizado: {stamp(report.generatedAt)} · Tokio</p>
      </div>
      <Tabs value={view} onValueChange={setView}>
        <TabsList className="report-controls mb-5 h-11 w-full justify-start rounded-lg bg-slate-200/60 p-1 sm:w-auto">
          <TabsTrigger value="general" className="flex-1 px-4 sm:flex-none">
            Resumen general
          </TabsTrigger>
          <TabsTrigger value="individual" className="flex-1 px-4 sm:flex-none">
            Informe individual
          </TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="space-y-5" aria-busy={loading}>
          <h2 className="report-print-title hidden text-xl font-semibold">
            Resumen general del equipo
          </h2>
          <div className="report-overview grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Metric
              label="Colaboradores"
              value={number.format(employees.length)}
              detail="Según los filtros del resumen"
              icon={UsersRound}
            />
            <Metric
              label="Vacaciones disponibles"
              value={days(balance)}
              detail={`Saldo actual al ${formatVacationDate(report.today)}`}
              icon={CalendarDays}
            />
            <Metric
              label="Días próximos a vencer"
              value={days(expiring)}
              detail="Vencen en los próximos 90 días, incluido hoy"
              icon={AlertTriangle}
            />
            <Metric
              label="Solicitudes pendientes"
              value={number.format(pending)}
              detail="Vacaciones del período seleccionado"
              icon={Clock3}
            />
          </div>
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="report-controls space-y-4 border-b border-slate-200 p-4 sm:p-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Resumen por colaborador</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {employees.length} de {report.employees.length} colaboradores · abre un informe
                    para ver el detalle.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3 lg:flex-row">
                <label className="relative flex-1">
                  <span className="sr-only">Buscar colaborador</span>
                  <Search
                    className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Nombre, correo o cargo"
                    className={`${inputClass} w-full pl-9`}
                  />
                </label>
                <label>
                  <span className="sr-only">Estado del colaborador</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className={`${inputClass} w-full`}
                  >
                    <option value="active">Activos</option>
                    <option value="inactive">Inactivos</option>
                    <option value="all">Todos los colaboradores</option>
                  </select>
                </label>
                <label className="flex min-h-10 items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={expiryOnly}
                    onChange={(e) => setExpiryOnly(e.target.checked)}
                    className="h-4 w-4 accent-slate-800"
                  />
                  Con días por vencer
                </label>
              </div>
            </div>
            <p className="report-print-title hidden border-b p-3 text-xs">
              Filtro:{" "}
              {status === "active" ? "Activos" : status === "inactive" ? "Inactivos" : "Todos"}
              {query && ` · Búsqueda: ${query}`}
              {expiryOnly && " · Con días por vencer"}. {employees.length} colaboradores.
            </p>
            {employees.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-500">
                No hay colaboradores que coincidan con los filtros.
              </p>
            ) : (
              <>
                <div className="report-desktop hidden xl:block">
                  <table className="report-summary w-full text-left text-sm">
                    <caption className="sr-only">Resumen general por colaborador</caption>
                    <thead className="bg-slate-50 text-xs text-slate-600">
                      <tr>
                        {[
                          "Colaborador",
                          "Días disponibles",
                          "Próximo vencimiento",
                          "Pendientes",
                          "Compensatorios",
                          "Informe",
                        ].map((label) => (
                          <th key={label} scope="col" className="px-4 py-3">
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {employees.map((e) => (
                        <tr key={e.id} className="align-top hover:bg-slate-50/70">
                          <td className="max-w-64 px-4 py-5">
                            <EmployeeName employee={e} />
                          </td>
                          <td className="px-4 py-5 font-semibold tabular-nums">
                            {e.diplomatic ? "No aplica" : days(e.balance)}
                          </td>
                          <td className="px-4 py-5">
                            <NextExpiry employee={e} today={report.today} />
                          </td>
                          <td className="px-4 py-5 tabular-nums">
                            {e.diplomatic ? "No aplica" : e.pendingRequests}
                          </td>
                          <td className="px-4 py-5 tabular-nums">
                            {number.format(e.compensatoryHours)} h
                          </td>
                          <td className="report-controls px-4 py-4">
                            <Button
                              size="sm"
                              variant="ghost"
                              aria-label={`Ver informe de ${e.name}`}
                              onClick={() => openIndividual(e.id)}
                            >
                              Ver informe
                              <ArrowUpRight className="ml-1 h-4 w-4" aria-hidden="true" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="report-mobile divide-y divide-slate-200 xl:hidden">
                  {employees.map((e) => (
                    <article key={e.id} className="space-y-4 p-4 sm:p-5">
                      <EmployeeName employee={e} />
                      <dl className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <dt className="text-xs text-slate-500">Días disponibles</dt>
                          <dd className="mt-1 text-lg font-semibold">
                            {e.diplomatic ? "No aplica" : days(e.balance)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-slate-500">Compensatorios</dt>
                          <dd className="mt-1 font-medium">
                            {number.format(e.compensatoryHours)} h
                          </dd>
                        </div>
                        <div className="col-span-2">
                          <dt className="mb-1 text-xs text-slate-500">Próximo vencimiento</dt>
                          <dd>
                            <NextExpiry employee={e} today={report.today} />
                          </dd>
                        </div>
                      </dl>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-slate-500">
                          {e.diplomatic
                            ? "Vacaciones: no aplica"
                            : `${e.pendingRequests} solicitudes pendientes`}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openIndividual(e.id)}
                          aria-label={`Ver informe de ${e.name}`}
                        >
                          Ver informe
                          <ArrowUpRight className="ml-1 h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>
          <p className="text-xs leading-5 text-slate-500">
            Los saldos son actuales. “Próximo vencimiento” indica los días del primer grupo que
            vence; el informe individual muestra todos los grupos. Las horas de compensatorios
            descuentan descansos utilizados o reservados. Vacaciones de diplomáticos: no aplica.
          </p>
        </TabsContent>
        <TabsContent value="individual" className="space-y-5">
          <div className="report-controls flex flex-col gap-3 sm:flex-row sm:items-end">
            <Button variant="ghost" onClick={() => setView("general")} className="self-start">
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Volver al resumen
            </Button>
            <label className="flex-1">
              <span className="mb-1.5 block text-xs font-medium text-slate-600">
                Seleccionar colaborador
              </span>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className={`${inputClass} w-full`}
              >
                <option value="">Selecciona un colaborador</option>
                {report.employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                    {!e.active ? " · Inactivo" : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {!selectedId ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <FileText className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
              <h2 className="mt-4 font-semibold">Consulta un informe individual</h2>
              <p className="mt-2 text-sm text-slate-500">
                Selecciona a una persona para ver sus registros, saldo y fechas de vencimiento.
              </p>
            </div>
          ) : individualLoading || (!currentIndividual && !individualError) ? (
            <p role="status" className="rounded-xl border bg-white p-8 text-sm text-slate-600">
              Cargando el informe completo…
            </p>
          ) : individualError ? (
            <div role="alert" className="rounded-xl border border-red-200 bg-white p-6">
              <p className="text-sm text-red-800">{individualError}</p>
              <Button className="mt-4" variant="outline" onClick={() => setRetry((n) => n + 1)}>
                Reintentar informe
              </Button>
            </div>
          ) : (
            currentIndividual && <IndividualReport report={currentIndividual} />
          )}
        </TabsContent>
      </Tabs>
      <footer className="border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500">
        Reporte de uso interno · Embajada del Perú en Japón. Datos de calendario y vencimientos en
        Asia/Tokyo.
      </footer>
    </div>
  );
}
