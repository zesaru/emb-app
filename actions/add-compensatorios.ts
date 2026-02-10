"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Resend } from 'resend';
import { compensatorySchema } from "@/lib/validation/schemas";
import { CompensatoryRequestAdmin } from "@/components/email/templates/compensatory/compensatory-request-admin";
import { getFromEmail, buildUrl } from "@/components/email/utils/email-config";
import React from "react";

const resend = new Resend(process.env.RESEND_API_KEY);

export const addPost = async (formData: FormData) => {
  const eventName = formData.get("event_name");
  const hoursStr = formData.get("hours");
  const eventDate = formData.get("event_date");

  if (formData === null) return { success: false, error: "Datos vacíos" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) return { success: false, error: "No autenticado" };

  // Validar y convertir horas a número
  const hours = Number(hoursStr);
  if (isNaN(hours) || hours <= 0 || hours > 12) {
    return { success: false, error: "Horas deben estar entre 1 y 12" };
  }

  // Validar datos con Zod
  try {
    compensatorySchema.parse({
      eventName,
      eventDate,
      hours,
    });
  } catch (error: any) {
    return { success: false, error: error.errors?.[0]?.message || "Datos inválidos" };
  }

  try {
    const result = await supabase
      .from("compensatorys")
      .insert({
        event_name: eventName,
        hours: hours,
        event_date: eventDate,
        user_id: user.id,
      }
    ).select('*');

    const email = process.env.EMBPERUJAPAN_EMAIL || 'admin@example.com';

    if (result.statusText === 'Created' && result.data) {
      try {
        const compensatoryId = result.data[0]?.id;
        const data = await resend.emails.send({
          from: getFromEmail(),
          to: email,
          subject: `Nueva Solicitud de Compensatorio - ${user.email}`,
          react: React.createElement(CompensatoryRequestAdmin, {
            userName: user.email || 'Usuario',
            userEmail: user.email || 'usuario@example.com',
            eventName: eventName as string,
            hours: hours,
            eventDate: eventDate as string,
            approvalUrl: buildUrl(`/compensatorios/approvec/${compensatoryId}`),
          }),
        })
        return { success: true, data }
      } catch (error) {
        // No exponer errores sensibles
        return { success: true, data: result.data }
      }
    }
    revalidatePath(`/compensatorios/new`)
    return {
      success: true,
    };
  } catch (e) {
    return {
      success: false,
      error: "Error creando registro",
    }
  }
};
