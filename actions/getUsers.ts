import { createClient } from "@/utils/supabase/server";
import { UsersEntity } from "./../types/collections";
import { summarizeVacationGrantBalance } from "@/lib/vacations/grant-balance";

export const dynamic = 'force-dynamic'

export type ReportUser = UsersEntity & {
  vacation_balance_real: number;
};

const getUsers = async():Promise<ReportUser[]> => {
    const supabase = await createClient();

    // Verificar autenticación - CRÍTICO PARA SEGURIDAD
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return [];
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_active', true)
      .eq('is_diplomatic', false);

    if (error) {
      console.log(error.message);
    }

    const users = ((data as any) || []) as UsersEntity[];
    const userIds = users.map((user) => user.id).filter(Boolean);

    if (userIds.length === 0) {
      return users.map((user) => ({
        ...user,
        vacation_balance_real: 0,
      }));
    }

    const { data: grants, error: grantsError } = await supabase
      .from("vacation_grants")
      .select("user_id, granted_on, expires_on, days_granted, days_remaining")
      .in("user_id", userIds as string[]);

    if (grantsError) {
      console.log(grantsError.message);
    }

    const grantsByUser = new Map<string, any[]>();
    for (const grant of (grants as any[]) || []) {
      const bucket = grantsByUser.get(grant.user_id) || [];
      bucket.push(grant);
      grantsByUser.set(grant.user_id, bucket);
    }

    return users.map((user) => ({
      ...user,
      vacation_balance_real: summarizeVacationGrantBalance(
        grantsByUser.get(user.id) || [],
      ).totalRemaining,
    }));
}

export default getUsers;
