"use client";

import type { CalendarEvent } from "@/lib/calendar/events";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function displayDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function inclusiveFinish(event: CalendarEvent) {
  if (!event.end) return event.start;
  // Subtract one calendar day from FullCalendar's exclusive all-day end.
  // UTC arithmetic avoids browser-zone and DST changes to literal Tokyo dates.
  const finish = new Date(`${event.end.slice(0, 10)}T00:00:00Z`);
  finish.setUTCDate(finish.getUTCDate() - 1);
  return finish.toISOString().slice(0, 10);
}

export function EventDetail({ event, open, onOpenChange, returnFocus }: {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocus: () => void;
}) {
  const vacation = event?.extendedProps.type === "vacation";
  const rest = !vacation && event && !event.allDay;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        closeLabel="Cerrar detalle"
        className="max-h-[85dvh] w-[calc(100%_-_2rem)] overflow-y-auto rounded-lg [&>button]:h-11 [&>button]:w-11"
        onCloseAutoFocus={e => { e.preventDefault(); returnFocus(); }}
      >
        <DialogHeader className="pr-12 text-left">
          <DialogTitle>Detalle del evento</DialogTitle>
          <DialogDescription>Fechas y horarios de Japón (Asia/Tokyo).</DialogDescription>
        </DialogHeader>
        {event && <dl className="space-y-4 text-sm [&_dt]:text-muted-foreground [&_dd]:mt-1 [&_dd]:break-words [&_dd]:font-medium">
          <div><dt>Persona</dt><dd>{event.extendedProps.personName || "Usuario"}</dd></div>
          <div><dt>Tipo</dt><dd>{vacation ? "Vacaciones" : rest ? "Descanso compensatorio" : "Trabajo adicional"}</dd></div>
          {vacation ? <>
            <div><dt>Inicio</dt><dd>{displayDate(event.start)}</dd></div>
            <div><dt>Último día de vacaciones</dt><dd>{displayDate(inclusiveFinish(event))}</dd></div>
          </> : <div><dt>Fecha</dt><dd>{displayDate(event.start)}</dd></div>}
          {event.extendedProps.eventName && <div><dt>Evento de trabajo</dt><dd>{event.extendedProps.eventName}</dd></div>}
          {rest && <>
            <div><dt>Horario</dt><dd>{event.start.slice(11, 16)}{event.end ? ` – ${event.end.slice(11, 16)}` : ""}</dd></div>
            {event.extendedProps.compensatedHours != null && <div><dt>Horas de descanso</dt><dd>{event.extendedProps.compensatedHours} h</dd></div>}
          </>}
        </dl>}
      </DialogContent>
    </Dialog>
  );
}
