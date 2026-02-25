"use server";

import { revalidatePath } from "next/cache";

import { adminUserStatusSchema } from "@/lib/validation/schemas";
import { requireAdminContext } from "./shared";
import { toUsersTableUpdate } from "@/lib/users/user-mappers";

export async function reactivateAdminUser(input: { userId: string }) {
  try {
    const data = adminUserStatusSchema.parse(input);
    const { supabase } = await requireAdminContext();

    const { error } = await supabase
      .from("users")
      .update(toUsersTableUpdate({ isActive: true }) as any)
      .eq("id", data.userId);

    if (error) {
      return { success: false as const, error: "No se pudo reactivar el usuario" };
    }

    revalidatePath("/admin/users");
    return { success: true as const, message: "Usuario reactivado" };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Error inesperado reactivando usuario",
    };
  }
}

export default reactivateAdminUser;
