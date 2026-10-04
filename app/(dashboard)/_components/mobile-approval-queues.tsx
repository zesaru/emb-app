"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { CalendarDays, Clock3, TimerReset } from "lucide-react";
import type { CompensatorysWithUser, VacationsWithUser } from "@/types/collections";
import { formatVacationDate } from "@/lib/vacations/dates";
import { CompensatoryRequestActions } from "./data-table-row-actions";
import { CompensatoryRestActions } from "./data-table-row-actions-hours";
import { VacationRequestActions } from "./data-table-row-actions-vacations";
import { VacationsApprovalContext } from "./vacations-approval-context";

type Request = (CompensatorysWithUser | VacationsWithUser) & {
  user_name?: string | null;
  user_id?: string | null;
};

function person(request: Request) {
  return request.user_name || request.user1?.name || request.users?.[0]?.name || "Usuario";
}

function RequestCard({ request, href, detail, children }: {
  request: Request; href: string; detail: ReactNode; children: ReactNode;
}) {
  const name = person(request);
  return (
    <li className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 break-words font-semibold text-slate-950">{name}</p>
        <span className="shrink-0 rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">Pendiente</span>
      </div>
      <div className="mt-3 space-y-1 break-words text-sm text-slate-600">{detail}</div>
      <div className="mt-4 border-t border-slate-100 pt-3">
        {children}
        <Link href={href} aria-label={`Ver historial de ${name}`} className="mt-1 inline-flex min-h-11 items-center text-sm font-medium text-sky-800 underline underline-offset-4">
          Ver historial
        </Link>
      </div>
    </li>
  );
}

function Queue({ id, title, count, icon, children }: {
  id: string; title: string; count: number; icon: ReactNode; children: ReactNode;
}) {
  if (count === 0) return null;
  return (
    <section aria-labelledby={id} className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h2 id={id} className="text-base font-semibold text-slate-950">{title}</h2>
        <span aria-hidden="true" className="ml-auto rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">{count}</span>
      </div>
      <ul className="space-y-3">{children}</ul>
    </section>
  );
}

export function MobileApprovalQueues({ compensatorys, rests, vacations }: {
  compensatorys: CompensatorysWithUser[]; rests: CompensatorysWithUser[]; vacations: VacationsWithUser[];
}) {
  const [isApproving, setIsApproving] = useState(false);
  const total = compensatorys.length + rests.length + vacations.length;
  return (
    <div className="min-w-0 space-y-7 md:hidden">
      {total === 0 && <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">No tienes solicitudes pendientes de aprobación.</p>}
      <Queue id="mobile-compensatory-requests" title="Compensatorios por aprobar" count={compensatorys.length} icon={<Clock3 aria-hidden="true" className="h-5 w-5 text-amber-700" />}>
        {compensatorys.map((request) => (
          <RequestCard key={request.id} request={request} href={`/compensatorios/${request.user_id}`} detail={<>
            <p className="font-medium text-slate-800">{request.event_name || "Compensatorio"}</p>
            <p>{formatVacationDate(request.event_date)}</p>
            <p>{request.hours ?? 0} {request.hours === 1 ? "hora solicitada" : "horas solicitadas"}</p>
          </>}><CompensatoryRequestActions request={request} /></RequestCard>
        ))}
      </Queue>
      <Queue id="mobile-compensatory-rests" title="Descansos por aprobar" count={rests.length} icon={<TimerReset aria-hidden="true" className="h-5 w-5 text-sky-700" />}>
        {rests.map((request) => (
          <RequestCard key={request.id} request={request} href={`/compensatorios/${request.user_id}`} detail={<>
            <p>{formatVacationDate(request.compensated_hours_day)}</p>
            <p>{request.t_time_start?.slice(0, 5) || "—"} – {request.t_time_finish?.slice(0, 5) || "—"}</p>
            <p>{request.compensated_hours ?? 0} {request.compensated_hours === 1 ? "hora de descanso" : "horas de descanso"}</p>
          </>}><CompensatoryRestActions request={request} /></RequestCard>
        ))}
      </Queue>
      <VacationsApprovalContext.Provider value={{ isApproving, setIsApproving }}>
        <Queue id="mobile-vacation-requests" title="Vacaciones por aprobar" count={vacations.length} icon={<CalendarDays aria-hidden="true" className="h-5 w-5 text-emerald-700" />}>
          {vacations.map((request) => (
            <RequestCard key={request.id} request={request} href={`/vacaciones/${(request as Request).user_id ?? request.id_user}`} detail={<>
              <p>{formatVacationDate(request.start)} – {formatVacationDate(request.finish)}</p>
              <p>{request.days ?? 0} {request.days === 1 ? "día solicitado" : "días solicitados"}</p>
            </>}><VacationRequestActions request={request} /></RequestCard>
          ))}
        </Queue>
      </VacationsApprovalContext.Provider>
    </div>
  );
}
