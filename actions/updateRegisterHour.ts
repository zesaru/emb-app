"use server";

import React from "react";
import { revalidatePath } from "next/cache";

import { sendOrCaptureEmail } from "@/lib/email/dev-email-outbox";
import { compensatoryRegisterApprovalSchema } from "@/lib/validation/schemas";
import { CompensatoryUseApprovedUser } from "@/components/email/templates/compensatory/compensatory-use-approved-user";
import { buildUrl } from "@/components/email/utils/email-config";
import { createClient } from "@/utils/supabase/server";

export default async function updateApproveRegisterHour(compensatory: any) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const approvedBy = user?.id;

  if (!user) {
    return { success: false, error: "No autenticado" };
  }

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
      approved_by_compensated: approvedBy,
    })
    .eq("id", compensatory.id)
    .select("*");

  await supabase.rpc("subtract_compensatory_hours", {
    hours: compensatory.compensated_hours,
    user_id: compensatory.user_id,
  });

  const { data: userData } = await supabase
    .from("users")
    .select("name, num_compensatorys")
    .eq("id", compensatory.user_id)
    .single();

  const remainingHours = userData?.num_compensatorys || 0;
  const userName = userData?.name?.trim() || compensatory.email;

  try {
    await sendOrCaptureEmail({
      to: compensatory.email,
      subject: "Tu solicitud de descanso ha sido aprobada",
      templateName: "CompensatoryUseApprovedUser",
      triggeredByUserId: user.id,
      payload: {
        userName,
        hours: compensatory.compensated_hours,
        reasonDate: new Date().toISOString(),
        approvedDate: new Date().toISOString(),
        remainingHours,
        dashboardUrl: buildUrl("/"),
      },
      react: React.createElement(CompensatoryUseApprovedUser, {
        userName,
        hours: compensatory.compensated_hours,
        reasonDate: new Date().toISOString(),
        approvedDate: new Date().toISOString(),
        remainingHours,
        dashboardUrl: buildUrl("/"),
      }),
    });

    revalidatePath(`/`);
    return {
      success: true,
    };
  } catch {
    return { success: true };
  }
}
