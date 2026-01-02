import { createClient } from '@/utils/supabase/server';

/**
 * Verifica que el usuario tenga rol de administrador.
 * Lanza un error si no es admin.
 *
 * @param userId - ID del usuario a verificar
 * @throws Error si el usuario no existe o no es admin
 */
export async function requireAdmin(userId: string): Promise<void> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("users")
    .select("admin")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error("Error verificando permisos de administrador");
  }

  if (!data) {
    throw new Error("Usuario no encontrado");
  }

  if (data.admin !== "admin") {
    throw new Error("No autorizado: Se requieren privilegios de administrador");
  }
}

/**
 * Verifica que el usuario tenga rol de administrador.
 * Retorna true/false sin lanzar error.
 *
 * @param userId - ID del usuario a verificar
 * @returns true si el usuario es admin, false en caso contrario
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    await requireAdmin(userId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Obtiene el usuario actual y verifica si es admin.
 * Versión conveniente para usar en Server Actions.
 *
 * @throws Error si no hay usuario autenticado o no es admin
 */
export async function requireCurrentUserAdmin(): Promise<void> {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("No autenticado: Se requiere sesión activa");
  }

  await requireAdmin(user.id);
}
