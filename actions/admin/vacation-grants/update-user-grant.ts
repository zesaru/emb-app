"use server";

import { revalidatePath } from "next/cache";

import { requireAdminContext } from "@/actions/admin/users/shared";
import { adminVacationGrantUpdateSchema } from "@/lib/validation/schemas";

type UpdateUserVacationGrantInput = {
  id: string;
  userId: string;
  grantedOn: string;
  serviceBand: "6_months" | "1_year_6_months" | "2_years_6_months" | "3_years_6_months" | "4_years_6_months" | "5_years_6_months" | "6_years_6_months_plus";
  daysGranted: number;
  daysRemaining: number;
  expiresOn: string;
  ruleType: "standard" | "proportional" | "manual";
  notes?: string | null;
};

export async function updateUserVacationGrant(input: UpdateUserVacationGrantInput) {
  try {
    const data = adminVacationGrantUpdateSchema.parse(input);
    const { supabase } = await requireAdminContext();

    const { data: existingGrant, error: existingGrantError } = await supabase
      .from("vacation_grants")
      .select("id, user_id")
      .eq("id", data.id)
      .eq("user_id", data.userId)
      .maybeSingle();

    if (existingGrantError) {
      return { success: false as const, error: "No se pudo verificar el grant a editar" };
    }

    if (!existingGrant) {
      return { success: false as const, error: "Grant no encontrado para este usuario" };
    }

    const payload = {
      granted_on: data.grantedOn,
      service_band: data.serviceBand,
      days_granted: data.daysGranted,
      days_remaining: data.daysRemaining,
      expires_on: data.expiresOn,
      rule_type: data.ruleType,
      notes: data.notes ?? null,
    };

    const { data: updatedGrant, error: updateError } = await supabase
      .from("vacation_grants")
      .update(payload)
      .eq("id", data.id)
      .eq("user_id", data.userId)
      .select("*")
      .single();

    if (updateError || !updatedGrant) {
      return { success: false as const, error: "No se pudo actualizar el grant de vacaciones" };
    }

    revalidatePath("/admin/users");
    revalidatePath(`/vacaciones/${data.userId}`);

    return {
      success: true as const,
      data: updatedGrant,
      message: "Grant de vacaciones actualizado",
    };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Error inesperado actualizando grant",
    };
  }
}

export default updateUserVacationGrant;
