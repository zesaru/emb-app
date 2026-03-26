import React from "react";
import { render } from "@react-email/render";
import { Resend } from "resend";

import { createClient } from "@/utils/supabase/server";
import { getFromEmail, isEmailDeliveryEnabled } from "@/components/email/utils/email-config";

type SendOrCaptureEmailInput = {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  templateName: string;
  payload?: Record<string, unknown> | null;
  triggeredByUserId?: string | null;
};

function normalizeRecipients(recipients: string | string[]) {
  const values = Array.isArray(recipients) ? recipients : [recipients];
  return values.map((value) => value.trim()).filter(Boolean);
}

async function persistCapturedEmail(input: {
  deliveryMode: "captured" | "sent";
  from: string;
  recipients: string[];
  subject: string;
  html: string;
  templateName: string;
  payload?: Record<string, unknown> | null;
  triggeredByUserId?: string | null;
}) {
  const supabase = await createClient();

  if (typeof (supabase as any)?.from !== "function") {
    return;
  }

  const query = (supabase as any).from("dev_email_outbox");
  if (!query || typeof query.insert !== "function") {
    return;
  }

  const insertResult = query.insert({
    delivery_mode: input.deliveryMode,
    template_name: input.templateName,
    from_email: input.from,
    to_emails: input.recipients,
    subject: input.subject,
    html_body: input.html,
    text_body: null,
    payload_json: input.payload ?? null,
    triggered_by_user_id: input.triggeredByUserId ?? null,
  });

  if (!insertResult || typeof insertResult.select !== "function") {
    return;
  }

  const selectResult = insertResult.select();
  if (!selectResult || typeof selectResult.single !== "function") {
    return;
  }

  const { error } = await selectResult.single();
  if (error) {
    console.error("Failed to persist dev email outbox record:", error);
  }
}

export async function sendOrCaptureEmail(input: SendOrCaptureEmailInput) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = getFromEmail();
  const recipients = normalizeRecipients(input.to);
  const html = await render(input.react);
  const deliveryEnabled = isEmailDeliveryEnabled();
  const deliveryMode = deliveryEnabled ? "sent" : "captured";

  try {
    if (!deliveryEnabled) {
      await persistCapturedEmail({
        deliveryMode,
        from,
        recipients,
        subject: input.subject,
        html,
        templateName: input.templateName,
        payload: input.payload,
        triggeredByUserId: input.triggeredByUserId,
      });
    }
  } catch (error) {
    console.error("Failed to persist dev email outbox record:", error);
  }

  if (!deliveryEnabled) {
    console.info(`Email delivery skipped for ${input.templateName}`);
    return { success: true as const, deliveryMode };
  }

  await resend.emails.send({
    from,
    to: recipients.length <= 1 ? recipients[0] || "" : recipients,
    subject: input.subject,
    react: input.react,
  });

  return { success: true as const, deliveryMode };
}
