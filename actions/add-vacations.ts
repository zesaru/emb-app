"use server";

import { createClient } from "@/utils/supabase/server";
import { Resend } from 'resend';
import { revalidatePath } from "next/cache";
import { formatInTimeZone } from "date-fns-tz";
import { vacationSchema } from "@/lib/validation/schemas";
import { VacationRequestAdmin } from "@/components/email/templates/vacation/vacation-request-admin";
import {
  getFromEmail,
  buildUrl,
  getSystemEmail,
  resolveEmailRecipients,
} from "@/components/email/utils/email-config";
import React from "react";

const resend = new Resend(process.env.RESEND_API_KEY);

interface AddVacationResponse {
  success: boolean;
  error?: string;
}

/**
 * Adds a vacation request to the server.
 *
 * @param data - The vacation request data.
 * @returns An object indicating the success or failure of the request.
 */
export const addVacation = async (data: unknown): Promise<AddVacationResponse> => {
  if (!data || typeof data !== "object") {
    return { success: false, error: "Datos vacíos" };
  }

  const parsedData = vacationSchema.safeParse(data);
  if (!parsedData.success) {
    return {
      success: false,
      error: parsedData.error.errors[0]?.message || "Datos inválidos",
    };
  }

  const { start, finish, days } = parsedData.data;
  const startDate = new Date(start);
  const finishDate = new Date(finish);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(finishDate.getTime())) {
    return { success: false, error: "Fechas inválidas" };
  }

  const tokyoToday = formatInTimeZone(new Date(), "Asia/Tokyo", "yyyy-MM-dd");
  const tokyoStart = formatInTimeZone(startDate, "Asia/Tokyo", "yyyy-MM-dd");
  const tokyoFinish = formatInTimeZone(finishDate, "Asia/Tokyo", "yyyy-MM-dd");

  if (tokyoStart < tokyoToday) {
    return { success: false, error: "La fecha de inicio no puede ser en el pasado" };
  }

  if (tokyoFinish < tokyoStart) {
    return { success: false, error: "La fecha de fin no puede ser anterior a la fecha de inicio" };
  }

  const startAtTokyo = formatInTimeZone(startDate, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ssXXX');
  const finishAtTokyo = formatInTimeZone(finishDate, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ssXXX');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) return { success: false, error: "No autenticado" };

  const user_id = user.id;

  try {
    let insertedRows: Array<{ users_name?: string }> = [];
    const { data: rpcRows, error: rpcError } = await supabase
      .rpc('insertar_vacaciones', {
        p_start: startAtTokyo,
        p_finish: finishAtTokyo,
        p_days: days,
        p_id_user: user_id,
      });

    if (rpcError) {
      const isMissingRpc = rpcError.code === 'PGRST202';
      if (!isMissingRpc) {
        return { success: false, error: "No se pudo registrar la solicitud de vacaciones" };
      }

      const { data: fallbackRows, error: fallbackError } = await supabase
        .from('vacations')
        .insert({
          start: startAtTokyo,
          finish: finishAtTokyo,
          days,
          id_user: user_id,
          approve_request: false,
          request_date: formatInTimeZone(new Date(), "Asia/Tokyo", "yyyy-MM-dd HH:mm:ssXXX"),
        })
        .select('id')
        .limit(1);

      if (fallbackError || !fallbackRows || fallbackRows.length === 0) {
        return { success: false, error: "No se pudo registrar la solicitud de vacaciones" };
      }

      insertedRows = fallbackRows as Array<{ users_name?: string }>;
    } else if (Array.isArray(rpcRows) && rpcRows.length > 0) {
      insertedRows = rpcRows as Array<{ users_name?: string }>;
    } else {
      return { success: false, error: "No se pudo registrar la solicitud de vacaciones" };
    }

    const to = resolveEmailRecipients(getSystemEmail(), user.email);
    const userName = (insertedRows[0] as { users_name?: string })?.users_name || user.email || "Usuario";

    try {
      await resend.emails.send({
        from: getFromEmail(),
        to: to,
        subject: `Nueva Solicitud de Vacaciones - ${userName}`,
        react: React.createElement(VacationRequestAdmin, {
          userName,
          userEmail: user.email || 'usuario@example.com',
          startDate: startDate.toISOString(),
          finishDate: finishDate.toISOString(),
          days,
          approvalUrl: buildUrl('/'),
        }),
      });
    } catch {
      // No fallar la solicitud si solo falla el envío de email.
    }

    revalidatePath("/");
    revalidatePath("/vacaciones");
    revalidatePath("/vacaciones/new");
    return { success: true };
  } catch {
    return {
      success: false,
      error: "Error procesando solicitud",
    }
  }
}
