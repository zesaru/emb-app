import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

interface PendingCompensatorioEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  type: 'compensatorio_pending' | 'compensatorio_pending_worked';
  user_name: string;
  event_name: string;
  hours: number;
  backgroundColor: string;
  borderColor: string;
}

const getPendingCompensatorios = async(): Promise<PendingCompensatorioEvent[]> => {
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

    // Obtener registros pendientes de aprobación inicial
    const { data: unapprovedData, error: unapprovedError } = await supabase.rpc("list_unapproved_compensatorys");
    
    // Obtener horas pendientes de aprobación final
    const { data: hoursUnapprovedData, error: hoursError } = await supabase.rpc("list_hours_unapproved_compensatorys");
  
    if (unapprovedError) {
      console.log('Error fetching unapproved compensatorios:', unapprovedError.message);
    }
    
    if (hoursError) {
      console.log('Error fetching hours unapproved compensatorios:', hoursError.message);
    }

    const events: PendingCompensatorioEvent[] = [];

    // Procesar registros pendientes de aprobación inicial (horas trabajadas)
    (unapprovedData as any)?.forEach((compensatorio: any) => {
      const userName = compensatorio.user_name || 'Usuario';
      
      if (compensatorio.event_date) {
        events.push({
          id: `pending_worked_${compensatorio.id}`,
          title: `${userName} - ${compensatorio.hours}h pendientes`,
          start: compensatorio.event_date,
          type: 'compensatorio_pending_worked',
          user_name: userName,
          event_name: compensatorio.event_name || 'Horas compensatorias',
          hours: compensatorio.hours || 0,
          backgroundColor: '#f59e0b', // Amarillo/naranja
          borderColor: '#d97706',
        });
      }
    });

    // Procesar horas pendientes de aprobación final (uso de horas compensatorias)
    (hoursUnapprovedData as any)?.forEach((compensatorio: any) => {
      const userName = compensatorio.user_name || 'Usuario';
      
      if (compensatorio.compensated_hours_day) {
        events.push({
          id: `pending_hours_${compensatorio.id}`,
          title: `${userName} - ${compensatorio.compensated_hours}h uso pendiente`,
          start: compensatorio.compensated_hours_day,
          type: 'compensatorio_pending',
          user_name: userName,
          event_name: compensatorio.event_name || 'Uso de horas compensatorias',
          hours: compensatorio.compensated_hours || 0,
          backgroundColor: '#eab308', // Amarillo
          borderColor: '#ca8a04',
        });
      }
    });

    return events;
}

export default getPendingCompensatorios;