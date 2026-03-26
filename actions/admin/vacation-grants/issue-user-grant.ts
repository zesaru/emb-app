"use server";

import { revalidatePath } from "next/cache";

import { requireAdminContext } from "@/actions/admin/users/shared";
import { normalizeUserRow } from "@/lib/users/user-mappers";
import { adminVacationGrantCreateSchema } from "@/lib/validation/schemas";
import { buildJapanVacationGrantDraft } from "@/lib/vacations/japan-vacation-grants";

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

    const draft = buildJapanVacationGrantDraft({
      userId: user.id,
      hireDate: user.hireDate,
      grantedOn: data.grantedOn,
      weeklyDays: user.weeklyDays,
      weeklyHours: user.weeklyHours,
      attendanceEligible: user.attendanceEligible,
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
