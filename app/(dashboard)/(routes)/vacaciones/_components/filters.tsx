"use client";

import { type FormEvent, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function VacationFilters() {
  const router = useRouter(), pathname = usePathname(), searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget), params = new URLSearchParams();
    for (const key of ["from", "to", "user", "status"]) {
      const value = String(form.get(key) || "").trim();
      if (value && !(key === "status" && value === "all")) params.set(key, value);
    }
    startTransition(() => router.push(`${pathname}${params.size ? `?${params}` : ""}`));
  }
  return (
    <form key={searchParams.toString()} onSubmit={submit} className="mb-6 rounded-lg border border-gray-200 bg-white p-5">
      <p className="mb-4 text-sm text-slate-600">Filtra por fecha de inicio, persona y estado. Los indicadores incluyen todas las solicitudes que coinciden con los filtros.</p>
      <div className="grid gap-3 md:grid-cols-4">
        <label className="text-sm">Inicio desde<Input name="from" type="date" defaultValue={searchParams.get("from") || ""} /></label>
        <label className="text-sm">Inicio hasta<Input name="to" type="date" defaultValue={searchParams.get("to") || ""} /></label>
        <label className="text-sm">Usuario<Input name="user" placeholder="Nombre o correo" defaultValue={searchParams.get("user") || ""} /></label>
        <div className="text-sm"><label htmlFor="vacation-status">Estado</label>
          <select id="vacation-status" name="status" defaultValue={searchParams.get("status") || "all"} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="all">Todos</option><option value="approved">Aprobados</option><option value="pending">Pendientes</option>
          </select>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="outline" disabled={pending} onClick={() => startTransition(() => router.push(pathname))}>Limpiar</Button>
        <Button type="submit" disabled={pending}>{pending ? "Cargando…" : "Aplicar filtros"}</Button>
      </div>
    </form>
  );
}
