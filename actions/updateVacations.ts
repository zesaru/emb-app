"use server";

import React from "react";
import { revalidatePath } from "next/cache";

import { requireCurrentUserAdmin } from "@/lib/auth/admin-check";
import { sendOrCaptureEmail } from "@/lib/email/dev-email-outbox";
import { positiveIntegerSchema, uuidSchema } from "@/lib/validation/schemas";
import { VacationApprovedUser } from "@/components/email/templates/vacation/vacation-approved-user";
import { buildUrl, resolveEmailRecipients } from "@/components/email/utils/email-config";
import { createClient } from "@/utils/supabase/server";

interface VacationInput {
  id: string;
  user_id: string;
  email: string;
  num_vacations: number;
  days: number;
}

export default async function UpdateVacations(vacations: VacationInput) {
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
    uuidSchema.parse(vacations.id);
    uuidSchema.parse(vacations.user_id);
    positiveIntegerSchema.parse(vacations.days);

    if (vacations.days < 1 || vacations.days > 30) {
      return { success: false, error: "Dias debe estar entre 1 y 30" };
    }
  } catch {
    return { success: false, error: "Datos inválidos" };
  }

  const approvedBy = user.id;
  const approvedDateIso = new Date().toISOString();

  try {
    const { data: approvalRows, error: approvalError } = await supabase.rpc(
      "approve_vacation_with_grants",
      {
        p_vacation_id: vacations.id,
        p_user_id: vacations.user_id,
        p_days: vacations.days,
        p_approved_by: approvedBy,
        p_approved_at: approvedDateIso,
        p_legacy_balance: vacations.num_vacations,
        p_allow_legacy_fallback: true,
      } as any,
    );

    if (approvalError) {
      const errorMessage = approvalError.message || "";

      if (
        errorMessage.includes("INSUFFICIENT_GRANT_BALANCE") ||
        errorMessage.includes("INSUFFICIENT_LEGACY_BALANCE")
      ) {
        return { success: false, error: "Usuario no tiene suficientes días de vacaciones" };
      }

      if (errorMessage.includes("VACATION_ALREADY_CONSUMED")) {
        return { success: false, error: "La vacación ya fue procesada previamente" };
      }

      return { success: false, error: "Error al aprobar y consumir saldo de vacaciones" };
    }

    const approval = Array.isArray(approvalRows) ? approvalRows[0] : approvalRows;
    const useGrantBalance = Boolean(approval?.used_grant_balance);
    const newVacationBalance = Number(approval?.remaining_balance ?? (vacations.num_vacations - vacations.days));

    try {
      const { data: vacationData } = await supabase
        .from("vacations")
        .select("start, finish")
        .eq("id", vacations.id)
        .single();

      const { data: userProfile } = await supabase
        .from("users")
        .select("name")
        .eq("id", vacations.user_id)
        .single();

      const userName = userProfile?.name?.trim() || vacations.email;

      await sendOrCaptureEmail({
        to: resolveEmailRecipients(vacations.email, vacations.email),
        subject: "Tu solicitud de vacaciones ha sido aprobada",
        templateName: "VacationApprovedUser",
        triggeredByUserId: user.id,
        payload: {
          userName,
          startDate: vacationData?.start || approvedDateIso,
          finishDate: vacationData?.finish || approvedDateIso,
          days: vacations.days,
          approvedDate: approvedDateIso,
          newVacationBalance,
          calendarUrl: buildUrl("/calendar"),
        },
        react: React.createElement(VacationApprovedUser, {
          userName,
          startDate: vacationData?.start || approvedDateIso,
          finishDate: vacationData?.finish || approvedDateIso,
          days: vacations.days,
          approvedDate: approvedDateIso,
          newVacationBalance,
          calendarUrl: buildUrl("/calendar"),
        }),
      });
    } catch (emailError) {
      console.error("Error enviando email:", emailError);
    }

    revalidatePath("/");
    revalidatePath("/admin/users");
    revalidatePath(`/vacaciones/${vacations.user_id}`);

    return {
      success: true,
      usedGrantBalance: useGrantBalance,
      remainingGrantBalance: useGrantBalance ? newVacationBalance : null,
    };
  } catch (error) {
    console.error("Error en UpdateVacations:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
