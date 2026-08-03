"use server";

import { revalidatePath } from "next/cache";

import { requireCurrentUserSuperAdminAndActive } from "@/lib/auth/admin-check";
import { adminUserUpdateSchema } from "@/lib/validation/schemas";
import { toUsersTableUpdate } from "@/lib/users/user-mappers";
import { countActiveAdmins, getUserById, requireAdminContext } from "./shared";

const PRIVILEGED_ROLES = new Set(["admin", "super_admin"]);

type UpdateAdminUserInput = {
  id: string;
  name?: string;
  position?: string;
  role?: "admin" | "user" | "super_admin";
  hireDate?: string;
  isDiplomatic?: boolean;
  weeklyDays?: number | null;
  weeklyHours?: number | null;
  attendanceEligible?: boolean | null;
  grantMode?: "automatic" | "manual";
  manualNextGrantDate?: string | null;
  numVacations?: number;
  numCompensatorys?: number;
};

export async function updateAdminUser(input: UpdateAdminUserInput) {
  try {
    const data = adminUserUpdateSchema.parse(input);
    const { supabase, adminUserId } = await requireAdminContext();
    const target = await getUserById(data.id);

    const rolePrivilegeChanges =
      data.role !== undefined &&
      data.role !== target.role &&
      (PRIVILEGED_ROLES.has(data.role) || PRIVILEGED_ROLES.has(target.role));

    if (rolePrivilegeChanges) {
      // Otorgar o quitar admin/super_admin es exclusivo de un super admin, aunque
      // quien ejecuta ya haya pasado requireAdminContext (admin normal).
      await requireCurrentUserSuperAdminAndActive();
    }

    if (data.role && data.role !== target.role && PRIVILEGED_ROLES.has(target.role)) {
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
      position: data.position,
      role: data.role,
      hireDate: data.hireDate,
      isDiplomatic: data.isDiplomatic,
      weeklyDays: data.weeklyDays,
      weeklyHours: data.weeklyHours,
      attendanceEligible: data.attendanceEligible,
      grantMode: data.grantMode,
      manualNextGrantDate: data.manualNextGrantDate ?? null,
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
