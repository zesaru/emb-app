'use client';

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import Messages from "./messages";
import { createClient } from "@/utils/supabase/client";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError || !data.user) {
        setError("No se pudo autenticar al usuario.");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("is_active")
        .eq("id", data.user.id)
        .single();

      if (profileError) {
        await supabase.auth.signOut();
        setError("No se pudo cargar el perfil del usuario.");
        return;
      }

      const rawIsActive = (profile as { is_active?: string | boolean | null } | null)?.is_active;
      const isActive = typeof rawIsActive === "boolean"
        ? rawIsActive
        : rawIsActive == null
          ? true
          : ["true", "1", "yes", "activo", "active"].includes(String(rawIsActive).toLowerCase());

      if (!isActive) {
        await supabase.auth.signOut();
        setError("Usuario inactivo. Contacta al administrador.");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch (submitError) {
      console.error("Login failed:", submitError);
      setError("No se pudo autenticar al usuario.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid h-screen place-items-center">
      <div className="flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
        <form
          className="flex-1 flex flex-col w-full justify-center gap-2 text-foreground"
          onSubmit={handleSubmit}
        >
          <label className="text-md" htmlFor="email">
            Email
          </label>
          <input
            className="rounded-md px-4 py-2 bg-inherit border mb-6"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />
          <label className="text-md" htmlFor="password">
            Contraseña
          </label>
          <input
            className="rounded-md px-4 py-2 bg-inherit border mb-6"
            type="password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="********"
            required
          />
          <button
            disabled={isSubmitting}
            className="bg-green-700 rounded px-4 py-2 text-white mb-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Ingresando..." : "Ingresar"}
          </button>
          {error && (
            <p className="mt-4 p-4 bg-neutral-900 text-neutral-300 text-center">
              {error}
            </p>
          )}
          <Messages />
        </form>
      </div>
    </div>
  );
}
