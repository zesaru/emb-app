"use client";

import { FormEvent, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Filter, Loader2, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CompensatoryFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    for (const key of ["month", "from", "to", "user", "status"]) {
      const value = String(formData.get(key) || "").trim();
      if (value && !(key === "status" && value === "all")) params.set(key, value);
    }

    if (params.has("month")) params.set("view", "report");
    startTransition(() => router.push(`${pathname}${params.toString() ? `?${params}` : ""}`));
  }

  function clear() {
    startTransition(() => router.push(pathname));
  }

  return (
    <form onSubmit={submit} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-amber-100/70 blur-3xl" />
      <div className="relative mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-amber-300">
          <Filter className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-950">Filtrar el registro</p>
          <p className="text-xs text-slate-500">Consulta por periodo, persona y estado</p>
        </div>
      </div>

      <div className="relative grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <label className="text-xs font-medium text-slate-600">
          Mes de reporte
          <div className="relative mt-1.5">
            <CalendarDays className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input name="month" type="month" defaultValue={searchParams.get("month") || ""} className="pl-9" />
          </div>
        </label>
        <label className="text-xs font-medium text-slate-600">
          Desde
          <Input name="from" type="date" defaultValue={searchParams.get("from") || ""} className="mt-1.5" />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Hasta
          <Input name="to" type="date" defaultValue={searchParams.get("to") || ""} className="mt-1.5" />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Usuario
          <div className="relative mt-1.5">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input name="user" placeholder="Nombre o correo" defaultValue={searchParams.get("user") || ""} className="pl-9" />
          </div>
        </label>
        <label className="text-xs font-medium text-slate-600">
          Estado
          <select name="status" defaultValue={searchParams.get("status") || "all"} className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="all">Todos</option>
            <option value="approved">Aprobados</option>
            <option value="pending">Pendientes</option>
          </select>
        </label>
      </div>

      <div className="relative mt-4 flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" onClick={clear} disabled={isPending}>
          <RotateCcw className="mr-2 h-4 w-4" /> Limpiar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
          Aplicar filtros
        </Button>
      </div>
    </form>
  );
}
