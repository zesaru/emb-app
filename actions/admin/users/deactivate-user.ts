"use server";

import { revalidatePath } from "next/cache";

import { adminUserStatusSchema } from "@/lib/validation/schemas";
import { countActiveAdmins, getUserById, requireAdminContext } from "./shared";
import { toUsersTableUpdate } from "@/lib/users/user-mappers";

export async function deactivateAdminUser(input: { userId: string }) {
  try {
    const data = adminUserStatusSchema.parse(input);
    const { supabase, adminUserId } = await requireAdminContext();
    const target = await getUserById(data.userId);

    if (target.id === adminUserId) {
      return { success: false as const, error: "No puedes desactivarte a ti mismo" };
    }

    if (target.role === "admin") {
      const remainingAdmins = await countActiveAdmins(target.id);
      if (remainingAdmins < 1) {
        return { success: false as const, error: "No se puede desactivar al último administrador activo" };
      }
    }

    const { error } = await supabase
      .from("users")
      .update(toUsersTableUpdate({ isActive: false }) as any)
      .eq("id", data.userId);

    if (error) {
      return { success: false as const, error: "No se pudo desactivar el usuario" };
    }

    revalidatePath("/admin/users");
    return { success: true as const, message: "Usuario desactivado" };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Error inesperado desactivando usuario",
    };
  }
}

export default deactivateAdminUser;
