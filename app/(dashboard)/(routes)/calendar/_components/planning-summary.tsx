import type { buildCalendarPlanning } from "@/lib/calendar/planning";
import type { CalendarEvent } from "@/lib/calendar/events";
import { calendarEventKind, calendarKindLabels } from "@/lib/calendar/filters";

const dateLabel = (date: string) => new Intl.DateTimeFormat("es", { timeZone: "UTC", day: "numeric", month: "short" }).format(new Date(`${date}T00:00:00Z`));

export function PlanningSummary({ planning, onSelect }: { planning: ReturnType<typeof buildCalendarPlanning>; onSelect: (event: CalendarEvent, trigger: HTMLElement) => void }) {
  const eventButton = (event: CalendarEvent) => <button type="button" className="min-h-11 w-full rounded-md px-2 py-2 text-left text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={e => onSelect(event, e.currentTarget)}>
    <span className="block break-words font-medium">{event.extendedProps.personName || "Usuario"}</span>
    <span className="text-xs text-muted-foreground">{calendarKindLabels[calendarEventKind(event)]} · Ver detalle</span>
  </button>;
  return <section aria-label="Planificación del mes" className="space-y-3 rounded-lg border bg-white p-4">
    <h2 className="font-semibold">Ausencias registradas</h2>
    <p className="text-xs text-muted-foreground">Incluye solicitudes registradas. Revisa su aprobación en Vacaciones o Compensatorios. Se aplican los filtros del calendario.</p>
    <div className="grid min-w-0 gap-5 md:grid-cols-3">
      <div className="min-w-0"><h3 className="text-sm font-semibold">Hoy · Tokio</h3>
        {planning.today === null ? <p className="mt-2 text-sm text-muted-foreground">Hoy está fuera del mes o de los días visibles.</p> : planning.today.length ? <ul>{planning.today.slice(0, 5).map(event => <li key={event.id}>{eventButton(event)}</li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">Sin ausencias registradas hoy.</p>}
        {planning.today && planning.today.length > 5 && <p className="text-xs text-muted-foreground">Consulta {planning.today.length - 5} registros más en la agenda.</p>}
      </div>
      <div className="min-w-0"><h3 className="text-sm font-semibold">Próximos inicios del mes</h3>
        {planning.upcoming.length ? <ul>{planning.upcoming.slice(0, 5).map(({ date, event }) => <li key={event.id} className="mt-2"><p className="text-xs text-muted-foreground">{dateLabel(date)}</p>{eventButton(event)}</li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">Sin próximos inicios registrados.</p>}
        {planning.upcoming.length > 5 && <p className="text-xs text-muted-foreground">Consulta {planning.upcoming.length - 5} registros más en la agenda.</p>}
      </div>
      <div className="min-w-0"><h3 className="text-sm font-semibold">Coincidencias del mes</h3>
        <p className="mt-1 text-xs text-muted-foreground">Días con vacaciones o descansos a nombre de distintos usuarios; pueden ser horarios diferentes.</p>
        {planning.overlaps.length ? <ul className="mt-2 space-y-3">{planning.overlaps.slice(0, 5).map(group => <li key={group.date} className="text-sm"><p className="font-medium">{dateLabel(group.date)}</p><p className="break-words text-muted-foreground">{Array.from(new Set(group.events.map(event => event.extendedProps.personName || "Usuario"))).join(", ")}</p></li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">Sin coincidencias registradas.</p>}
        {planning.overlaps.length > 5 && <p className="mt-2 text-xs text-muted-foreground">{planning.overlaps.length - 5} días más con coincidencias en la agenda.</p>}
      </div>
    </div>
  </section>;
}
