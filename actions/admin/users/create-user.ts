"use server";

import { revalidatePath } from "next/cache";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { adminUserCreateSchema } from "@/lib/validation/schemas";
import { toUsersTableUpdate } from "@/lib/users/user-mappers";
import { requireAdminContext } from "./shared";

type CreateAdminUserInput = {
  email: string;
  name: string;
  role: "admin" | "user";
  provisioningMode: "invite" | "temporary_password";
  temporaryPassword?: string;
  numVacations?: number;
  numCompensatorys?: number;
};

export async function createAdminUser(input: CreateAdminUserInput) {
  try {
    const data = adminUserCreateSchema.parse(input);
    const { supabase } = await requireAdminContext();
    const adminClient = getSupabaseAdminClient();

    let authUserId: string | null = null;

    if (data.provisioningMode === "invite") {
      const { data: inviteData, error: inviteError } = await (adminClient.auth.admin as any)
        .inviteUserByEmail(data.email);

      if (inviteError) {
        return { success: false as const, error: inviteError.message || "No se pudo invitar al usuario" };
      }

      authUserId = inviteData?.user?.id ?? null;
    } else {
      const { data: created, error: createError } = await adminClient.auth.admin.createUser({
        email: data.email,
        password: data.temporaryPassword,
        email_confirm: true,
        user_metadata: { name: data.name },
      } as any);

      if (createError) {
        return { success: false as const, error: createError.message || "No se pudo crear el usuario" };
      }

      authUserId = created.user?.id ?? null;
    }

    if (!authUserId) {
      return { success: false as const, error: "No se obtuvo el ID del usuario creado en Auth" };
    }

    const profilePayload = {
      id: authUserId,
      email: data.email,
      ...toUsersTableUpdate({
        name: data.name,
        role: data.role,
        isActive: true,
        numVacations: data.numVacations ?? 0,
        numCompensatorys: data.numCompensatorys ?? 0,
      }),
    };

    const { error: profileError } = await supabase
      .from("users")
      .upsert(profilePayload as any, { onConflict: "id" });

    if (profileError) {
      return { success: false as const, error: "Usuario creado en Auth, pero falló sincronizar perfil" };
    }

    revalidatePath("/admin/users");

    return {
      success: true as const,
      message: data.provisioningMode === "invite"
        ? "Usuario invitado correctamente"
        : "Usuario creado con contraseña temporal",
    };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Error inesperado creando usuario",
    };
  }
}

export default createAdminUser;
