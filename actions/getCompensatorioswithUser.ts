import { createClient } from "@/utils/supabase/server";

import { CompensatorysWithUser } from "./../types/collections";

export type CompensatoryFilters = {
  month?: string;
  from?: string;
  to?: string;
  user?: string;
  status?: "all" | "approved" | "pending";
};

export const dynamic = 'force-dynamic'

const getsCompensatorioswithUser = async(filters: CompensatoryFilters = {}):Promise<CompensatorysWithUser[]> => {
    const supabase = await createClient();

    const query = supabase
      .from('compensatorys')
      .select('*, user1:users!compensatorys_user_id_fkey(*), user2:users!compensatorys_approved_by_fkey(*)')
      .gte('hours',  0)
      .order('event_date', { ascending: false });

    const monthRange = filters.month && /^\d{4}-\d{2}$/.test(filters.month)
      ? {
          from: `${filters.month}-01`,
          to: new Date(Date.UTC(Number(filters.month.slice(0, 4)), Number(filters.month.slice(5, 7)), 0))
            .toISOString()
            .slice(0, 10),
        }
      : null;

    if (filters.from || monthRange?.from) query.gte('event_date', filters.from || monthRange?.from);
    if (filters.to || monthRange?.to) query.lte('event_date', filters.to || monthRange?.to);
    if (filters.status === 'approved') query.eq('approve_request', true);
    if (filters.status === 'pending') query.eq('approve_request', false);

    const { data, error } = await query;
  
    if (error) {
      console.log(error.message);
    }

    const rows = (data as any) || [];
    const userQuery = filters.user?.trim().toLowerCase();

    if (!userQuery) return rows;

    return rows.filter((row: CompensatorysWithUser) => {
      const name = String(row.user1?.name || '').toLowerCase();
      const email = String(row.user1?.email || '').toLowerCase();
      return name.includes(userQuery) || email.includes(userQuery);
    });
}

export default getsCompensatorioswithUser;
