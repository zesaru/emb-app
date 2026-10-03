"use server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { requireUserActive } from "@/lib/auth/admin-check";
import { invitationPasswordSchema, needsInvitationPassword } from "@/lib/auth/invitation-password";
import { revalidatePath } from "next/cache";

export async function markInvitationAccepted(input: unknown) {
  const parsed = invitationPasswordSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Tu sesión ha caducado. Abre de nuevo el enlace de invitación." };
  try {
    await requireUserActive(user.id);
  } catch {
    return { success: false as const, error: "El administrador debe terminar de preparar tu cuenta." };
  }

  const { data: profile, error: profileError } = await supabase.from("users")
    .select("provisioning_mode, invitation_status").eq("id", user.id).single();
  if (profileError || !profile || !needsInvitationPassword(profile)) {
    return { success: false as const, error: "No se encontró una invitación pendiente para tu cuenta." };
  }
  const { error: passwordError } = await supabase.auth.updateUser({ password: parsed.data.password });
  // If Auth succeeded but saving acceptance failed, retrying the same password is safe.
  if (passwordError && passwordError.code !== "same_password") {
    return { success: false as const, error: "No se pudo guardar la contraseña. Inténtalo de nuevo." };
  }
  const { error } = await (getSupabaseAdminClient()
    .from("users") as any)
    .update({ invitation_status: "accepted", invitation_accepted_at: new Date().toISOString() } as any)
    .eq("id", user.id)
    .eq("invitation_status", "pending");

  if (error) return { success: false as const, error: "La contraseña se guardó, pero falta completar la invitación. Reintenta con la misma contraseña." };
  revalidatePath("/welcome");
  return { success: true as const };
}
