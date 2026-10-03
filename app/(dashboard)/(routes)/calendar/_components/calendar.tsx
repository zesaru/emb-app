"use client";

import { useCallback, useRef, useState } from "react";
import type { CalendarApi, EventSourceFuncArg } from "@fullcalendar/core";
import type { CalendarEvent } from "@/lib/calendar/events";
import { Button } from "@/components/ui/button";
import dynamic from 'next/dynamic';
import dayGridPlugin from "@fullcalendar/daygrid";
import esLocale from '@fullcalendar/core/locales/es';

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
  const vacations = events.filter(event => event.extendedProps.type === "vacation");
  const compensatorys = events.filter(event => event.extendedProps.type === "compensatory");

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <h3 className="font-semibold text-gray-700">Leyenda:</h3>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-500 border-2 border-emerald-600"></div>
          <span className="text-gray-600">Vacaciones</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500 border-2 border-blue-600"></div>
          <span className="text-gray-600">Compensatorios</span>
        </div>
      </div>

      {loading && <p role="status" className="text-sm text-gray-500">Cargando eventos del periodo…</p>}
      {error && <div role="alert" className="flex items-center gap-3 text-sm text-red-700"><p>{error}</p><Button variant="outline" onClick={() => calendarRef.current?.refetchEvents()}>Reintentar</Button></div>}
      {/* Calendar */}
      <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
        <FullCalendar
          datesSet={info => { calendarRef.current = info.view.calendar; }}
          initialDate={initialDate}
          now={() => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())}
          timeZone="Asia/Tokyo"
          loading={setLoading}
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          weekends={false}
          events={fetchEvents}
          locale={esLocale}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth'
          }}
          buttonText={{
            today: 'Hoy',
            month: 'Mes'
          }}
          eventDidMount={(info) => {
            // Vercel best practice: Add tooltip on hover
            info.el.title = info.event.title;
          }}
          height="auto"
          dayMaxEvents={3}
          moreLinkText={`+más`}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <p className="text-gray-600">Vacaciones del periodo</p>
          <p className="text-2xl font-bold text-emerald-600">{loading || error ? "—" : vacations.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <p className="text-gray-600">Compensatorios del periodo</p>
          <p className="text-2xl font-bold text-blue-600">{loading || error ? "—" : compensatorys.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <p className="text-gray-600">Eventos del periodo</p>
          <p className="text-2xl font-bold text-gray-700">{loading || error ? "—" : events.length}</p>
        </div>
      </div>
    </div>
  );
}
