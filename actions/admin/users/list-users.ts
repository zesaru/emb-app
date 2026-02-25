"use server";

import { adminUserListFiltersSchema } from "@/lib/validation/schemas";
import { normalizeUserRow } from "@/lib/users/user-mappers";
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

    if (parsed.search) {
      const q = parsed.search.trim().toLowerCase();
      rows = rows.filter((row) =>
        row.email.toLowerCase().includes(q) ||
        (row.name || "").toLowerCase().includes(q)
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
