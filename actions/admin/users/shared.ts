"use server";

import { createClient } from "@/utils/supabase/server";
import { requireCurrentUserAdminAndActive } from "@/lib/auth/admin-check";
import { normalizeUserRow } from "@/lib/users/user-mappers";

export async function requireAdminContext() {
  const adminUserId = await requireCurrentUserAdminAndActive();
  const supabase = await createClient();
  return { supabase, adminUserId };
}

export async function getUserById(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) {
    throw new Error("Usuario no encontrado");
  }

  return normalizeUserRow(data as any);
}

export async function countActiveAdmins(excludeUserId?: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("users").select("id, admin, role, is_active");

  if (error) {
    throw new Error("No se pudo verificar cantidad de administradores");
  }

  return (data || [])
    .map((row) => normalizeUserRow(row as any))
    .filter((row) => row.role === "admin" && row.isActive && row.id !== excludeUserId)
    .length;
}
