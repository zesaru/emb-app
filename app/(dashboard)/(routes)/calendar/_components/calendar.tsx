"use client";

// Dynamic imports for bundle optimization (Vercel best practice)
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

const dayGridPlugin = dynamic(
  () => import("@fullcalendar/daygrid").then(mod => mod.default),
  { ssr: false }
);

const esLocale = dynamic(
  () => import('@fullcalendar/core/locales/es').then(mod => mod.default),
  { ssr: false }
);

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
