"use client";

import { useMemo } from "react";
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

interface CalendarEvent {
  title: string;
  start: Date;
  end?: Date;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    type: 'vacation' | 'compensatory';
    user?: string;
    id?: string;
  };
}

interface CalendarProps {
  vacations: any[];
  compensatorys: any[];
}

export default function Calendar({ vacations, compensatorys }: CalendarProps) {
  // Vercel best practice: Memoization to prevent unnecessary recalculations
  const events = useMemo<CalendarEvent[]>(() => {
    const eventList: CalendarEvent[] = [];

    // Process vacations - Green color
    vacations.forEach((item: any) => {
      if (item.start && item.finish) {
        eventList.push({
          title: `🏖️ ${item.user1?.name || 'Usuario'}`,
          start: new Date(item.start),
          end: new Date(item.finish),
          backgroundColor: '#10b981', // emerald-500
          borderColor: '#059669', // emerald-600
          extendedProps: {
            type: 'vacation',
            user: item.user1?.name,
            id: item.id
          }
        });
      }
    });

    // Process compensatorys - Blue color
    compensatorys.forEach((item: any) => {
      // Mostrar compensatorios que tienen horas trabajadas registradas
      if (item.compensated_hours_day && item.t_time_start && item.t_time_finish) {
        const startTime = new Date(`${item.compensated_hours_day}T${item.t_time_start}`);
        const endTime = new Date(`${item.compensated_hours_day}T${item.t_time_finish}`);

        eventList.push({
          title: `💼 ${item.user1?.name || 'Usuario'}: ${item.compensated_hours}h`,
          start: startTime,
          end: endTime,
          backgroundColor: '#3b82f6', // blue-500
          borderColor: '#2563eb', // blue-600
          extendedProps: {
            type: 'compensatory',
            user: item.user1?.name,
            id: item.id
          }
        });
      }
      // También mostrar eventos (trabajo extra) que tienen nombre y fecha
      else if (item.event_name && item.event_date) {
        eventList.push({
          title: `💼 ${item.user1?.name || 'Usuario'}: ${item.event_name}`,
          start: new Date(item.event_date),
          backgroundColor: '#60a5fa', // lighter blue
          borderColor: '#3b82f6',
          extendedProps: {
            type: 'compensatory',
            user: item.user1?.name,
            id: item.id
          }
        });
      }
    });

    return eventList;
  }, [vacations, compensatorys]);

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

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          weekends={false}
          events={events}
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
          <p className="text-gray-600">Total Vacaciones</p>
          <p className="text-2xl font-bold text-emerald-600">{vacations.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <p className="text-gray-600">Total Compensatorios</p>
          <p className="text-2xl font-bold text-blue-600">{compensatorys.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <p className="text-gray-600">Total Eventos</p>
          <p className="text-2xl font-bold text-gray-700">{events.length}</p>
        </div>
      </div>
    </div>
  );
}
