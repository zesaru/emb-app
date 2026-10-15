"use server";

import { adminUserListFiltersSchema } from "@/lib/validation/schemas";
import { normalizeUserRow } from "@/lib/users/user-mappers";
import { resolveJapanNextExpectedGrantDate } from "@/lib/vacations/japan-vacation-grants";
import { vacationToday } from "@/lib/vacations/dates";
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
    const today = vacationToday();

    const userIds = rows.map((row) => row.id);
    const latestGrantByUserId = new Map<string, {
      grantedOn: string;
      ruleType: "standard" | "proportional" | "manual" | null;
      notes: string | null;
    }>();
    const vacationSummaryByUserId = new Map<string, {
      balance: number;
      nextExpirationDate: string | null;
      expirations: Map<string, number>;
      specialNotes: Set<string>;
    }>();

    // Read bounded batches: PostgREST otherwise silently caps the complete balance.
    for (let offset = 0; userIds.length > 0; offset += 1000) {
      const { data: grants, error: grantsError } = await supabase
        .from("vacation_grants")
        .select("user_id, granted_on, rule_type, notes, days_remaining, expires_on")
        .in("user_id", userIds)
        .order("granted_on", { ascending: false })
        .order("id", { ascending: false })
        .range(offset, offset + 999);

      if (grantsError || !grants) {
        return { success: false as const, error: "No se pudieron obtener los saldos de vacaciones" };
      }
      for (const grant of grants) {
        if (!latestGrantByUserId.has(grant.user_id)) {
          latestGrantByUserId.set(grant.user_id, {
            grantedOn: grant.granted_on,
            ruleType: grant.rule_type ?? null,
            notes: grant.notes ?? null,
          });
        }

        // Only unexpired available days are part of the real balance.
        if (grant.days_remaining > 0 && grant.granted_on <= today && grant.expires_on >= today) {
          const summary = vacationSummaryByUserId.get(grant.user_id) ?? {
            balance: 0,
            nextExpirationDate: null,
            expirations: new Map<string, number>(),
            specialNotes: new Set<string>(),
          };
          const remaining = Number(grant.days_remaining);
          summary.balance += remaining;
          summary.expirations.set(grant.expires_on, (summary.expirations.get(grant.expires_on) ?? 0) + remaining);
          if (grant.rule_type === "manual" && grant.notes && /caso especial/i.test(grant.notes)) {
            summary.specialNotes.add(grant.notes);
          }
          if (!summary.nextExpirationDate || grant.expires_on < summary.nextExpirationDate) {
            summary.nextExpirationDate = grant.expires_on;
          }
          vacationSummaryByUserId.set(grant.user_id, summary);
        }
      }
      if (grants.length < 1000) break;
    }

    rows = rows.map((row) => ({
      ...row,
      vacationBalance: vacationSummaryByUserId.get(row.id)?.balance ?? 0,
      vacationExpirations: Array.from(vacationSummaryByUserId.get(row.id)?.expirations ?? [])
        .sort(([a], [b]) => a.localeCompare(b)).map(([date, days]) => ({ date, days })),
      vacationSpecialNotes: Array.from(vacationSummaryByUserId.get(row.id)?.specialNotes ?? []),
      nextVacationExpirationDate: vacationSummaryByUserId.get(row.id)?.nextExpirationDate ?? null,
      nextExpectedGrantDate: row.hireDate
        ? row.grantMode === "manual"
          ? row.manualNextGrantDate
          : resolveJapanNextExpectedGrantDate(row.hireDate, latestGrantByUserId.get(row.id) ?? null, today)
        : row.grantMode === "manual"
          ? row.manualNextGrantDate
          : null,
    }));

    return { success: true as const, data: rows };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Error inesperado listando usuarios",
    };
  }
}

export default listAdminUsers;
