"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { CalendarClock, Search, Users, SlidersHorizontal } from "lucide-react";
import listUserVacationGrants from "@/actions/admin/vacation-grants/list-user-grants";
import type { VacationGrantHistoryItem } from "@/lib/vacations/grant-history";
import type { AdminUserListItem } from "@/lib/users/user-mappers";
import {
  assignmentLabel,
  expiresWithin90Days,
  roleLabel,
  userReviewReasons,
} from "@/lib/users/directory";
import { formatVacationDate, vacationToday } from "@/lib/vacations/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Props = {
  users: AdminUserListItem[];
  businessDate: string;
  busy: boolean;
  error: boolean;
  onReload: () => void;
  onCreate: () => void;
  onEdit: (user: AdminUserListItem) => void;
  onManage: (user: AdminUserListItem) => void;
  tools: ReactNode;
  canEdit?: (user: AdminUserListItem) => boolean;
};
type Grant = VacationGrantHistoryItem;
const selectClass = "h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm";
const days = (n: number) => `${n} ${n === 1 ? "día" : "días"}`;

function Balance({ user, today }: { user: AdminUserListItem; today: string }) {
  return (
    <div className="space-y-1.5">
      <div className="text-lg font-semibold tabular-nums tracking-tight text-slate-900">
        {days(user.vacationBalance)}{" "}
        <span className="text-xs font-normal text-muted-foreground">disponibles</span>
      </div>
      {(user.vacationExpirations ?? []).map((bucket) => (
        <div key={bucket.date} className="text-xs leading-relaxed text-slate-600">
          <span className="font-medium tabular-nums">{days(bucket.days)}</span> vencen el{" "}
          <time dateTime={bucket.date}>{formatVacationDate(bucket.date)}</time>
        </div>
      ))}
      {user.vacationBalance === 0 && (
        <p className="text-xs text-muted-foreground">Sin días vigentes</p>
      )}
      {expiresWithin90Days(user.nextVacationExpirationDate, today) && (
        <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-900">
          Vence en 90 días o menos
        </Badge>
      )}
      {!!user.vacationSpecialNotes?.length && (
        <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-900">
          Caso especial documentado
        </Badge>
      )}
    </div>
  );
}

function NextAssignment({ user, today }: { user: AdminUserListItem; today: string }) {
  const date = user.isDiplomatic
    ? null
    : user.grantMode === "manual"
      ? user.manualNextGrantDate
      : user.nextExpectedGrantDate;
  const overdue = !user.isDiplomatic && user.grantMode === "manual" && date && date < today;
  return (
    <div className="space-y-1">
      <span
        className={`block text-xs ${overdue ? "font-medium text-amber-800" : "text-muted-foreground"}`}
      >
        {assignmentLabel(user, today)}
      </span>
      {date && (
        <time className="text-sm tabular-nums" dateTime={date}>
          {formatVacationDate(date)}
        </time>
      )}
      {!user.isDiplomatic && (
        <span className="block text-xs text-slate-600">
          {user.grantMode === "manual" ? "Manual" : "Automática"}
        </span>
      )}
    </div>
  );
}

function AccountState({ user }: { user: AdminUserListItem }) {
  return (
    <div className="space-y-1.5">
      <Badge variant={user.isActive ? "secondary" : "outline"}>
        {user.isActive ? "Activo" : "Inactivo"}
      </Badge>
      <span className="block text-xs text-muted-foreground">
        {user.provisioningStatus === "pending"
          ? "Alta pendiente"
          : user.invitationStatus === "pending"
            ? "Invitación pendiente"
            : user.isActive
              ? "Acceso habilitado"
              : "Acceso deshabilitado"}
      </span>
    </div>
  );
}

