import { createClient } from "@/utils/supabase/server";
import { summarizeVacationGrantBalance } from "@/lib/vacations/grant-balance";
import { resolveJapanNextExpectedGrantDate } from "@/lib/vacations/japan-vacation-grants";

export const dynamic = "force-dynamic";

type UserVacationGrantSummary = {
  totalGranted: number;
  totalRemaining: number;
  totalExpiredRemaining: number;
  activeGrantCount: number;
  nextExpiryDate: string | null;
  nextExpectedGrantDate: string | null;
};

const getUserVacationGrantSummary = async (userId: string): Promise<UserVacationGrantSummary | null> => {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("id, hire_date, grant_mode")
    .eq("id", userId)
    .single();

  if (userError || !userRow) {
    return null;
  }

  const { data: grants, error: grantsError } = await supabase
    .from("vacation_grants")
    .select("granted_on, expires_on, days_granted, days_remaining, rule_type, notes")
    .eq("user_id", userId)
    .order("granted_on", { ascending: false });

  if (grantsError) {
    return null;
  }

  const summary = summarizeVacationGrantBalance((grants as any) || []);
  const latestGrant = grants?.[0];
  const today = new Date().toISOString().slice(0, 10);

  return {
    ...summary,
    nextExpectedGrantDate: userRow.hire_date
      ? userRow.grant_mode === "manual"
        ? null
        : resolveJapanNextExpectedGrantDate(
          userRow.hire_date,
          latestGrant
            ? {
                grantedOn: latestGrant.granted_on,
                ruleType: (latestGrant as any).rule_type ?? null,
                notes: (latestGrant as any).notes ?? null,
              }
            : null,
          today,
        )
      : null,
  };
};

export default getUserVacationGrantSummary;
