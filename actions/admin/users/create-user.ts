"use server";

import { revalidatePath } from "next/cache";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireCurrentUserSuperAdminAndActive } from "@/lib/auth/admin-check";
import { adminUserCreateSchema } from "@/lib/validation/schemas";
import { toUsersTableUpdate } from "@/lib/users/user-mappers";
import { sendUserInvitation } from "@/lib/email/send-user-invitation";
import { isEmailDeliveryEnabled } from "@/components/email/utils/email-config";
import { requireAdminContext } from "./shared";

function getInviteRedirectUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  return appUrl ? `${appUrl.replace(/\/$/, "")}/auth/complete-invite` : undefined;
}

type CreateAdminUserInput = {
  resumeUserId?: string;
  email: string;
  name: string;
  position?: string;
  role: "admin" | "user";
  provisioningMode: "invite" | "temporary_password";
  temporaryPassword?: string;
  hireDate?: string;
  isDiplomatic?: boolean;
  weeklyDays?: number | null;
  weeklyHours?: number | null;
  attendanceEligible?: boolean | null;
  grantMode?: "automatic" | "manual";
  manualNextGrantDate?: string | null;
  numVacations?: number;
  numCompensatorys?: number;
};

export async function createAdminUser(input: CreateAdminUserInput) {
  let authUserId: string | null = null;
  let emailMayHaveBeenSent = false;

  try {
    const data = adminUserCreateSchema.parse(input);
    const { supabase } = await requireAdminContext();
    if (data.role !== "user") {
      await requireCurrentUserSuperAdminAndActive();
    }
    const inviteRedirectUrl = data.provisioningMode === "invite" ? getInviteRedirectUrl() : undefined;
    if (data.provisioningMode === "invite" && !inviteRedirectUrl) {
      return { success: false as const, state: "failed" as const, error: "Falta configurar NEXT_PUBLIC_APP_URL para enviar invitaciones" };
    }
    if (data.provisioningMode === "invite" && !isEmailDeliveryEnabled()) {
      return { success: false as const, state: "failed" as const, error: "El envío de invitaciones está deshabilitado" };
    }
    const adminClient = getSupabaseAdminClient();

    let existingInviteAt: string | null = null;
    let existingAcceptedAt: string | null = null;
    if (data.resumeUserId) {
      const { data: existing, error: lookupError } = await adminClient.auth.admin.getUserById(data.resumeUserId);
      if (lookupError || !existing.user || existing.user.email?.toLowerCase() !== data.email.toLowerCase()) {
        return { success: false as const, state: "failed" as const, error: "No se encontró una cuenta pendiente con ese email" };
      }
      const originalMode = existing.user.user_metadata?.provisioning_mode;
      if (originalMode && originalMode !== data.provisioningMode) {
        return { success: false as const, state: "failed" as const, error: "El modo de alta no coincide con el de la cuenta pendiente" };
      }

      const { data: profile, error: profileLookupError } = await (adminClient
        .from("users") as any)
        .select("provisioning_status, provisioning_mode, invitation_sent_at")
        .eq("id", data.resumeUserId)
        .single();
      if (profileLookupError || profile?.provisioning_status !== "pending") {
        return { success: false as const, state: "failed" as const, error: "La cuenta ya no está pendiente de alta" };
      }
      if (profile.provisioning_mode && profile.provisioning_mode !== data.provisioningMode) {
        return { success: false as const, state: "failed" as const, error: "El modo de alta no coincide con el perfil pendiente" };
      }

      authUserId = existing.user.id;
      // generateLink sets invited_at before our mail transport runs. For new
      // invitations only the profile's sent timestamp proves delivery.
      existingInviteAt = profile.invitation_sent_at ?? (
        existing.user.user_metadata?.invitation_delivery === "m365"
          ? null
          : existing.user.invited_at ?? null
      );
      existingAcceptedAt = existing.user.email_confirmed_at ?? null;
      emailMayHaveBeenSent = Boolean(existingInviteAt);
    } else {
      const { data: created, error: createError } = await adminClient.auth.admin.createUser({
        email: data.email,
        ...(data.provisioningMode === "temporary_password" ? {
          password: data.temporaryPassword,
          email_confirm: true,
        } : {
          email_confirm: false,
        }),
        user_metadata: {
          name: data.name,
          provisioning_mode: data.provisioningMode,
          ...(data.provisioningMode === "invite" ? { invitation_delivery: "m365" } : {}),
        },
      });

      if (createError) {
        return { success: false as const, state: "failed" as const, error: createError.message || "No se pudo crear el usuario" };
      }

      authUserId = created.user?.id ?? null;
    }

    if (!authUserId) {
      return { success: false as const, state: "failed" as const, error: "No se obtuvo el ID del usuario creado en Auth" };
    }

    const profilePayload = {
      id: authUserId,
      email: data.email,
      invitation_status: data.provisioningMode === "invite" && !existingAcceptedAt ? "pending" : "accepted",
      is_active: false,
      provisioning_status: "pending",
      provisioning_mode: data.provisioningMode,
      ...toUsersTableUpdate({
        name: data.name,
        position: data.position,
        role: data.role,
        hireDate: data.hireDate,
        isDiplomatic: data.isDiplomatic,
        weeklyDays: data.weeklyDays,
        weeklyHours: data.weeklyHours,
        attendanceEligible: data.attendanceEligible,
        grantMode: data.grantMode,
        manualNextGrantDate: data.manualNextGrantDate ?? null,
        numVacations: data.numVacations ?? 0,
        numCompensatorys: data.numCompensatorys ?? 0,
      }),
    };

    const { error: profileError } = await supabase
      .from("users")
      .update(profilePayload as any)
      .eq("id", authUserId)
      .select("id")
      .single();

    if (profileError) {
      return {
        success: false as const,
        state: "incomplete" as const,
        userId: authUserId,
        emailMayHaveBeenSent,
        error: "Usuario creado en Auth, pero falló sincronizar perfil",
      };
    }

    if (data.provisioningMode === "invite" && !existingInviteAt && !existingAcceptedAt) {
      const dispatchStartedAt = new Date().toISOString();
      const claimQuery = () => (adminClient.from("users") as any)
        .update({ invitation_dispatch_started_at: dispatchStartedAt })
        .eq("id", authUserId)
        .eq("provisioning_status", "pending");
      const { data: initialClaim, error: claimError } = await claimQuery()
        .is("invitation_dispatch_started_at", null)
        .select("id")
        .maybeSingle();

      if (claimError) {
        return {
          success: false as const, state: "incomplete" as const,
          userId: authUserId, emailMayHaveBeenSent: false,
          error: "No se pudo reservar el envío de la invitación",
        };
      }

      let claimed = Boolean(initialClaim);
      if (!claimed) {
        const { data: currentProfile, error: currentProfileError } = await (adminClient.from("users") as any)
          .select("invitation_sent_at")
          .eq("id", authUserId)
          .single();
        if (currentProfileError || !currentProfile) {
          return {
            success: false as const, state: "incomplete" as const,
            userId: authUserId, emailMayHaveBeenSent: true,
            error: "No se pudo consultar si la invitación ya fue enviada",
          };
        }
        if (currentProfile.invitation_sent_at) {
          existingInviteAt = currentProfile.invitation_sent_at;
          emailMayHaveBeenSent = true;
        } else {
          const staleBefore = new Date(Date.now() - 5 * 60_000).toISOString();
          const { data: recoveredClaim, error: reclaimError } = await claimQuery()
            .lt("invitation_dispatch_started_at", staleBefore)
            .select("id")
            .maybeSingle();
          if (reclaimError) {
            return {
              success: false as const, state: "incomplete" as const,
              userId: authUserId, emailMayHaveBeenSent: false,
              error: "No se pudo verificar el estado de la invitación",
            };
          }
          claimed = Boolean(recoveredClaim);
        }
      }

      if (!claimed && !existingInviteAt) {
        return {
          success: false as const, state: "incomplete" as const,
          userId: authUserId, emailMayHaveBeenSent: true,
          error: "Ya hay un envío de invitación en curso; comprueba de nuevo en unos minutos",
        };
      }

      if (claimed) {
        const inviteResult = await sendUserInvitation({
          email: data.email,
          name: data.name,
          redirectTo: inviteRedirectUrl!,
        });
        emailMayHaveBeenSent = inviteResult.success || inviteResult.deliveryAttempted;
        if (!inviteResult.success) {
          return {
            success: false as const,
            state: "incomplete" as const,
            userId: authUserId,
            emailMayHaveBeenSent,
            error: inviteResult.error,
          };
        }
        const sentAt = new Date().toISOString();
        const { error: sentAtError } = await (adminClient.from("users") as any)
          .update({ invitation_sent_at: sentAt, invitation_last_sent_at: sentAt })
          .eq("id", authUserId);
        if (sentAtError) {
          return {
            success: false as const, state: "incomplete" as const,
            userId: authUserId, emailMayHaveBeenSent: true,
            error: "Invitación enviada, pero no se pudo registrar el envío",
          };
        }
        existingInviteAt = sentAt;
      }
    }

    const now = new Date().toISOString();
    const { error: activationError } = await supabase
      .from("users")
      .update({
        provisioning_status: "ready",
        is_active: true,
        ...(data.provisioningMode === "invite" ? {
          ...(existingInviteAt ? {
            invitation_sent_at: existingInviteAt,
            invitation_last_sent_at: existingInviteAt,
          } : {}),
          ...(existingAcceptedAt ? { invitation_accepted_at: existingAcceptedAt } : {}),
        } : {
          invitation_accepted_at: now,
        }),
      } as any)
      .eq("id", authUserId);

    if (activationError) {
      return {
        success: false as const,
        state: "incomplete" as const,
        userId: authUserId,
        emailMayHaveBeenSent,
        error: "Cuenta creada, pero no se pudo activar el perfil",
      };
    }

    revalidatePath("/admin/users");

    return {
      success: true as const,
      state: "created" as const,
      userId: authUserId,
      message: data.provisioningMode === "invite"
        ? "Usuario invitado correctamente"
        : "Usuario creado con contraseña temporal",
    };
  } catch (error) {
    if (authUserId) {
      return {
        success: false as const,
        state: "incomplete" as const,
        userId: authUserId,
        emailMayHaveBeenSent,
        error: "Usuario creado en Auth, pero no se pudo confirmar su perfil",
      };
    }
    return {
      success: false as const,
      state: "failed" as const,
      error: error instanceof Error ? error.message : "Error inesperado creando usuario",
    };
  }
}

export default createAdminUser;
