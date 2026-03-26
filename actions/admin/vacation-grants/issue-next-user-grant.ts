"use server";

import { requireAdminContext } from "@/actions/admin/users/shared";
import { normalizeUserRow } from "@/lib/users/user-mappers";
import { adminVacationGrantListSchema } from "@/lib/validation/schemas";
import { resolveJapanUpcomingGrantDate } from "@/lib/vacations/japan-vacation-grants";
import issueUserVacationGrant from "./issue-user-grant";

type IssueNextUserVacationGrantInput = {
  userId: string;
  notes?: string | null;
};

export async function issueNextUserVacationGrant(input: IssueNextUserVacationGrantInput) {
  try {
    const data = adminVacationGrantListSchema.parse({ userId: input.userId });
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

    const { data: latestGrant, error: latestGrantError } = await supabase
      .from("vacation_grants")
      .select("granted_on")
      .eq("user_id", data.userId)
      .order("granted_on", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestGrantError) {
      return { success: false as const, error: "No se pudo calcular el siguiente grant" };
    }

    const grantedOn = resolveJapanUpcomingGrantDate(user.hireDate, latestGrant?.granted_on ?? null);

    return issueUserVacationGrant({
      userId: data.userId,
      grantedOn,
      notes: input.notes ?? null,
    });
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Error inesperado creando el siguiente grant",
    };
  }
}

export default issueNextUserVacationGrant;
