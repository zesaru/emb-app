"use server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export async function markInvitationAccepted() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false as const };

  const { error } = await (getSupabaseAdminClient()
    .from("users") as any)
    .update({ invitation_status: "accepted", invitation_accepted_at: new Date().toISOString() } as any)
    .eq("id", user.id)
    .eq("invitation_status", "pending");

  return { success: !error as boolean };
}
