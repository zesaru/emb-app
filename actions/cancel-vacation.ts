"use server";

import { revalidatePath } from "next/cache";

import { uuidSchema } from "@/lib/validation/schemas";
import { createClient } from "@/utils/supabase/server";

const ERROR_MESSAGES: Record<string, string> = {
  VACATION_NOT_FOUND: "Solicitud no encontrada",
  NOT_OWNER: "No autorizado: esta solicitud no te pertenece",
  ALREADY_CANCELLED: "La solicitud ya estaba cancelada",
  ALREADY_APPROVED: "No se puede cancelar una solicitud ya aprobada",
};

export default async function cancelVacation(vacationId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autenticado" };
  }

  try {
    uuidSchema.parse(vacationId);
  } catch {
    return { success: false, error: "Datos inválidos" };
  }

  const { error } = await supabase.rpc("cancel_own_vacation", {
    p_vacation_id: vacationId,
  } as any);

  if (error) {
    const message = ERROR_MESSAGES[error.message] || "Error al cancelar la solicitud";
    return { success: false, error: message };
  }

  revalidatePath(`/vacaciones/${user.id}`);
  revalidatePath("/vacaciones");
  revalidatePath("/");

  return { success: true };
}
