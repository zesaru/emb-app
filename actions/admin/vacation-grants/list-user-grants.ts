"use server";

import { adminVacationGrantListSchema } from "@/lib/validation/schemas";
import { requireAdminContext } from "@/actions/admin/users/shared";

type ListUserVacationGrantsInput = {
  userId: string;
};

export async function listUserVacationGrants(input: ListUserVacationGrantsInput) {
  try {
    const data = adminVacationGrantListSchema.parse(input);
    const { supabase } = await requireAdminContext();

    const { data: grants, error } = await supabase
      .from("vacation_grants")
      .select("*")
      .eq("user_id", data.userId)
      .order("granted_on", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false as const, error: "No se pudieron obtener los grants del usuario" };
    }

    return {
      success: true as const,
      data: grants ?? [],
    };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Error inesperado listando grants",
    };
  }
}

export default listUserVacationGrants;
