"use server";

import { revalidatePath } from "next/cache";

import { requireCurrentUserAdmin } from "@/lib/auth/admin-check";
import { uuidSchema } from "@/lib/validation/schemas";
import { createClient } from "@/utils/supabase/server";

const ERROR_MESSAGES: Record<string, string> = {
  NOT_AUTHORIZED: "No autorizado: se requieren privilegios de administrador",
  COMPENSATORIO_NOT_FOUND: "Solicitud no encontrada",
  ALREADY_CANCELLED: "La solicitud ya estaba cancelada",
  ALREADY_APPROVED: "No se puede eliminar una solicitud ya aprobada",
};

export default async function adminCancelCompensatorio(compensatorioId: string) {
  try {
    await requireCurrentUserAdmin();
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "No autorizado" };
  }

  try {
    uuidSchema.parse(compensatorioId);
  } catch {
    return { success: false, error: "Datos inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_cancel_compensatorio", {
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
