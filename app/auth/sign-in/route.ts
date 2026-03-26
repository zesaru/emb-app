import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { checkLoginRateLimit, resetRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Route handler para inicio de sesión.
 *
 * SEGURIDAD:
 * - Implementa rate limiting para prevenir ataques de fuerza bruta
 * - Limita a 5 intentos por IP cada 15 minutos
 * - Resetea el contador después de un login exitoso
 */
export async function POST(request: Request) {
  const requestUrl = new URL(request.url);

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const rateLimitResult = checkLoginRateLimit(ip);

  if (!rateLimitResult.success) {
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent("Demasiados intentos. Inténtalo más tarde.")}`,
      { status: 303 },
    );
  }

  const formData = await request.formData();
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));

  if (!email || !password || email.length > 255 || password.length > 100) {
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent("Email o contraseña inválidos.")}`,
      { status: 303 },
    );
  }

  const supabase = await createClient();

  const authResponse = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    },
  );

  const signInPayload = await authResponse.json().catch(() => null);
  const accessToken = signInPayload?.access_token as string | undefined;
  const refreshToken = signInPayload?.refresh_token as string | undefined;
  const signedInUserId = signInPayload?.user?.id as string | undefined;

  const authError =
    !authResponse.ok || !accessToken || !refreshToken
      ? new Error(
          signInPayload?.msg ||
            signInPayload?.error_description ||
            signInPayload?.error ||
            "auth_failed",
        )
      : null;

  if (authError) {
    const remaining = rateLimitResult.remaining ?? 0;
    const errorMessage =
      remaining < 2
        ? `No se pudo autenticar al usuario. Quedan ${remaining + 1} intentos.`
        : "No se pudo autenticar al usuario.";

    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(errorMessage)}`,
      { status: 303 },
    );
  }

  if (!accessToken || !refreshToken) {
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent("No se recibieron tokens de sesión válidos.")}`,
      { status: 303 },
    );
  }

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (sessionError) {
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent("No se pudo crear la sesión local.")}`,
      { status: 303 },
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("is_active")
    .eq("id", signedInUserId ?? "")
    .single();

  if (profileError) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent("No se pudo cargar el perfil del usuario.")}`,
      { status: 303 },
    );
  }

  const rawIsActive = (profile as { is_active?: string | boolean | null } | null)?.is_active;
  const isActive =
    typeof rawIsActive === "boolean"
      ? rawIsActive
      : rawIsActive == null
        ? true
        : ["true", "1", "yes", "activo", "active"].includes(
            String(rawIsActive).toLowerCase(),
          );

  if (!isActive) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent("Usuario inactivo. Contacta al administrador.")}`,
      { status: 303 },
    );
  }

  resetRateLimit(ip);

  return NextResponse.redirect(requestUrl.origin, {
    status: 303,
  });
}
