"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/utils/supabase/client";

export default function CompleteInvitePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function complete() {
      const query = new URLSearchParams(window.location.search);
      const code = query.get("code");
      if (code) {
        router.replace(`/auth/callback?code=${encodeURIComponent(code)}&next=/welcome`);
        return;
      }

      const fragment = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = fragment.get("access_token");
      const refreshToken = fragment.get("refresh_token");
      window.history.replaceState(null, "", window.location.pathname);

      const supabase = createClient();
      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) throw sessionError;
      } else {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error("No se encontró una sesión de invitación");
      }

      if (!cancelled) {
        router.replace("/welcome");
        router.refresh();
      }
    }

    complete().catch(() => {
      if (!cancelled) setError("No se pudo activar la invitación. Pide al administrador que la reenvíe.");
    });
    return () => { cancelled = true; };
  }, [router]);

  return <main className="grid min-h-screen place-items-center bg-slate-50 px-5">
    <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Activando invitación</h1>
      <p className="mt-3 text-slate-600" role={error ? "alert" : undefined}>
        {error ?? "Estamos preparando tu acceso."}
      </p>
    </section>
  </main>;
}
