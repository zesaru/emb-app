"use server";

import { requireAdminContext } from "@/actions/admin/users/shared";
import { normalizeUserRow } from "@/lib/users/user-mappers";
import { adminVacationGrantListSchema } from "@/lib/validation/schemas";
import { resolveJapanDueGrantDate } from "@/lib/vacations/japan-vacation-grants";
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

    if (user.grantMode === "manual") {
      return { success: false as const, error: "Este usuario requiere emisión manual de grants" };
    }

    const { data: grants, error: grantsError } = await supabase
      .from("vacation_grants")
      .select("granted_on")
      .eq("user_id", data.userId)
      .order("granted_on", { ascending: false })

    if (grantsError) {
      return { success: false as const, error: "No se pudo calcular el siguiente grant" };
    }

    const grantedOn = resolveJapanDueGrantDate(user.hireDate, new Date().toISOString().slice(0, 10));
    if (!grantedOn) return { success: false as const, error: "El primer grant legal todavía no está vigente" };
    if ((grants ?? []).some((grant) => grant.granted_on === grantedOn)) {
      return { success: false as const, error: `El grant legal del ${grantedOn} ya fue emitido` };
    }

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
