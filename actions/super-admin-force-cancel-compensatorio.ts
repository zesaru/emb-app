"use server";

import { revalidatePath } from "next/cache";

import { requireCurrentUserSuperAdmin } from "@/lib/auth/admin-check";
import { uuidSchema } from "@/lib/validation/schemas";
import { createClient } from "@/utils/supabase/server";

const ERROR_MESSAGES: Record<string, string> = {
  NOT_AUTHORIZED: "No autorizado: se requieren privilegios de super administrador",
  COMPENSATORIO_NOT_FOUND: "Solicitud no encontrada",
  ALREADY_CANCELLED: "La solicitud ya estaba cancelada",
};

export default async function superAdminForceCancelCompensatorio(compensatorioId: string) {
  try {
    await requireCurrentUserSuperAdmin();
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "No autorizado" };
  }

  try {
    uuidSchema.parse(compensatorioId);
  } catch {
    return { success: false, error: "Datos inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("super_admin_force_cancel_compensatorio", {
    p_id: compensatorioId,
  } as any);

  if (error) {
    const message = ERROR_MESSAGES[error.message] || "Error al eliminar la solicitud";
    return { success: false, error: message };
  }

  revalidatePath("/");
  revalidatePath("/compensatorios");

  return { success: true };
}
