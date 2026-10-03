import { z } from "zod";
import { passwordUpdateSchema } from "@/lib/validation/schemas";

export const invitationPasswordSchema = passwordUpdateSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export function needsInvitationPassword(profile: {
  provisioning_mode: string | null;
  invitation_status: string | null;
}) {
  return profile.provisioning_mode === "invite" && profile.invitation_status === "pending";
}
