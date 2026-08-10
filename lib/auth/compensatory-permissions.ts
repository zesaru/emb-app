import { createClient } from "@/utils/supabase/server";

const VIEW_ALL_COMPENSATORYS = "compensatorys.view_all";

/**
 * Checks the explicit read-only permission for the current application user.
 * Admin status is deliberately not inferred or written here; callers can
 * combine this with the existing admin checks when appropriate.
 */
export async function canViewAllCompensatorys(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("user_permissions")
    .select("user_id")
    .eq("user_id", userId)
    .eq("permission", VIEW_ALL_COMPENSATORYS)
    .maybeSingle();

  return !error && Boolean(data);
}
