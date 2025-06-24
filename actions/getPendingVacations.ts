import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { VacationsWithUser } from "@/types/collections";

export const dynamic = 'force-dynamic';

const getPendingVacations = async(): Promise<VacationsWithUser[]> => {
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
      .from('vacations')
      .select('*, user1:users!id_user(*)')
      .eq('approve_request', false) // Solo vacaciones NO aprobadas
      .gte('days', 0)
      .order('start', { ascending: false });
  
    if (error) {
      console.log('Error fetching pending vacations:', error.message);
    }

    return (data as any) || [];
}

export default getPendingVacations;