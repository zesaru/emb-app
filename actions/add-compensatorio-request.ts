'use server';

import { createClient } from "@/utils/supabase/server";
import { Resend } from "resend";
import { revalidatePath } from "next/cache";
import { formatInTimeZone } from 'date-fns-tz';
import { compensatoryRequestSchema } from "@/lib/validation/schemas";
import { CompensatoryUseRequestAdmin } from "@/components/email/templates/compensatory/compensatory-use-request-admin";
import { getFromEmail, buildUrl } from "@/components/email/utils/email-config";
import React from "react";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Insert a new compensatory request into the database and send an email notification.
 * @param compensatory - An object containing the compensatory request data.
 * @returns An object with a success flag indicating if the operation was successful and an error object if the operation failed.
 */
export default async function UpdateCompensatorioResquest(compensatory: any) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const useridrequest = user?.id;

  if (!user) {
    return { success: false, error: "No autenticado" };
  }

  // Validar datos de entrada con Zod
  try {
    compensatoryRequestSchema.parse(compensatory);
  } catch (error: any) {
    return { success: false, error: error.errors?.[0]?.message || "Datos inválidos" };
  }

  const fecha = formatInTimeZone(compensatory.dob, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ssXXX');

  try {
    await supabase.rpc("insert_compensatory_rest", {
      p_user_id: useridrequest,
      p_t_time_start: compensatory.time_start,
      p_t_time_finish: compensatory.time_finish,
      p_compensated_hours_day: fecha,
      p_compensated_hours: compensatory.hours
    });
    const email = process.env.EMBPERUJAPAN_EMAIL || 'admin@example.com';
    try {
      const data = await resend.emails.send({
        from: getFromEmail(),
        to: email,
        subject: `Solicitud de Uso de Horas Compensatorias - ${user.email}`,
        react: React.createElement(CompensatoryUseRequestAdmin, {
          userName: user.email || 'Usuario',
          userEmail: user.email || 'usuario@example.com',
          hours: compensatory.hours,
          reasonDate: compensatory.dob,
          approvalUrl: buildUrl('/'),
        }),
      });

      revalidatePath(`/compensatorios/request/`);
      return {
        success: true,
      }
    } catch (error) {
      // No exponer errores sensibles en logs
      return { success: false, error: "Error enviando email" };
    }
  } catch (error) {
    return { success: false, error: "Error procesando solicitud" };
  }
}

