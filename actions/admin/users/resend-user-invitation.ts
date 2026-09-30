"use server";

import { revalidatePath } from "next/cache";
import { adminUserPasswordResetLinkSchema } from "@/lib/validation/schemas";
import { sendUserInvitation } from "@/lib/email/send-user-invitation";
import { isEmailDeliveryEnabled } from "@/components/email/utils/email-config";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getUserById, requireAdminContext } from "./shared";

function getInviteRedirectUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  return appUrl ? `${appUrl.replace(/\/$/, "")}/auth/complete-invite` : undefined;
}

export async function resendUserInvitation(input: { userId: string }) {
  try {
    const data = adminUserPasswordResetLinkSchema.parse(input);
    const { supabase } = await requireAdminContext();
    const target = await getUserById(data.userId);
    if (target.provisioningStatus === "pending") {
      return { success: false as const, error: "Completa el alta antes de reenviar la invitación" };
    }

    if (target.invitationStatus !== "pending") {
      return { success: false as const, error: "Esta cuenta ya activó su invitación" };
    }

    const inviteRedirectUrl = getInviteRedirectUrl();
    if (!inviteRedirectUrl) {
      return { success: false as const, error: "Falta configurar NEXT_PUBLIC_APP_URL para enviar invitaciones" };
    }
    if (!isEmailDeliveryEnabled()) {
      return { success: false as const, error: "El envío de invitaciones está deshabilitado" };
    }

    const { data: authUser, error: authError } = await getSupabaseAdminClient().auth.admin.getUserById(target.id);
    if (authError || !authUser.user || authUser.user.email?.toLowerCase() !== target.email.toLowerCase()) {
      return { success: false as const, error: "No se pudo verificar la cuenta en Auth" };
    }
    if (authUser.user.email_confirmed_at) {
      return { success: false as const, error: "Esta cuenta ya aceptó la invitación" };
    }

    const inviteResult = await sendUserInvitation({
      email: target.email,
      name: target.name?.trim() || target.email,
      redirectTo: inviteRedirectUrl,
    });
    if (!inviteResult.success) return { success: false as const, error: inviteResult.error };

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
