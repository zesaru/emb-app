"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";

export default function Calendar(vacations: any) {
  //const events = vacations
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

  console.log(events)

  return (
    <div>
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        weekends={false}
        events={events}
      />
    </div>
  );
}
