"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import esLocale from '@fullcalendar/core/locales/es';

interface CalendarProps {
  vacations: any[];
  compensatorios: any[];
  pendingVacations: any[];
  pendingCompensatorios: any[];
}

export default function Calendar({ vacations, compensatorios, pendingVacations, pendingCompensatorios }: CalendarProps) {

  const events: any = [];
  
  // Debug logs
  console.log('Vacations data:', vacations);
  console.log('Compensatorios data:', compensatorios);
  console.log('Pending vacations:', pendingVacations);
  console.log('Pending compensatorios:', pendingCompensatorios);
  
  // Agregar un evento de prueba para verificar que el calendario funciona
  events.push({
    title: 'Evento de Prueba',
    start: new Date().toISOString().split('T')[0], // Hoy
    backgroundColor: '#ef4444',
    borderColor: '#dc2626',
  });

  // Agregar eventos de vacaciones (naranja)
  vacations?.forEach((vacation: any) => {
    if (vacation.user1 && vacation.user1.name) {
      const event = {
        title: `${vacation.user1.name} - Vacaciones`,
        start: vacation.start,
        end: vacation.finish,
        backgroundColor: '#ea580c', // Naranja
        borderColor: '#dc2626',
        extendedProps: {
          type: 'vacation',
          user: vacation.user1.name,
          days: vacation.days,
        }
      };
      events.push(event);
    }
  });

  // Agregar eventos de compensatorios aprobados
  compensatorios?.forEach((compensatorio: any) => {
    events.push({
      title: compensatorio.title,
      start: compensatorio.start,
      end: compensatorio.end,
      backgroundColor: compensatorio.backgroundColor,
      borderColor: compensatorio.borderColor,
      extendedProps: {
        type: compensatorio.type,
        user: compensatorio.user_name,
        eventName: compensatorio.event_name,
        hours: compensatorio.hours,
      }
    });
  });

  // Agregar vacaciones pendientes (amarillo)
  pendingVacations?.forEach((vacation: any) => {
    if (vacation.user1 && vacation.user1.name) {
      const event = {
        title: `${vacation.user1.name} - Vacaciones (pendiente)`,
        start: vacation.start,
        end: vacation.finish,
        backgroundColor: '#eab308', // Amarillo
        borderColor: '#ca8a04',
        extendedProps: {
          type: 'vacation_pending',
          user: vacation.user1.name,
          days: vacation.days,
          status: 'Pendiente de aprobación'
        }
      };
      events.push(event);
    }
  });

  // Agregar compensatorios pendientes
  pendingCompensatorios?.forEach((compensatorio: any) => {
    events.push({
      title: compensatorio.title,
      start: compensatorio.start,
      end: compensatorio.end,
      backgroundColor: compensatorio.backgroundColor,
      borderColor: compensatorio.borderColor,
      extendedProps: {
        type: compensatorio.type,
        user: compensatorio.user_name,
        eventName: compensatorio.event_name,
        hours: compensatorio.hours,
        status: 'Pendiente de aprobación'
      }
    });
  });

  const handleEventClick = (clickInfo: any) => {
    const { extendedProps } = clickInfo.event;
    let details = '';
    
    if (extendedProps.type === 'vacation') {
      details = `Usuario: ${extendedProps.user}\nTipo: Vacaciones (aprobadas)\nDías: ${extendedProps.days}`;
    } else if (extendedProps.type === 'vacation_pending') {
      details = `Usuario: ${extendedProps.user}\nTipo: Vacaciones\nDías: ${extendedProps.days}\nEstado: ${extendedProps.status}`;
    } else if (extendedProps.type === 'compensatorio_worked') {
      details = `Usuario: ${extendedProps.user}\nTipo: Horas compensatorias trabajadas\nHoras acumuladas: ${extendedProps.hours}\nEvento: ${extendedProps.eventName}`;
    } else if (extendedProps.type === 'compensatorio_absence') {
      details = `Usuario: ${extendedProps.user}\nTipo: Uso de horas compensatorias\nHoras no trabajadas: ${extendedProps.hours}\nMotivo: ${extendedProps.eventName}`;
    } else if (extendedProps.type === 'compensatorio_pending_worked') {
      details = `Usuario: ${extendedProps.user}\nTipo: Horas trabajadas pendientes de aprobación\nHoras: ${extendedProps.hours}\nEvento: ${extendedProps.eventName}\nEstado: Pendiente de aprobación`;
    } else if (extendedProps.type === 'compensatorio_pending') {
      details = `Usuario: ${extendedProps.user}\nTipo: Compensatorio\nHoras: ${extendedProps.hours}\nMotivo: ${extendedProps.eventName}\nEstado: ${extendedProps.status || 'Pendiente de aprobación'}`;
    }
    
    alert(details);
  };

  // Debug final events
  console.log('Final events for calendar:', events);

  return (
    <div className="bg-white rounded-lg border">
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        weekends={true}
        events={events}
        locale={esLocale}
        height="auto"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth'
        }}
        eventClick={handleEventClick}
        eventDisplay="block"
        dayMaxEvents={3}
        moreLinkClick="popover"
        eventTextColor="#ffffff"
        buttonText={{
          today: 'Hoy',
          month: 'Mes'
        }}
      />
    </div>
  );
}
