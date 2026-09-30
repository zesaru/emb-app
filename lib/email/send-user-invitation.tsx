import * as React from "react";

import { UserInvitation } from "@/components/email/templates/system/user-invitation";
import { isEmailDeliveryEnabled } from "@/components/email/utils/email-config";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendOrCaptureEmail } from "./dev-email-outbox";

type SendUserInvitationInput = {
  email: string;
  name: string;
  redirectTo: string;
};

export async function sendUserInvitation(input: SendUserInvitationInput) {
  if (!isEmailDeliveryEnabled()) {
    return { success: false as const, deliveryAttempted: false, error: "El envío de invitaciones está deshabilitado" };
  }

  let link: string | undefined;
  try {
    const { data, error } = await getSupabaseAdminClient().auth.admin.generateLink({
      type: "invite",
      email: input.email,
      options: { redirectTo: input.redirectTo },
    });
    if (error) throw error;
    link = data.properties?.action_link;
  } catch {
    return { success: false as const, deliveryAttempted: false, error: "No se pudo generar el enlace de invitación" };
  }

  if (!link) {
    return { success: false as const, deliveryAttempted: false, error: "No se pudo generar el enlace de invitación" };
  }

  try {
    const result = await sendOrCaptureEmail({
      to: input.email,
      subject: "Invitación a EMB-APP",
      templateName: "UserInvitation",
      react: React.createElement(UserInvitation, {
        userName: input.name,
        invitationUrl: link,
      }),
    });

    if (result.deliveryMode !== "sent") {
      return { success: false as const, deliveryAttempted: false, error: "El envío de invitaciones está deshabilitado" };
    }

    return { success: true as const };
  } catch {
    return { success: false as const, deliveryAttempted: true, error: "No se pudo confirmar el envío de la invitación" };
  }
}
