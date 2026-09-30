import * as React from "react";
import { NextResponse } from "next/server";

import { UserInvitation } from "@/components/email/templates/system/user-invitation";
import { requireCurrentUserAdminAndActive } from "@/lib/auth/admin-check";
import { sendOrCaptureEmail } from "@/lib/email/dev-email-outbox";
import { checkApiRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  if (!checkApiRateLimit(ip).success) {
    return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });
  }

  try {
    await requireCurrentUserAdminAndActive();
  } catch {
    return NextResponse.json({ error: "Acceso de administrador requerido" }, { status: 403 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: "No se encontró el correo del administrador" }, { status: 401 });
    }

    const result = await sendOrCaptureEmail({
      to: user.email,
      subject: "[PRUEBA] Invitación a EMB-APP",
      templateName: "UserInvitationPreview",
      triggeredByUserId: user.id,
      react: React.createElement(UserInvitation, {
        userName: user.user_metadata?.name || user.email,
      }),
    });

    if (result.deliveryMode !== "sent") {
      return NextResponse.json({ error: "La entrega de correo está deshabilitada" }, { status: 503 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "No se pudo enviar la prueba" }, { status: 500 });
  }
}
