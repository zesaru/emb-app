import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, Clock3, PartyPopper } from "lucide-react";
import { markInvitationAccepted } from "@/actions/auth/mark-invitation-accepted";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await markInvitationAccepted();

  return <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#fef3c7,_transparent_28%),#f8fafc] px-5 py-12"><section className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_60px_-36px_rgba(15,23,42,.45)]"><div className="bg-slate-950 px-8 py-10 text-white"><p className="text-xs font-bold uppercase tracking-[.2em] text-amber-300">EMB</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">Bienvenido al Portal de Vacaciones y Compensatorios</h1><p className="mt-3 max-w-xl text-slate-300">Tu acceso está listo. Desde aquí podrás revisar y gestionar tus solicitudes de forma clara y segura.</p></div><div className="grid gap-4 p-8 sm:grid-cols-2"><article className="rounded-2xl border border-amber-100 bg-amber-50 p-5"><CalendarDays className="h-5 w-5 text-amber-700" /><h2 className="mt-3 font-semibold text-slate-900">Vacaciones</h2><p className="mt-1 text-sm text-slate-600">Consulta tu saldo y solicita tus próximos días de descanso.</p></article><article className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5"><Clock3 className="h-5 w-5 text-indigo-700" /><h2 className="mt-3 font-semibold text-slate-900">Compensatorios</h2><p className="mt-1 text-sm text-slate-600">Revisa horas aprobadas y descansos disponibles.</p></article></div><div className="flex items-center justify-between border-t border-slate-100 px-8 py-5"><span className="flex items-center gap-2 text-sm text-slate-500"><PartyPopper className="h-4 w-4 text-amber-600" /> Acceso activado</span><Button asChild><Link href="/">Ir a mi panel</Link></Button></div></section></main>;
}
