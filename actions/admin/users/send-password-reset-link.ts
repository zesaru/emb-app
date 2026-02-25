"use server";

import { adminUserPasswordResetLinkSchema } from "@/lib/validation/schemas";
import { createClient } from "@/utils/supabase/server";
import { getUserById, requireAdminContext } from "./shared";

export async function sendAdminUserPasswordResetLink(input: { userId: string }) {
  try {
    const data = adminUserPasswordResetLinkSchema.parse(input);
    await requireAdminContext();
    const target = await getUserById(data.userId);

    if (!target.email) {
      return { success: false as const, error: "El usuario no tiene email registrado" };
    }

    const supabase = await createClient();
    const redirectTo = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/reset`
      : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(target.email, redirectTo ? { redirectTo } : undefined);

    if (error) {
      return { success: false as const, error: error.message || "No se pudo enviar el enlace de restablecimiento" };
    }

    return { success: true as const, message: "Enlace de restablecimiento enviado" };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Error inesperado enviando enlace",
    };
  }
}

export default sendAdminUserPasswordResetLink;
