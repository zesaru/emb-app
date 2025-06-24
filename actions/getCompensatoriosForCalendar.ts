import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

interface CompensatorioCalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  type: 'compensatorio_absence' | 'compensatorio_worked';
  user_name: string;
  event_name: string;
  hours: number;
  backgroundColor: string;
  borderColor: string;
}

const getCompensatoriosForCalendar = async(): Promise<CompensatorioCalendarEvent[]> => {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    );

    const { data, error } = await supabase
      .from('compensatorys')
      .select('*, users:users!user_id(*)')
      .eq('approve_request', true) // Solo compensatorios aprobados
      .order('event_date', { ascending: false });
  
    if (error) {
      console.log('Error fetching compensatorios for calendar:', error.message);
      return [];
    }

    const events: CompensatorioCalendarEvent[] = [];

    (data as any)?.forEach((compensatorio: any) => {
      const userName = compensatorio.users?.name || 'Usuario';
      
      // Mostrar horas compensatorias trabajadas (aprobadas)
      if (compensatorio.approve_request && compensatorio.event_date) {
        const horasTrabajadas = compensatorio.hours || 0;
        
        events.push({
          id: `worked_${compensatorio.id}`,
          title: `${userName} - ${horasTrabajadas}h compensadas`,
          start: compensatorio.event_date,
          type: 'compensatorio_worked',
          user_name: userName,
          event_name: compensatorio.event_name || 'Horas compensatorias',
          hours: horasTrabajadas,
          backgroundColor: '#3b82f6', // Azul
          borderColor: '#2563eb',
        });
      }
      
      // Mostrar días de ausencia compensatoria (horas no trabajadas)
      if (compensatorio.compensated_hours_day && compensatorio.final_approve_request) {
        const horasNoTrabajadas = compensatorio.compensated_hours || 0;
        
        events.push({
          id: `absence_${compensatorio.id}`,
          title: `${userName} - Ausencia ${horasNoTrabajadas}h`,
          start: compensatorio.compensated_hours_day,
          type: 'compensatorio_absence',
          user_name: userName,
          event_name: 'Uso de horas compensatorias',
          hours: horasNoTrabajadas,
          backgroundColor: '#059669', // Verde esmeralda
          borderColor: '#047857',
        });
      }
    });

    return events;
}

export default getCompensatoriosForCalendar;