"use client";

import type { CalendarEvent, CalendarRange } from "@/lib/calendar/events";
import { groupAgendaEvents } from "@/lib/calendar/agenda";
import { Button } from "@/components/ui/button";
import { BriefcaseBusiness, ChevronRight, Clock3, Palmtree } from "lucide-react";
import { calendarEventKind, calendarKindLabels } from "@/lib/calendar/filters";

const dayFormatter = new Intl.DateTimeFormat("es", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

export function Agenda({ events, range, onSelect, showWeekends = true, filtered = false }: {
  events: CalendarEvent[];
  range: CalendarRange;
  onSelect: (event: CalendarEvent, trigger: HTMLElement) => void;
  showWeekends?: boolean;
  filtered?: boolean;
}) {
  const groups = groupAgendaEvents(events, range, showWeekends);
  return (
    <section aria-label="Agenda del mes" className="space-y-5">
      <p className="text-xs text-muted-foreground">{showWeekends ? "Eventos del mes, incluidos fines de semana." : "Eventos del mes, de lunes a viernes."}</p>
      {groups.length === 0 && <p role="status" className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">{filtered ? "No hay eventos con estos filtros." : "No hay eventos en este mes."}</p>}
      {groups.map(group => <section key={group.date} aria-labelledby={`agenda-${group.date}`}>
        <h3 id={`agenda-${group.date}`} className="mb-2 text-sm font-semibold">
          <time dateTime={group.date}>{dayFormatter.format(new Date(`${group.date}T00:00:00Z`))}</time>
        </h3>
        <ul className="space-y-2">
          {group.events.map(event => {
            const kind = calendarEventKind(event);
            const Icon = kind === "vacation" ? Palmtree : kind === "rest" ? Clock3 : BriefcaseBusiness;
            return <li key={event.id}>
            <Button
              type="button" variant="outline" aria-label={`Ver detalle: ${event.title}`}
              className="h-auto min-h-11 w-full justify-between gap-3 whitespace-normal px-3 py-3 text-left"
              onClick={e => onSelect(event, e.currentTarget)}
            >
              <span className="flex min-w-0 items-start gap-3">
                <Icon aria-hidden="true" className={`mt-0.5 h-4 w-4 shrink-0 ${kind === "vacation" ? "text-emerald-700" : kind === "rest" ? "text-blue-700" : "text-amber-700"}`} />
                <span className="min-w-0 space-y-1 break-words">
                  <span className="block font-semibold">{event.extendedProps.personName || "Usuario"}</span>
                  <span className="block text-xs font-normal text-muted-foreground">
                    {calendarKindLabels[kind]}
                    {!event.allDay && ` · ${event.start.slice(11, 16)}${event.end ? ` – ${event.end.slice(11, 16)}` : ""}`}
                  </span>
                  {event.extendedProps.eventName && <span className="block text-sm font-normal text-muted-foreground">{event.extendedProps.eventName}</span>}
                </span>
              </span>
              <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Button>
          </li>; })}
        </ul>
      </section>)}
    </section>
  );
}
