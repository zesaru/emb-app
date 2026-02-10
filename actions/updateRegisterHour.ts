"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { compensatoryRegisterApprovalSchema } from "@/lib/validation/schemas";
import { CompensatoryUseApprovedUser } from "@/components/email/templates/compensatory/compensatory-use-approved-user";
import { getFromEmail, buildUrl } from "@/components/email/utils/email-config";
import React from "react";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function updateApproveRegisterHour(compensatory: any) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const approved_by = user?.id;

  if (user === null) {
    return { success: false, error: "No autenticado" };
  }

  // Validar datos de entrada con Zod
  try {
    compensatoryRegisterApprovalSchema.parse({
      id: compensatory.id,
      user_id: compensatory.user_id,
      email: compensatory.email,
      compensated_hours: compensatory.compensated_hours,
    });
  } catch (error: any) {
    return { success: false, error: error.errors?.[0]?.message || "Datos inválidos" };
  }

  await supabase
    .from("compensatorys")
    .update({
      final_approve_request: true,
      approved_by_compensated: approved_by,
    })
    .eq("id", compensatory.id)
    .select("*");

  await supabase.rpc("subtract_compensatory_hours", {
    hours: compensatory.compensated_hours,
    user_id: compensatory.user_id,
  });

  // Fetch user's remaining hours
  const { data: userData } = await supabase
    .from("users")
    .select("num_compensatorys")
    .eq("id", compensatory.user_id)
    .single();

  const remainingHours = userData?.num_compensatorys || 0;

  try {
    await resend.emails.send({
      from: getFromEmail(),
      to: compensatory.email,
      subject: `¡Tu Solicitud de Descanso Ha Sido Aprobada!`,
      react: React.createElement(CompensatoryUseApprovedUser, {
        userName: compensatory.email,
        hours: compensatory.compensated_hours,
        reasonDate: new Date().toISOString(),
        approvedDate: new Date().toISOString(),
        remainingHours: remainingHours,
        dashboardUrl: buildUrl('/'),
      }),
    });
    revalidatePath(`/`);
    return {
      success: true,
    };
  } catch (error) {
    // No exponer errores sensibles
    return { success: true };
  }
}
