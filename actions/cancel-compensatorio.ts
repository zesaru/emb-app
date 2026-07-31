"use server";

import { revalidatePath } from "next/cache";

import { uuidSchema } from "@/lib/validation/schemas";
import { createClient } from "@/utils/supabase/server";

const ERROR_MESSAGES: Record<string, string> = {
  COMPENSATORIO_NOT_FOUND: "Solicitud no encontrada",
  NOT_OWNER: "No autorizado: esta solicitud no te pertenece",
  ALREADY_CANCELLED: "La solicitud ya estaba cancelada",
  ALREADY_APPROVED: "No se puede cancelar una solicitud ya aprobada",
};

export default async function cancelCompensatorio(compensatorioId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autenticado" };
  }

  try {
    uuidSchema.parse(compensatorioId);
  } catch {
    return { success: false, error: "Datos inválidos" };
  }

  const { error } = await supabase.rpc("cancel_own_compensatorio", {
    p_id: compensatorioId,
  } as any);

  if (error) {
    const message = ERROR_MESSAGES[error.message] || "Error al cancelar la solicitud";
    return { success: false, error: message };
  }

  revalidatePath(`/compensatorios/${user.id}`);
  revalidatePath("/compensatorios");
  revalidatePath("/");

  return { success: true };
}
