"use server";

import { createClient } from "@/utils/supabase/server";
import { emailSchema, passwordUpdateSchema } from "@/lib/validation/schemas";

/**
 * Actualiza la contraseña del usuario autenticado actual.
 *
 * NOTA DE SEGURIDAD:
 * - Solo permite al usuario cambiar su propia contraseña
 * - Requiere estar autenticado
 * - Valida el formato de la nueva contraseña
 *
 * @param data - Objeto con email (para verificación) y nueva contraseña
 * @returns Resultado de la operación
 */
export async function resetPassword(data: { email: string; password: string }) {
  const supabase = await createClient();

  // Obtener usuario autenticado
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "No autenticado: Debes iniciar sesión para cambiar tu contraseña",
    };
  }

  // Validar datos de entrada
  try {
    emailSchema.parse(data.email);
    passwordUpdateSchema.parse({ password: data.password });
  } catch (error) {
    return {
      success: false,
      error: "Datos inválidos: Email o contraseña no cumplen el formato requerido",
    };
  }

  // Verificar que el email coincida con el del usuario autenticado
  if (user.email !== data.email) {
    return {
      success: false,
      error: "No autorizado: Solo puedes cambiar tu propia contraseña",
    };
  }

  // Actualizar contraseña usando Supabase Auth admin API
  const { error: updateError } = await supabase.auth.updateUser({
    password: data.password,
  });

  if (updateError) {
    console.error("Error actualizando contraseña:", updateError);
    return {
      success: false,
      error: "Error al actualizar la contraseña. Por favor intenta nuevamente.",
    };
  }

  return {
    success: true,
    message: "Contraseña actualizada correctamente",
  };
}

/**
 * Función para administradores: resetear contraseña de cualquier usuario.
 * Requiere privilegios de administrador.
 *
 * @param data - Objeto con userId y nueva contraseña
 * @returns Resultado de la operación
 */
export async function adminResetPassword(data: {
  userId: string;
  password: string;
}) {
  const supabase = await createClient();

  // Obtener usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autenticado" };
  }

  // Verificar que sea admin - CRÍTICO PARA SEGURIDAD
  try {
    const { requireAdmin } = await import("@/lib/auth/admin-check");
    await requireAdmin(user.id);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "No autorizado",
    };
  }

  // Validar contraseña
  try {
    passwordUpdateSchema.parse({ password: data.password });
  } catch (error) {
    return { success: false, error: "Contraseña inválida" };
  }

  // Nota: Para resetear la contraseña de otro usuario en Supabase,
  // se necesita usar el service_role key (no el anon key).
  // Esta función debería implementarse en el servidor con service_role.
  return {
    success: false,
    error: "Función no implementada: Requiere service_role key",
  };
}

// Export por defecto para compatibilidad con código existente
export default resetPassword;
