"use server";

import type { VacationGrantHistoryItem } from "@/lib/vacations/grant-history";
import { adminVacationGrantListSchema } from "@/lib/validation/schemas";
import { requireAdminContext } from "@/actions/admin/users/shared";

type ListUserVacationGrantsInput = {
  userId: string;
};

export async function listUserVacationGrants(input: ListUserVacationGrantsInput) {
  try {
    const data = adminVacationGrantListSchema.parse(input);
    const { supabase } = await requireAdminContext();

    const grants: Omit<VacationGrantHistoryItem, "consumptions">[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data: batch, error } = await supabase
        .from("vacation_grants")
        .select("*")
        .eq("user_id", data.userId)
        .order("granted_on", { ascending: false })
        .order("id", { ascending: false })
        .range(offset, offset + 999);
      if (error || !batch) {
        return {
          success: false as const,
          error: "No se pudieron obtener las asignaciones del usuario",
        };
      }
      grants.push(...batch);
      if (batch.length < 1000) break;
    }

    const consumptionByGrant = new Map<
      string,
      { id: string; days_used: number; consumed_at: string }[]
    >();
    if (grants.length) {
      for (let offset = 0; ; offset += 1000) {
        const { data: batch, error } = await supabase
          .from("vacation_grant_consumptions")
          .select("id, grant_id, days_used, consumed_at")
          .eq("user_id", data.userId)
          .order("consumed_at", { ascending: false })
          .order("id", { ascending: false })
          .range(offset, offset + 999);
        if (error || !batch) {
          return { success: false as const, error: "No se pudo obtener el historial de consumos" };
        }
        for (const item of batch) {
          const items = consumptionByGrant.get(item.grant_id) ?? [];
          items.push({
            id: item.id,
            days_used: Number(item.days_used),
            consumed_at: item.consumed_at,
          });
          consumptionByGrant.set(item.grant_id, items);
        }
        if (batch.length < 1000) break;
      }
    }

    return {
      success: true as const,
      data: grants.map((grant) => ({
        ...grant,
        consumptions: consumptionByGrant.get(grant.id) ?? [],
      })),
    };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Error inesperado listando asignaciones",
    };
  }
}

export default listUserVacationGrants;
