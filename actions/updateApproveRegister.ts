"use server";

import React from "react";
import { revalidatePath } from "next/cache";

import { requireCurrentUserAdmin } from "@/lib/auth/admin-check";
import { sendOrCaptureEmail } from "@/lib/email/dev-email-outbox";
import { uuidSchema, positiveIntegerSchema } from "@/lib/validation/schemas";
import { CompensatoryApprovedUser } from "@/components/email/templates/compensatory/compensatory-approved-user";
import { buildUrl } from "@/components/email/utils/email-config";
import { createClient } from "@/utils/supabase/server";

interface CompensatoryInput {
  id: string;
  user_id: string;
  email: string;
  hours: number;
}

export default async function updateApproveRegister(compensatory: CompensatoryInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autenticado" };
  }

  try {
    await requireCurrentUserAdmin();
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "No autorizado" };
  }

  try {
    uuidSchema.parse(compensatory.id);
    uuidSchema.parse(compensatory.user_id);
    positiveIntegerSchema.parse(compensatory.hours);
  } catch {
    return { success: false, error: "Datos inválidos" };
  }

  const approvedBy = user.id;

  try {
    const { data: updated, error: updateError } = await supabase
      .from("compensatorys")
      .update({
        approve_request: true,
        approved_date: new Date().toISOString(),
        approved_by: approvedBy,
      })
      .eq("id", compensatory.id)
      .select("*")
      .single();

    if (updateError) {
      return { success: false, error: "Error al actualizar el registro" };
    }

    await supabase.rpc("accumulate_compensatory_hours", {
      hours: compensatory.hours,
      user_id: compensatory.user_id,
    });

    try {
      const { data: userData } = await supabase
        .from("users")
        .select("name, num_compensatorys")
        .eq("id", compensatory.user_id)
        .single();

      const newTotalHours = userData?.num_compensatorys || 0;
      const userName = userData?.name?.trim() || compensatory.email;

      await sendOrCaptureEmail({
        to: compensatory.email,
        subject: "Tu solicitud ha sido aprobada",
        templateName: "CompensatoryApprovedUser",
        triggeredByUserId: user.id,
        payload: {
          userName,
          eventName: "Registro de horas",
          hours: compensatory.hours,
          eventDate: new Date().toISOString(),
          approvedDate: new Date().toISOString(),
          newTotalHours,
          dashboardUrl: buildUrl("/"),
        },
        react: React.createElement(CompensatoryApprovedUser, {
          userName,
          eventName: "Registro de horas",
          hours: compensatory.hours,
          eventDate: new Date().toISOString(),
          approvedDate: new Date().toISOString(),
          newTotalHours,
          dashboardUrl: buildUrl("/"),
        }),
      });
    } catch (emailError) {
      console.error("Error enviando email:", emailError);
    }

    revalidatePath("/");

    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    console.error("Error en updateApproveRegister:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
