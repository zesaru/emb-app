"use client";

// Dynamic import for FullCalendar to reduce bundle size (Vercel best practice)
import dynamic from 'next/dynamic';

// Code-split FullCalendar to reduce initial bundle size
const FullCalendar = dynamic(
  () => import("@fullcalendar/react"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-400">Cargando calendario...</div>
      </div>
    ),
  }
);

// Static imports for plugins (they're small enough)
import dayGridPlugin from "@fullcalendar/daygrid";
import esLocale from '@fullcalendar/core/locales/es';

export default function Calendar(vacations: any) {

  const events: any = [];

  vacations.data.forEach(
    (item: {
      user1: { name: any };
      start: string | number | Date;
      finish: string | number | Date;
    }) => {
      const event = {
        title: item.user1.name,
        start: new Date(item.start),
        end: new Date(item.finish),
      };
      events.push(event);
    }
  );

  console.log(events);
  return (
    <div>
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        weekends={false}
        events={events}
        locale={esLocale}
      />
    </div>
  );
}