export function UsersDirectory({
  users,
  businessDate,
  busy,
  error,
  onReload,
  onCreate,
  onEdit,
  onManage,
  tools,
  canEdit = () => true,
}: Props) {
  const [today, setToday] = useState(businessDate);
  useEffect(() => {
    const update = () => setToday(vacationToday());
    update();
    const timer = setInterval(update, 60_000);
    return () => clearInterval(timer);
  }, []);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");
  const [role, setRole] = useState("all");
  const [mode, setMode] = useState("all");
  const [attention, setAttention] = useState("all");
  const [sort, setSort] = useState("name");
  const [detail, setDetail] = useState<AdminUserListItem | null>(null);
  const detailUser = users.find((u) => u.id === detail?.id) ?? detail;
  const focusReturn = useRef<HTMLButtonElement | null>(null);
  const [history, setHistory] = useState<Grant[]>([]);
  const [historyState, setHistoryState] = useState<"loading" | "ready" | "error">("loading");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!detailUser) return;
    let cancelled = false;
    setHistory([]);
    setHistoryState("loading");
    listUserVacationGrants({ userId: detailUser.id })
      .then((result) => {
        if (cancelled) return;
        if (!result.success) {
          setHistoryState("error");
          return;
        }
        setHistory(result.data);
        setHistoryState("ready");
      })
      .catch(() => {
        if (!cancelled) setHistoryState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [detailUser?.id, retry]);

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("es");
    return users
      .filter((u) => {
        if (q && ![u.name, u.email, u.position].some((v) => v?.toLocaleLowerCase("es").includes(q)))
          return false;
        if (status !== "all" && u.isActive !== (status === "active")) return false;
        if (role !== "all" && u.role !== role) return false;
        if (mode === "special" && !u.vacationSpecialNotes?.length) return false;
        if ((mode === "manual" || mode === "automatic") && (u.isDiplomatic || u.grantMode !== mode))
          return false;
        if (mode === "not-applicable" && !u.isDiplomatic) return false;
        if (attention === "review" && !userReviewReasons(u, today).length) return false;
        if (attention === "expiry" && !expiresWithin90Days(u.nextVacationExpirationDate, today))
          return false;
        return true;
      })
      .sort((a, b) => {
        const byName =
          (a.name || a.email).localeCompare(b.name || b.email, "es") || a.id.localeCompare(b.id);
        if (sort === "balance") return b.vacationBalance - a.vacationBalance || byName;
        if (sort === "expiry")
          return (
            (a.nextVacationExpirationDate ?? "9999").localeCompare(
              b.nextVacationExpirationDate ?? "9999",
            ) || byName
          );
        return byName;
      });
  }, [users, search, status, role, mode, attention, sort, today]);

  const resetFilters = () => {
    setSearch("");
    setStatus("active");
    setRole("all");
    setMode("all");
    setAttention("all");
    setSort("name");
  };
  const actions = (user: AdminUserListItem) => (
    <div className="flex flex-wrap gap-2 xl:flex-col xl:items-start">
      <Button
        type="button"
        size="sm"
        variant="outline"
        aria-label={`Ver vacaciones de ${user.name || user.email}`}
        onClick={(event) => {
          focusReturn.current = event.currentTarget;
          setHistory([]);
          setHistoryState("loading");
          setDetail(user);
        }}
      >
        Ver vacaciones
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={busy || !canEdit(user)}
        onClick={() => onEdit(user)}
        aria-label={`Editar a ${user.name || user.email}`}
      >
        {user.provisioningStatus === "pending" ? "Completar alta" : "Editar"}
      </Button>
    </div>
  );

  return (
    <div className="space-y-5" data-testid="users-directory">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-sky-50 p-2.5 text-sky-700">
            <Users className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-semibold text-slate-900">Directorio del personal</p>
            <p className="text-xs text-muted-foreground">
              Saldos y fechas al {formatVacationDate(today)} · Tokio
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={onReload} disabled={busy}>
            {busy ? "Actualizando…" : "Actualizar"}
          </Button>
          <Button type="button" onClick={onCreate} disabled={busy}>
            Crear usuario
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs font-medium text-slate-700 min-w-0 flex-1 sm:max-w-md">
          Buscar usuario
          <div className="relative mt-1.5">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />
            <Input
              className="pl-9"
              placeholder="Nombre, correo o cargo"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </label>
        <Button
          type="button"
          variant="outline"
          className="sm:hidden"
          aria-expanded={showFilters}
          aria-controls="directory-filters"
          onClick={() => setShowFilters((value) => !value)}
        >
          Filtros y orden
        </Button>
      </div>
      <div
        id="directory-filters"
        className={`${showFilters ? "grid" : "hidden"} gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-5`}
      >
        <label className="text-xs font-medium text-slate-700">
          Estado
          <select
            className={`${selectClass} mt-1.5`}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="active">Activos</option>
            <option value="all">Todos los estados</option>
            <option value="inactive">Inactivos</option>
          </select>
        </label>
        <label className="text-xs font-medium text-slate-700">
          Rol
          <select
            className={`${selectClass} mt-1.5`}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="all">Todos los roles</option>
            <option value="user">Usuario</option>
            <option value="admin">Administrador</option>
            <option value="super_admin">Superadministrador</option>
          </select>
        </label>
        <label className="text-xs font-medium text-slate-700">
          Asignación de vacaciones
          <select
            className={`${selectClass} mt-1.5`}
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="all">Todas las modalidades</option>
            <option value="automatic">Automática</option>
            <option value="manual">Manual</option>
            <option value="special">Caso especial documentado</option>
            <option value="not-applicable">No aplica · diplomáticos</option>
          </select>
        </label>
        <label className="text-xs font-medium text-slate-700">
          Revisión
          <select
            className={`${selectClass} mt-1.5`}
            value={attention}
            onChange={(e) => setAttention(e.target.value)}
          >
            <option value="all">Todos los usuarios</option>
            <option value="review">Datos pendientes de revisión</option>
            <option value="expiry">Vencimientos en 90 días</option>
          </select>
        </label>
        <label className="text-xs font-medium text-slate-700">
          Ordenar por
          <select
            className={`${selectClass} mt-1.5`}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="name">Nombre · A a Z</option>
            <option value="balance">Mayor saldo de vacaciones</option>
            <option value="expiry">Vencimiento más próximo</option>
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p role="status" className="text-sm text-muted-foreground">
          {error
            ? "No se pudo actualizar el directorio. Los datos disponibles pueden estar desactualizados."
            : `${filtered.length} de ${users.length} usuarios`}
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
          <SlidersHorizontal className="mr-2 h-4 w-4" aria-hidden="true" />
          Restablecer filtros
        </Button>
      </div>
      {error && users.length === 0 ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-900"
        >
          No se pudieron cargar los usuarios. Pulsa Actualizar para reintentar.
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 xl:block">
            <Table className="min-w-[900px]">
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead scope="col">Usuario</TableHead>
                  <TableHead scope="col">Cargo y rol</TableHead>
                  <TableHead scope="col">Estado y acceso</TableHead>
                  <TableHead scope="col">Vacaciones disponibles</TableHead>
                  <TableHead scope="col">Asignación</TableHead>
                  <TableHead scope="col">Compensatorios</TableHead>
                  <TableHead scope="col">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => (
                  <TableRow key={user.id} className="align-top">
                    <TableCell className="max-w-[220px] py-5">
                      <p className="font-semibold text-slate-900">{user.name || "Sin nombre"}</p>
                      <p className="mt-1 break-all text-xs text-muted-foreground">{user.email}</p>
                      {user.isDiplomatic && (
                        <Badge variant="outline" className="mt-2">
                          Diplomático
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-5">
                      <p className="text-sm">{user.position || "Sin cargo"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{roleLabel(user.role)}</p>
                    </TableCell>
                    <TableCell className="py-5">
                      <AccountState user={user} />
                    </TableCell>
                    <TableCell className="min-w-[225px] py-5">
                      <Balance user={user} today={today} />
                    </TableCell>
                    <TableCell className="py-5">
                      <NextAssignment user={user} today={today} />
                      {!!userReviewReasons(user, today).length && (
                        <p className="mt-2 text-xs text-amber-800">
                          Datos por revisar · ver detalle
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="py-5 tabular-nums">{user.numCompensatorys} h</TableCell>
                    <TableCell className="py-5">{actions(user)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:hidden">
            {filtered.map((user) => (
              <article
                key={user.id}
                aria-label={user.name || user.email}
                className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900">{user.name || "Sin nombre"}</h3>
                    <p className="mt-1 break-all text-xs text-muted-foreground">{user.email}</p>
                    <p className="mt-2 text-xs text-slate-600">
                      {user.position || "Sin cargo"} · {roleLabel(user.role)}
                    </p>
                    {user.isDiplomatic && <p className="mt-1 text-xs">Diplomático</p>}
                  </div>
                  <AccountState user={user} />
                </div>
                <div className="border-y border-slate-100 py-4">
                  <Balance user={user} today={today} />
                </div>
                <div className="my-4 flex justify-between gap-3">
                  <NextAssignment user={user} today={today} />
                  <p className="text-xs text-muted-foreground">
                    Compensatorios
                    <span className="mt-1 block text-sm font-medium text-slate-800">
                      {user.numCompensatorys} h
                    </span>
                  </p>
                </div>
                {!!userReviewReasons(user, today).length && (
                  <p className="mb-4 text-xs text-amber-800">
                    Datos pendientes de revisión · ver detalle
                  </p>
                )}
                {actions(user)}
              </article>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="font-medium">No hay usuarios que coincidan</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Prueba otra búsqueda o restablece los filtros.
              </p>
            </div>
          )}
        </>
      )}
      <details className="rounded-xl border border-slate-200 p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Herramientas administrativas
        </summary>
        <div className="mt-3 flex flex-wrap gap-2">{tools}</div>
      </details>
      <Dialog
        open={!!detailUser}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      >
        <DialogContent
          closeLabel="Cerrar detalle"
          className="max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-3xl overflow-y-auto rounded-xl p-5 sm:p-6"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            focusReturn.current?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>Vacaciones de {detailUser?.name || detailUser?.email}</DialogTitle>
            <DialogDescription>
              Detalle de bolsas, vencimientos y notas administrativas. Fechas de Tokio; el último
              día de vigencia está incluido.
            </DialogDescription>
          </DialogHeader>
          {detailUser && (
            <>
              <Balance user={detailUser} today={today} />
              <dl className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Ingreso</dt>
                  <dd>{formatVacationDate(detailUser.hireDate)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Jornada semanal</dt>
                  <dd>
                    {detailUser.weeklyDays ?? "Sin definir"} días /{" "}
                    {detailUser.weeklyHours ?? "Sin definir"} horas
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Asistencia 80%</dt>
                  <dd>
                    {detailUser.isDiplomatic
                      ? "No aplica"
                      : detailUser.attendanceEligible == null
                        ? "Pendiente de revisión"
                        : detailUser.attendanceEligible
                          ? "Elegible"
                          : "No elegible"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Modalidad</dt>
                  <dd>
                    {detailUser.isDiplomatic
                      ? "No aplica · diplomático"
                      : detailUser.grantMode === "manual"
                        ? "Manual"
                        : "Automática"}
                  </dd>
                </div>
              </dl>
              {!!userReviewReasons(detailUser, today).length && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                  <p className="mb-2 font-medium">Pendientes de revisión</p>
                  <ul className="list-disc space-y-1 pl-5">
                    {userReviewReasons(detailUser, today).map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
              <h3 className="flex items-center gap-2 font-semibold">
                <CalendarClock className="h-4 w-4" aria-hidden="true" />
                Asignaciones y consumos
              </h3>
              {historyState === "loading" && (
                <p role="status" className="text-sm">
                  Cargando asignaciones…
                </p>
              )}
              {historyState === "error" && (
                <div role="alert" className="rounded-lg border border-red-200 p-4 text-sm">
                  <p>No se pudo cargar el historial. No se muestran saldos parciales.</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-2"
                    onClick={() => setRetry((n) => n + 1)}
                  >
                    Reintentar historial
                  </Button>
                </div>
              )}
              {historyState === "ready" && history.length === 0 && (
                <p className="text-sm text-muted-foreground">No hay asignaciones registradas.</p>
              )}
              {historyState === "ready" &&
                history.map((g) => (
                  <section key={g.id} className="space-y-2 rounded-lg border p-4 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">Asignada el {formatVacationDate(g.granted_on)}</p>
                      <Badge variant="outline">
                        {g.granted_on > today
                          ? "Futura"
                          : g.expires_on < today
                            ? "Vencida"
                            : Number(g.days_remaining) === 0
                              ? "Agotada"
                              : "Vigente"}
                      </Badge>
                    </div>
                    <p>
                      {days(Number(g.days_granted))} otorgados ·{" "}
                      {days(Number(g.days_granted) - Number(g.days_remaining))} utilizados o
                      ajustados · {days(Number(g.days_remaining))} restantes
                    </p>
                    <p>
                      Vencimiento: <strong>{formatVacationDate(g.expires_on)}</strong> ·{" "}
                      {g.rule_type === "manual"
                        ? "Manual"
                        : g.rule_type === "standard"
                          ? "Estándar"
                          : "Proporcional"}
                    </p>
                    {!!g.consumptions?.length && (
                      <ul
                        className="space-y-1 border-t pt-2 text-xs text-slate-600"
                        aria-label="Consumos registrados"
                      >
                        {g.consumptions.map((c) => (
                          <li key={c.id}>
                            {days(c.days_used)} consumidos el {formatVacationDate(c.consumed_at)}
                          </li>
                        ))}
                      </ul>
                    )}
                    {g.notes && (
                      <div className="rounded-md bg-slate-50 p-3">
                        <p className="mb-1 text-xs font-medium text-slate-600">
                          Notas administrativas
                        </p>
                        <p className="whitespace-pre-wrap break-words text-xs leading-relaxed">
                          {g.notes}
                        </p>
                      </div>
                    )}
                  </section>
                ))}
              <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy || !canEdit(detailUser)}
                  onClick={() => {
                    focusReturn.current = null;
                    setDetail(null);
                    onEdit(detailUser);
                  }}
                >
                  Editar perfil
                </Button>
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    focusReturn.current = null;
                    setDetail(null);
                    onManage(detailUser);
                  }}
                >
                  Gestionar asignaciones
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
