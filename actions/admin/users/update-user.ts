"use server";

import { revalidatePath } from "next/cache";

import { adminUserUpdateSchema } from "@/lib/validation/schemas";
import { toUsersTableUpdate } from "@/lib/users/user-mappers";
import { countActiveAdmins, getUserById, requireAdminContext } from "./shared";

type UpdateAdminUserInput = {
  id: string;
  name?: string;
  role?: "admin" | "user";
  numVacations?: number;
  numCompensatorys?: number;
};

export async function updateAdminUser(input: UpdateAdminUserInput) {
  try {
    const data = adminUserUpdateSchema.parse(input);
    const { supabase, adminUserId } = await requireAdminContext();
    const target = await getUserById(data.id);

    if (data.role && data.role !== target.role && target.role === "admin") {
      if (target.id === adminUserId) {
        return { success: false as const, error: "No puedes cambiar tu propio rol de administrador" };
      }

      const remainingAdmins = await countActiveAdmins(target.id);
      if (remainingAdmins < 1) {
        return { success: false as const, error: "No se puede quitar el rol al último administrador activo" };
      }
    }

    const payload = toUsersTableUpdate({
      name: data.name,
      role: data.role,
      numVacations: data.numVacations,
      numCompensatorys: data.numCompensatorys,
    });

    const { error } = await supabase.from("users").update(payload as any).eq("id", data.id);

    if (error) {
      return { success: false as const, error: "No se pudo actualizar el usuario" };
    }

    revalidatePath("/admin/users");
    return { success: true as const, message: "Usuario actualizado" };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Error inesperado actualizando usuario",
    };
  }
}

export default updateAdminUser;
