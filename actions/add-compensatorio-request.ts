'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { formatInTimeZone } from 'date-fns-tz';
import { compensatoryRequestSchema } from "@/lib/validation/schemas";
import { sendOrCaptureEmail } from "@/lib/email/dev-email-outbox";
import { CompensatoryUseRequestAdmin } from "@/components/email/templates/compensatory/compensatory-use-request-admin";
import { buildUrl, resolveEmailRecipients } from "@/components/email/utils/email-config";
import React from "react";
import { z } from "zod";

/**
 * Insert a new compensatory request into the database and send an email notification.
 * @param compensatory - An object containing the compensatory request data.
 * @returns An object with a success flag indicating if the operation was successful and an error object if the operation failed.
 */
type CompensatoryRequestInput = z.input<typeof compensatoryRequestSchema>;

type CompensatoryRequestResult =
  | { success: true; warning?: string }
  | { success: false; error: string };

export async function addCompensatorioRequest(
  compensatory: CompensatoryRequestInput
): Promise<CompensatoryRequestResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  const useridrequest = user?.id;

  if (authError || !user) {
    return { success: false, error: "No autenticado" };
  }

  let validated: {
    dob: Date;
    time_start: string;
    time_finish: string;
    hours: number;
  };

  // Validar datos de entrada con Zod
  try {
    validated = compensatoryRequestSchema.parse(compensatory);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors?.[0]?.message || "Datos inválidos" };
    }
    return { success: false, error: "Datos inválidos" };
  }

  const fecha = formatInTimeZone(validated.dob, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ssXXX');

  try {
    const { error: rpcError } = await supabase.rpc("insert_compensatory_rest", {
      p_user_id: useridrequest,
      p_t_time_start: validated.time_start,
      p_t_time_finish: validated.time_finish,
      p_compensated_hours_day: fecha,
      p_compensated_hours: validated.hours
    });

    if (rpcError) {
      return { success: false, error: "Error procesando solicitud" };
    }

    const email = process.env.EMBPERUJAPAN_EMAIL || 'admin@example.com';
    const recipients = resolveEmailRecipients(email, user.email);
    const { data: userProfile } = await supabase
      .from("users")
      .select("name")
      .eq("id", user.id)
      .single();
    const userName = userProfile?.name?.trim() || user.email || "Usuario";
    try {
      await sendOrCaptureEmail({
        to: recipients,
        subject: `Solicitud de Uso de Horas Compensatorias - ${userName}`,
        templateName: "CompensatoryUseRequestAdmin",
        triggeredByUserId: user.id,
        payload: {
          userName,
          userEmail: user.email || 'usuario@example.com',
          hours: validated.hours,
          reasonDate: validated.dob.toISOString(),
          approvalUrl: buildUrl('/'),
        },
        react: React.createElement(CompensatoryUseRequestAdmin, {
          userName,
          userEmail: user.email || 'usuario@example.com',
          hours: validated.hours,
          reasonDate: validated.dob.toISOString(),
          approvalUrl: buildUrl('/'),
        }),
      });

      revalidatePath(`/compensatorios/`);
      revalidatePath(`/compensatorios/request/`);
      return {
        success: true,
      }
    } catch (error) {
      // La solicitud ya fue registrada; el correo puede reintentarse sin duplicar la solicitud.
      revalidatePath(`/compensatorios/`);
      revalidatePath(`/compensatorios/request/`);
      return { success: true, warning: "Solicitud registrada, pero falló el envío de email" };
    }
  } catch (error) {
    return { success: false, error: "Error procesando solicitud" };
  }
}

// Backward-compatible alias while imports are migrated.
export const UpdateCompensatorioResquest = addCompensatorioRequest;
export default addCompensatorioRequest;

