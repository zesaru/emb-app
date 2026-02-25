"use server";

import { adminUserSetTemporaryPasswordSchema } from "@/lib/validation/schemas";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminContext } from "./shared";

export async function setAdminUserTemporaryPassword(input: { userId: string; password: string }) {
  try {
    const data = adminUserSetTemporaryPasswordSchema.parse(input);
    await requireAdminContext();
    const adminClient = getSupabaseAdminClient();

    const { error } = await adminClient.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });

    if (error) {
      return { success: false as const, error: error.message || "No se pudo actualizar la contraseña" };
    }

    return { success: true as const, message: "Contraseña temporal actualizada" };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Error inesperado actualizando contraseña",
    };
  }
}

export default setAdminUserTemporaryPassword;
