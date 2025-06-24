import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

interface SystemStats {
  totalActiveUsers: number;
  totalInactiveUsers: number;
  totalCompensatorios: number;
  totalVacations: number;
  pendingCompensatorios: number;
  pendingVacations: number;
  totalAdmins: number;
}

const getSystemStats = async(): Promise<SystemStats> => {
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

    // Get user statistics
    const { data: activeUsers } = await supabase
      .from('users')
      .select('id')
      .eq('is_active', true);

    const { data: inactiveUsers } = await supabase
      .from('users')
      .select('id')
      .eq('is_active', false);

    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('admin', 'admin')
      .eq('is_active', true);

    // Get compensatorios statistics
    const { data: totalCompensatorios } = await supabase
      .from('compensatorys')
      .select('id');

    const { data: pendingCompensatorios } = await supabase
      .from('compensatorys')
      .select('id')
      .eq('approve_request', false);

    // Get vacations statistics
    const { data: totalVacations } = await supabase
      .from('vacations')
      .select('id');

    const { data: pendingVacations } = await supabase
      .from('vacations')
      .select('id')
      .eq('approve_request', false);

    return {
      totalActiveUsers: activeUsers?.length || 0,
      totalInactiveUsers: inactiveUsers?.length || 0,
      totalCompensatorios: totalCompensatorios?.length || 0,
      totalVacations: totalVacations?.length || 0,
      pendingCompensatorios: pendingCompensatorios?.length || 0,
      pendingVacations: pendingVacations?.length || 0,
      totalAdmins: admins?.length || 0,
    };
}

export default getSystemStats;