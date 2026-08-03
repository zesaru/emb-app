import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizeUserRow } from "@/lib/users/user-mappers";

/**
 * Lista los emails de admins/super_admins activos, usando el cliente
 * service-role (sin sesión de usuario, pensado para contextos de cron).
 * Mismo criterio de rol/actividad que countActiveAdmins() en
 * actions/admin/users/shared.ts, extendido para traer el email.
 */
export async function getActiveAdminEmails(): Promise<string[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, email, admin, role, is_active");

  if (error || !data) {
    throw new Error(`No se pudo obtener la lista de administradores: ${error?.message ?? "sin datos"}`);
  }

  return data
    .map((row) => normalizeUserRow(row as any))
    .filter((row) => (row.role === "admin" || row.role === "super_admin") && row.isActive)
    .map((row) => row.email)
    .filter((email): email is string => Boolean(email));
}
