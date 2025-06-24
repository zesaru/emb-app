import { createServerClient } from "@supabase/ssr";
import getVacationswithUser from "@/actions/getVacationswithUser";
import getCompensatoriosForCalendar from "@/actions/getCompensatoriosForCalendar";
import getPendingVacations from "@/actions/getPendingVacations";
import getPendingCompensatorios from "@/actions/getPendingCompensatorios";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Calendar from "./_components/calendar";
import { Database } from "@/types/database.type";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {

  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }
  
  const vacations = await getVacationswithUser();
  const compensatorios = await getCompensatoriosForCalendar();
  const pendingVacations = await getPendingVacations();
  const pendingCompensatorios = await getPendingCompensatorios();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Calendario de Ausencias</h1>
        <p className="text-muted-foreground">
          Vista completa de vacaciones y horas compensatorias del equipo
        </p>
        
        {/* Leyenda */}
        <div className="flex flex-wrap gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-sm">Vacaciones aprobadas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm">Horas compensadas trabajadas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-600 rounded"></div>
            <span className="text-sm">Uso de horas compensatorias</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-sm">Solicitudes pendientes</span>
          </div>
        </div>
      </div>
      
      <Calendar 
        vacations={vacations} 
        compensatorios={compensatorios}
        pendingVacations={pendingVacations}
        pendingCompensatorios={pendingCompensatorios}
      />
    </div>
  );
}