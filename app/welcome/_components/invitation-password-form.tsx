"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { markInvitationAccepted } from "@/actions/auth/mark-invitation-accepted";
import { invitationPasswordSchema } from "@/lib/auth/invitation-password";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export default function InvitationPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof invitationPasswordSchema>>({
    resolver: zodResolver(invitationPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: z.infer<typeof invitationPasswordSchema>) {
    setError(null);
    try {
      const result = await markInvitationAccepted(values);
      if (!result.success) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      form.reset();
      toast.success("Contraseña guardada. Tu acceso está listo.");
      router.refresh();
    } catch {
      const message = "No se pudo completar la invitación. Inténtalo de nuevo.";
      setError(message);
      toast.error(message);
    }
  }

  return <div className="border-t border-slate-100 p-8">
    <h2 className="text-lg font-semibold text-slate-900">Crea tu contraseña</h2>
    <p className="mt-2 text-sm text-slate-600">Guarda una contraseña de al menos 6 caracteres para poder iniciar sesión después.</p>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-5 space-y-4">
        <FormField control={form.control} name="password" render={({ field }) => <FormItem>
          <FormLabel>Nueva contraseña</FormLabel>
          <FormControl><Input type="password" autoComplete="new-password" maxLength={100} {...field} /></FormControl>
          <FormMessage />
        </FormItem>} />
        <FormField control={form.control} name="confirmPassword" render={({ field }) => <FormItem>
          <FormLabel>Confirmar contraseña</FormLabel>
          <FormControl><Input type="password" autoComplete="new-password" maxLength={100} {...field} /></FormControl>
          <FormMessage />
        </FormItem>} />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Guardando…" : "Guardar contraseña"}
        </Button>
      </form>
    </Form>
  </div>;
}
