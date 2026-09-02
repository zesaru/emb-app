"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { adminUserPasswordResetLinkSchema } from "@/lib/validation/schemas";
import { getUserById, requireAdminContext } from "./shared";

function getInviteRedirectUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  return appUrl ? `${appUrl.replace(/\/$/, "")}/auth/callback?next=/welcome` : undefined;
}

export async function resendUserInvitation(input: { userId: string }) {
  try {
    const data = adminUserPasswordResetLinkSchema.parse(input);
    const { supabase } = await requireAdminContext();
    const target = await getUserById(data.userId);

    if (target.invitationStatus !== "pending") {
      return { success: false as const, error: "Esta cuenta ya activó su invitación" };
    }

    const { error: inviteError } = await (getSupabaseAdminClient().auth.admin as any)
      .inviteUserByEmail(target.email, { redirectTo: getInviteRedirectUrl() });
    if (inviteError) return { success: false as const, error: inviteError.message || "No se pudo reenviar la invitación" };

    const { error: profileError } = await supabase
      .from("users")
      .update({ invitation_last_sent_at: new Date().toISOString() } as any)
      .eq("id", target.id);
    if (profileError) return { success: false as const, error: "La invitación fue enviada, pero no se pudo registrar el reenvío" };

    revalidatePath("/admin/users");
    return { success: true as const, message: "Invitación reenviada correctamente" };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Error inesperado reenviando invitación" };
  }
}

export default resendUserInvitation;
