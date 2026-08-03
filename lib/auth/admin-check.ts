import { createClient } from '@/utils/supabase/server';

/**
 * Verifica que el usuario tenga rol de administrador.
 * Lanza un error si no es admin.
 *
 * @param userId - ID del usuario a verificar
 * @throws Error si el usuario no existe o no es admin
 */
export async function requireAdmin(userId: string): Promise<void> {
  const supabase = await createClient();

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
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("No autenticado: Se requiere sesión activa");
  }

  await requireAdmin(user.id);
}

/**
 * Verifica que un usuario esté activo en la tabla public.users.
 */
export async function requireUserActive(userId: string): Promise<void> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("is_active")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error("Error verificando estado del usuario");
  }

  const rawStatus = (data as { is_active?: string | boolean | null } | null)?.is_active;
  const isActive = typeof rawStatus === "boolean"
    ? rawStatus
    : rawStatus == null
      ? true
      : ["true", "1", "yes", "activo", "active"].includes(String(rawStatus).toLowerCase());

  if (!isActive) {
    throw new Error("Usuario inactivo");
  }
}

/**
 * Verifica que el usuario actual esté autenticado, activo y sea admin.
 */
export async function requireCurrentUserAdminAndActive(): Promise<string> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("No autenticado: Se requiere sesión activa");
  }

  await requireUserActive(user.id);
  await requireAdmin(user.id);

  return user.id;
}

/**
 * Verifica que el usuario tenga rol de super administrador (users.role = 'super_admin').
 * Lanza un error si no lo es.
 *
 * @param userId - ID del usuario a verificar
 * @throws Error si el usuario no existe o no es super admin
 */
export async function requireSuperAdmin(userId: string): Promise<void> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error("Error verificando permisos de super administrador");
  }

  if (!data) {
    throw new Error("Usuario no encontrado");
  }

  if (data.role !== "super_admin") {
    throw new Error("No autorizado: Se requieren privilegios de super administrador");
  }
}

/**
 * Verifica que el usuario tenga rol de super administrador.
 * Retorna true/false sin lanzar error.
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  try {
    await requireSuperAdmin(userId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Obtiene el usuario actual y verifica si es super admin.
 * Versión conveniente para usar en Server Actions.
 *
 * @throws Error si no hay usuario autenticado o no es super admin
 */
export async function requireCurrentUserSuperAdmin(): Promise<void> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("No autenticado: Se requiere sesión activa");
  }

  await requireSuperAdmin(user.id);
}

/**
 * Verifica que el usuario actual esté autenticado, activo y sea super admin.
 */
export async function requireCurrentUserSuperAdminAndActive(): Promise<string> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("No autenticado: Se requiere sesión activa");
  }

  await requireUserActive(user.id);
  await requireSuperAdmin(user.id);

  return user.id;
}

/**
 * Obtiene el usuario actual y verifica si es super admin, sin lanzar error.
 * Pensado para gating de UI en Server Components.
 */
export async function isCurrentUserSuperAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    return await isSuperAdmin(user.id);
  } catch {
    return false;
  }
}
