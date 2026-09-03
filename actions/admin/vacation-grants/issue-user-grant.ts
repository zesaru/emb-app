"use server";

import { revalidatePath } from "next/cache";

import { requireAdminContext } from "@/actions/admin/users/shared";
import { normalizeUserRow } from "@/lib/users/user-mappers";
import { adminVacationGrantCreateSchema } from "@/lib/validation/schemas";
import {
  buildJapanVacationGrantDraft,
  resolveJapanDueGrantDate,
} from "@/lib/vacations/japan-vacation-grants";

type IssueUserVacationGrantInput = {
  userId: string;
  grantedOn: string;
  notes?: string | null;
};

function mapGrantDraftError(reason: string) {
  switch (reason) {
    case "attendance_pending":
      return "La elegibilidad de asistencia (80%) sigue pendiente para este usuario";
    case "attendance_ineligible":
      return "El usuario no es elegible por asistencia para este grant";
    case "invalid_schedule":
      return "No se puede determinar la regla legal con la jornada actual del usuario";
    case "grant_before_eligibility":
      return "La fecha del grant es anterior al primer hito legal de 6 meses";
    default:
      return "No se pudo construir el grant";
  }
}

export async function issueUserVacationGrant(input: IssueUserVacationGrantInput) {
  try {
    const data = adminVacationGrantCreateSchema.parse(input);
    const { supabase } = await requireAdminContext();

    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.userId)
      .single();

    if (userError || !userRow) {
      return { success: false as const, error: "Usuario no encontrado" };
    }

    const user = normalizeUserRow(userRow as any);

    if (!user.hireDate) {
      return { success: false as const, error: "El usuario no tiene fecha de ingreso configurada" };
    }

    if (user.attendanceEligible === false) {
      return { success: false as const, error: "El usuario no es elegible por asistencia para este grant" };
    }

    // For the standard schedule, an administrator may issue only the next
    // statutory grant and only once that entitlement date has arrived.
    // Manual-mode users retain an explicit exception path.
    if (user.grantMode !== "manual") {
      const { data: grants, error: grantsError } = await supabase
        .from("vacation_grants")
        .select("granted_on")
        .eq("user_id", user.id)
        .order("granted_on", { ascending: false });

      if (grantsError) {
        return { success: false as const, error: "No se pudo verificar el calendario legal de grants" };
      }

      const today = new Date().toISOString().slice(0, 10);
      const dueDate = resolveJapanDueGrantDate(user.hireDate, today);
      if (!dueDate) {
        return { success: false as const, error: "El primer grant legal todavía no está vigente" };
      }

      if ((grants ?? []).some((grant) => grant.granted_on === dueDate)) {
        return { success: false as const, error: `El grant legal del ${dueDate} ya fue emitido` };
      }

      if (data.grantedOn !== dueDate) {
        return { success: false as const, error: `La fecha debe coincidir con el hito legal pendiente: ${dueDate}` };
      }

    }

    const draft = buildJapanVacationGrantDraft({
      userId: user.id,
      hireDate: user.hireDate,
      grantedOn: data.grantedOn,
      weeklyDays: user.weeklyDays,
      weeklyHours: user.weeklyHours,
      // Until attendance reconciliation is implemented, a pending review is
      // treated as eligible. An explicit administrative "false" still blocks
      // a grant, preserving the existing exception path.
      attendanceEligible: user.attendanceEligible ?? true,
      notes: data.notes ?? null,
    });

    if (!draft.ok) {
      return { success: false as const, error: mapGrantDraftError(draft.reason) };
    }

    const { data: existingGrant, error: existingGrantError } = await supabase
      .from("vacation_grants")
      .select("id")
      .eq("user_id", draft.grant.user_id)
      .eq("granted_on", draft.grant.granted_on)
      .eq("service_band", draft.grant.service_band)
      .maybeSingle();

    if (existingGrantError) {
      return { success: false as const, error: "No se pudo verificar grants existentes" };
    }

    if (existingGrant) {
      return { success: false as const, error: "Ya existe un grant para ese usuario, fecha y tramo legal" };
    }

    const { data: insertedGrant, error: insertError } = await supabase
      .from("vacation_grants")
      .insert(draft.grant as any)
      .select("*")
      .single();

    if (insertError?.code === "23505") {
      return { success: false as const, error: "El grant legal ya fue emitido por otro proceso" };
    }

    if (insertError || !insertedGrant) {
      return { success: false as const, error: "No se pudo crear el grant de vacaciones" };
    }

    revalidatePath("/admin/users");

    return {
      success: true as const,
      data: insertedGrant,
      message: "Grant de vacaciones creado",
    };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Error inesperado creando grant",
    };
  }
}

export default issueUserVacationGrant;
