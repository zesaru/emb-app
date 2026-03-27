"use server";

import { adminUserListFiltersSchema } from "@/lib/validation/schemas";
import { normalizeUserRow } from "@/lib/users/user-mappers";
import { resolveJapanNextExpectedGrantDate } from "@/lib/vacations/japan-vacation-grants";
import { requireAdminContext } from "./shared";

type Filters = {
  search?: string;
  status?: "all" | "active" | "inactive";
  role?: "all" | "admin" | "user";
};

export async function listAdminUsers(filters: Filters = {}) {
  try {
    const parsed = adminUserListFiltersSchema.parse(filters);
    const { supabase } = await requireAdminContext();

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false as const, error: "No se pudieron obtener los usuarios" };
    }

    let rows = (data || []).map((row) => normalizeUserRow(row as any));

    const activeUserIds = rows.map((row) => row.id);
    const latestGrantByUserId = new Map<string, string>();

    if (activeUserIds.length > 0) {
      const { data: grants, error: grantsError } = await supabase
        .from("vacation_grants")
        .select("user_id, granted_on, rule_type, notes")
        .in("user_id", activeUserIds)
        .order("granted_on", { ascending: false });

      if (grantsError) {
        console.error("listAdminUsers: failed to fetch vacation_grants", grantsError);
      } else {
        for (const grant of grants || []) {
          if (!latestGrantByUserId.has(grant.user_id)) {
            latestGrantByUserId.set(grant.user_id, grant.granted_on);
          }
        }
      }
    }

    const today = new Date().toISOString().slice(0, 10);

    rows = rows.map((row) => ({
      ...row,
      nextExpectedGrantDate: row.hireDate
        ? row.grantMode === "manual"
          ? row.manualNextGrantDate
          : resolveJapanNextExpectedGrantDate(row.hireDate, latestGrantByUserId.get(row.id) ?? null, today)
        : row.grantMode === "manual"
          ? row.manualNextGrantDate
          : null,
    }));

    if (parsed.search) {
      const q = parsed.search.trim().toLowerCase();
      rows = rows.filter((row) =>
        row.email.toLowerCase().includes(q) ||
        (row.name || "").toLowerCase().includes(q) ||
        (row.position || "").toLowerCase().includes(q)
      );
    }

    if (parsed.status !== "all") {
      rows = rows.filter((row) => parsed.status === "active" ? row.isActive : !row.isActive);
    }

    if (parsed.role !== "all") {
      rows = rows.filter((row) => row.role === parsed.role);
    }

    return { success: true as const, data: rows };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Error inesperado listando usuarios",
    };
  }
}

export default listAdminUsers;
