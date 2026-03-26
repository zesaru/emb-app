"use server";

import React from "react";
import { revalidatePath } from "next/cache";

import { requireCurrentUserAdmin } from "@/lib/auth/admin-check";
import { sendOrCaptureEmail } from "@/lib/email/dev-email-outbox";
import { positiveIntegerSchema, uuidSchema } from "@/lib/validation/schemas";
import { buildVacationGrantConsumptionPlan } from "@/lib/vacations/grant-consumption";
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
  const today = approvedDateIso.slice(0, 10);

  try {
    const { data: grantRows, error: grantsError } = await supabase
      .from("vacation_grants")
      .select("id, granted_on, expires_on, days_remaining")
      .eq("user_id", vacations.user_id)
      .gt("days_remaining", 0)
      .order("expires_on", { ascending: true })
      .order("granted_on", { ascending: true });

    if (grantsError) {
      return { success: false, error: "Error al consultar grants de vacaciones" };
    }

    const grantPlan = buildVacationGrantConsumptionPlan((grantRows as any) ?? [], vacations.days, today);
    const useGrantBalance = grantPlan.ok;

    if (!useGrantBalance && vacations.num_vacations < vacations.days) {
      return { success: false, error: "Usuario no tiene suficientes días de vacaciones" };
    }

    const { error: updateError } = await supabase
      .from("vacations")
      .update({
        approved_date: approvedDateIso,
        approvedby: approvedBy,
        approve_request: true,
      })
      .eq("id", vacations.id)
      .select();

    if (updateError) {
      return { success: false, error: "Error al actualizar el registro" };
    }

    let newVacationBalance = vacations.num_vacations - vacations.days;

    if (useGrantBalance) {
      for (const allocation of grantPlan.allocations) {
        const { error: grantUpdateError } = await supabase
          .from("vacation_grants")
          .update({
            days_remaining: allocation.resultingDaysRemaining,
          })
          .eq("id", allocation.grantId)
          .eq("user_id", vacations.user_id)
          .select();

        if (grantUpdateError) {
          return { success: false, error: "Error al descontar saldo del grant" };
        }
      }

      const { error: consumptionInsertError } = await supabase
        .from("vacation_grant_consumptions")
        .insert(
          grantPlan.allocations.map((allocation) => ({
            vacation_id: vacations.id,
            grant_id: allocation.grantId,
            user_id: vacations.user_id,
            days_used: allocation.daysUsed,
          })) as any
        )
        .select();

      if (consumptionInsertError) {
        return { success: false, error: "Error al registrar consumo de grants" };
      }

      newVacationBalance = grantPlan.remainingBalance;
    } else {
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({
          num_vacations: newVacationBalance,
        })
        .eq("id", vacations.user_id)
        .select();

      if (userUpdateError) {
        return { success: false, error: "Error al actualizar días del usuario" };
      }
    }

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
