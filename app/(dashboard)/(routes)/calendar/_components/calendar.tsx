"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Calendar as CalendarEngine, CalendarApi, EventApi, EventSourceFuncArg } from "@fullcalendar/core";
import type { CalendarEvent, CalendarRange } from "@/lib/calendar/events";
import { Button } from "@/components/ui/button";
import dynamic from 'next/dynamic';
import dayGridPlugin from "@fullcalendar/daygrid";
import esLocale from '@fullcalendar/core/locales/es';
import { BriefcaseBusiness, ChevronDown, ChevronLeft, ChevronRight, Clock3, Palmtree } from "lucide-react";
import { Input } from "@/components/ui/input";
import { calendarKindLabels, matchesCalendarFilters, type CalendarFilters } from "@/lib/calendar/filters";
import { EventDetail } from "./event-detail";
import { Agenda } from "./agenda";
import { buildCalendarPlanning } from "@/lib/calendar/planning";
import { PlanningSummary } from "./planning-summary";

// Vercel best practice: Dynamic import with loading state
const FullCalendar = dynamic(
  () => import("@fullcalendar/react"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Cargando calendario...</p>
        </div>
      </div>
    ),
  }
);

export default function Calendar({ initialDate }: { initialDate: string }) {
  const calendarRef = useRef<CalendarApi | null>(null);
  const [periodTitle, setPeriodTitle] = useState("");
  const [viewMode, setViewMode] = useState<"month" | "agenda">("month");
  const [monthRange, setMonthRange] = useState<CalendarRange | null>(null);
  const [filters, setFilters] = useState<CalendarFilters>({ person: "", kind: "all" });
  const [showWeekends, setShowWeekends] = useState(true);
  const [today, setToday] = useState(initialDate);
  useEffect(() => {
    const update = () => setToday(new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()));
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const hasFilters = Boolean(filters.person.trim()) || filters.kind !== "all" || !showWeekends;
  const applyMonthFilters = useCallback((items: EventApi[]) => {
    // The React adapter creates a concrete Calendar; CalendarApi omits its batching method.
    const calendar = calendarRef.current as CalendarEngine | null;
    calendar?.batchRendering(() => {
      for (const event of items) {
        const display = matchesCalendarFilters({ allDay: event.allDay, extendedProps: event.extendedProps as CalendarEvent["extendedProps"] }, filters) ? "auto" : "none";
        if (event.display !== display) event.setProp("display", display);
      }
    });
  }, [filters]);
  useEffect(() => {
    applyMonthFilters(calendarRef.current?.getEvents() ?? []);
  }, [applyMonthFilters]);
  useEffect(() => {
    if (window.matchMedia?.("(max-width: 767px)").matches) setViewMode("agenda");
  }, []);
  useEffect(() => {
    if (viewMode === "month") calendarRef.current?.updateSize();
  }, [viewMode]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const eventTriggerRef = useRef<HTMLElement | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestVersion = useRef(0);
  const pendingRequests = useRef(new Map<string, Promise<CalendarEvent[]>>());
  const fetchEvents = useCallback(async (info: EventSourceFuncArg): Promise<CalendarEvent[]> => {
    const version = ++requestVersion.current;
    setError(null);
    setEvents([]);
    const params = new URLSearchParams({ start: info.startStr.slice(0, 10), end: info.endStr.slice(0, 10) });
    try {
      const key = params.toString();
      let request = pendingRequests.current.get(key);
      if (!request) {
        request = fetch(`/api/calendar?${params}`, { cache: "no-store" }).then(async response => {
          if (!response.ok) throw new Error("No se pudo cargar el calendario. Intenta nuevamente.");
          return await response.json() as CalendarEvent[];
        }).finally(() => { pendingRequests.current.delete(key); });
        pendingRequests.current.set(key, request);
      }
      const result = await request;
      if (version === requestVersion.current) setEvents(result);
      return result;
    } catch (cause) {
      if (version === requestVersion.current) setError("No se pudo cargar el calendario. Intenta nuevamente.");
      throw cause;
    }
  }, []);
  const filteredEvents = events.filter(event => matchesCalendarFilters(event, filters));
  const planning = monthRange && !loading && !error && periodTitle ? buildCalendarPlanning(filteredEvents, monthRange, today, showWeekends) : null;
  const openDetail = (event: CalendarEvent, trigger: HTMLElement) => {
    eventTriggerRef.current = trigger;
    setSelectedEvent(event);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Calendario del equipo</h1>
        <p className="text-sm text-muted-foreground">Consulta las vacaciones y los compensatorios del personal.</p>
      </header>
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span className="font-semibold text-gray-700">Leyenda:</span>
        <div className="flex items-center gap-2">
          <Palmtree aria-hidden="true" className="h-4 w-4 text-emerald-700" />
          <span className="text-gray-600">Vacaciones</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock3 aria-hidden="true" className="h-4 w-4 text-blue-700" />
          <span className="text-gray-600">Descanso compensatorio</span>
        </div>
        <div className="flex items-center gap-2">
          <BriefcaseBusiness aria-hidden="true" className="h-4 w-4 text-amber-700" />
          <span className="text-gray-600">Trabajo adicional</span>
        </div>
      </div>

      {loading && <p role="status" className="text-sm text-gray-500">Cargando eventos del periodo…</p>}
      {error && <div role="alert" className="flex items-center gap-3 text-sm text-red-700"><p>{error}</p><Button variant="outline" onClick={() => calendarRef.current?.refetchEvents()}>Reintentar</Button></div>}
      {/* Calendar */}
      <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 aria-live="polite" aria-atomic="true" className="min-w-0 text-xl font-semibold text-foreground sm:text-2xl">
            {periodTitle || "Cargando calendario…"}
          </h2>
          <div role="group" aria-label="Navegación del calendario" className="flex shrink-0 items-center gap-2">
            <Button type="button" variant="outline" size="icon" className="h-11 w-11" aria-label="Mes anterior" disabled={!periodTitle} onClick={() => calendarRef.current?.prev()}>
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </Button>
            <Button type="button" variant="outline" className="h-11" disabled={!periodTitle} onClick={() => calendarRef.current?.today()}>Hoy</Button>
            <Button type="button" variant="outline" size="icon" className="h-11 w-11" aria-label="Mes siguiente" disabled={!periodTitle} onClick={() => calendarRef.current?.next()}>
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
        </div>
        <details className="group mb-4 rounded-lg border bg-muted/40 px-3">
          <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold">Filtros{hasFilters && <span className="ml-2 text-xs font-normal text-muted-foreground">· Activos</span>}<ChevronDown aria-hidden="true" className="ml-auto h-4 w-4 transition-transform group-open:rotate-180 motion-reduce:transition-none" /></summary>
          <fieldset className="mb-3 grid min-w-0 gap-3 sm:grid-cols-2">
            <legend className="px-1 text-sm font-semibold">Filtrar eventos</legend>
            <div className="min-w-0 space-y-1">
              <label htmlFor="calendar-person" className="text-sm font-medium">Buscar persona</label>
              <Input id="calendar-person" type="search" placeholder="Nombre del personal" className="h-11" value={filters.person} onChange={e => setFilters(current => ({ ...current, person: e.target.value }))} />
            </div>
            <div className="min-w-0 space-y-1">
              <label htmlFor="calendar-kind" className="text-sm font-medium">Tipo de evento</label>
              <select id="calendar-kind" className="h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={filters.kind} onChange={e => setFilters(current => ({ ...current, kind: e.target.value as CalendarFilters["kind"] }))}>
                <option value="all">Todos los tipos</option>
                {Object.entries(calendarKindLabels).map(([kind, label]) => <option key={kind} value={kind}>{label}</option>)}
              </select>
            </div>
            <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5 accent-primary" checked={showWeekends} onChange={e => setShowWeekends(e.target.checked)} />Mostrar fines de semana</label>
            <Button type="button" variant="outline" className="h-11 sm:justify-self-end" disabled={!hasFilters} onClick={() => { setFilters({ person: "", kind: "all" }); setShowWeekends(true); }}>Limpiar filtros</Button>
          </fieldset>
        </details>
        <div role="group" aria-label="Vista del calendario" className="mb-4 flex w-fit gap-1 rounded-lg bg-muted p-1">
          <Button type="button" variant={viewMode === "month" ? "default" : "ghost"} className="h-11" aria-pressed={viewMode === "month"} onClick={() => setViewMode("month")}>Mes</Button>
          <Button type="button" variant={viewMode === "agenda" ? "default" : "ghost"} className="h-11" aria-pressed={viewMode === "agenda"} onClick={() => setViewMode("agenda")}>Agenda</Button>
        </div>
        {viewMode === "agenda" && <>
          {!periodTitle && <p role="status" className="text-sm text-muted-foreground">Preparando agenda…</p>}
          {loading && <div aria-hidden="true" className="space-y-3 motion-safe:animate-pulse"><div className="h-20 rounded-md bg-muted" /><div className="h-20 rounded-md bg-muted" /></div>}
          {monthRange && !loading && !error && <Agenda events={filteredEvents} range={monthRange} onSelect={openDetail} showWeekends={showWeekends} filtered={hasFilters} />}
        </>}
        {/* Keep one calendar/data source alive so switching views preserves the period. */}
        <div hidden={viewMode !== "month"}>
          <FullCalendar
            datesSet={info => {
              calendarRef.current = info.view.calendar;
              setPeriodTitle(info.view.title);
              setMonthRange({ start: info.view.currentStart.toISOString().slice(0, 10), end: info.view.currentEnd.toISOString().slice(0, 10) });
            }}
            initialDate={initialDate}
            now={() => today}
            timeZone="Asia/Tokyo"
            loading={setLoading}
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            weekends={showWeekends}
            events={fetchEvents}
            eventsSet={applyMonthFilters}
            locale={esLocale}
            headerToolbar={false}
            eventClick={info => {
              const selected = events.find(event => event.id === info.event.id);
              if (!selected) return;
              openDetail(selected, info.el);
            }}
            eventDidMount={(info) => {
              // Vercel best practice: Add tooltip on hover
              info.el.title = info.event.title;
              info.el.setAttribute("aria-label", `Ver detalle: ${info.event.title}`);
            }}
            height="auto"
            dayMaxEvents={3}
            moreLinkText={`+más`}
          />
        </div>
      </div>

      <EventDetail event={selectedEvent} open={detailOpen} onOpenChange={setDetailOpen} returnFocus={() => eventTriggerRef.current?.focus()} />

      <section aria-label="Registros del mes" className="space-y-2">
        <div className="grid grid-cols-3 gap-2 text-sm">
          {([['vacation', 'Vacaciones del mes'], ['rest', 'Descansos del mes'], ['work', 'Trabajo adicional del mes']] as const).map(([kind, label]) => <div key={kind} className="min-w-0 rounded-lg border bg-white p-3"><p className="break-words text-xs text-muted-foreground">{label}</p><p className="text-2xl font-bold">{planning?.counts[kind] ?? '—'}</p></div>)}
        </div>
        <p className="text-xs text-muted-foreground">Registros únicos del mes seleccionado, con los filtros y días visibles aplicados. Cada solicitud cuenta una vez, aunque dure varios días.</p>
      </section>
      {planning && <PlanningSummary planning={planning} onSelect={openDetail} />}
    </div>
  );
}
