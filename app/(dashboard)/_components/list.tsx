import {
  BriefcaseBusiness,
  CalendarDays,
  MoreVertical,
  Search,
  Sparkles,
  TimerReset,
  UserPlus,
  Users,
} from "lucide-react";

import getUsers from "@/actions/getUsers";

function formatJoinDate(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getVacationStatus(days: number) {
  if (days <= 0) {
    return {
      label: "Sin saldo",
      accent: "bg-destructive",
      text: "text-destructive/80",
    };
  }

  if (days <= 7) {
    return {
      label: "Por vencer",
      accent: "bg-tertiary",
      text: "text-tertiary/80",
    };
  }

  return {
    label: "Disponible",
    accent: "bg-primary",
    text: "text-primary/80",
  };
}

function getInitials(name: string | null, email: string | null) {
  const source = name?.trim() || email?.trim() || "Usuario";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default async function List() {
  const users = await getUsers();
  const totalUsers = users.length;

  const totalVacationDays = users.reduce(
    (sum, user) => sum + Number(user.num_vacations ?? 0),
    0
  );
  const totalCompHours = users.reduce(
    (sum, user) => sum + Number(user.num_compensatorys ?? 0),
    0
  );
  const lowBalanceUsers = users.filter(
    (user) => Number(user.num_vacations ?? 0) <= 7
  ).length;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-surface-container-low p-2 shadow-ambient">
        <div className="absolute inset-x-12 top-0 h-28 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-8 top-12 h-40 w-40 rounded-full bg-secondary-container/70 blur-3xl" />

        <div className="relative rounded-[1.75rem] bg-surface-container-lowest px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary-container px-3 py-1 text-xs font-medium text-secondary-container-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                Reporte editorial del equipo
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl [font-family:Manrope,Inter,ui-sans-serif,sans-serif]">
                  Directorio de empleados
                </h2>
                <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Gestiona información del personal activo no diplomático, sus
                  saldos vacacionales y horas compensatorias desde una vista
                  más limpia y ejecutiva.
                </p>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <label className="relative block min-w-[18rem]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar empleado..."
                  className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest py-2.5 pl-10 pr-4 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-ambient transition hover:opacity-95"
              >
                <UserPlus className="h-4 w-4" />
                Agregar empleado
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[1.75rem] bg-surface-container p-2">
          <div className="rounded-[1.5rem] bg-surface-container-lowest p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Equipo activo
                </p>
                <p className="mt-3 text-3xl font-semibold text-foreground [font-family:Manrope,Inter,ui-sans-serif,sans-serif]">
                  {totalUsers}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Plantilla disponible para seguimiento operativo.
                </p>
              </div>

              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-[1.75rem] bg-surface-container p-2">
          <div className="rounded-[1.5rem] bg-surface-container-lowest p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Saldo vacacional total
                </p>
                <p className="mt-3 text-3xl font-semibold text-foreground [font-family:Manrope,Inter,ui-sans-serif,sans-serif]">
                  {totalVacationDays}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Días acumulados entre colaboradores activos.
                </p>
              </div>

              <div className="rounded-2xl bg-secondary-container p-3 text-secondary-container-foreground">
                <CalendarDays className="h-5 w-5" />
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-[1.75rem] bg-surface-container p-2">
          <div className="rounded-[1.5rem] bg-surface-container-lowest p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Horas compensatorias
                </p>
                <p className="mt-3 text-3xl font-semibold text-foreground [font-family:Manrope,Inter,ui-sans-serif,sans-serif]">
                  {totalCompHours}h
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {lowBalanceUsers} colaborador(es) con saldo bajo de vacaciones
                </p>
              </div>

              <div className="rounded-2xl bg-tertiary/10 p-3 text-tertiary">
                <TimerReset className="h-5 w-5" />
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-[2rem] bg-surface-container-low p-2 shadow-ambient">
        <div className="overflow-hidden rounded-[1.75rem] bg-surface-container-lowest">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead>
                <tr className="bg-surface-container-low/70">
                  <th className="px-6 py-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Nombre
                  </th>
                  <th className="px-6 py-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Cargo
                  </th>
                  <th className="px-6 py-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Saldo vacaciones
                  </th>
                  <th className="px-6 py-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Compensatorios
                  </th>
                  <th className="px-6 py-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Fecha de ingreso
                  </th>
                  <th className="px-6 py-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Estado
                  </th>
                  <th className="px-6 py-5 text-right text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody>
                {users.map((user, index) => {
                  const vacationDays = Number(user.num_vacations ?? 0);
                  const compensatoryHours = Number(user.num_compensatorys ?? 0);
                  const vacationStatus = getVacationStatus(vacationDays);
                  const isEven = index % 2 === 0;

                  return (
                    <tr
                      key={user.id}
                      className={`transition-colors hover:bg-surface-bright ${
                        isEven ? "bg-surface-container-lowest" : "bg-surface"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {getInitials(user.name, user.email)}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {user.name || "Sin nombre"}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                          <BriefcaseBusiness className="h-4 w-4 text-primary/70" />
                          {user.position || "Sin cargo"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-8 w-1 rounded-full ${vacationStatus.accent}`}
                          />
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {vacationDays} días
                            </p>
                            <p
                              className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${vacationStatus.text}`}
                            >
                              {vacationStatus.label}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                            compensatoryHours > 0
                              ? "bg-secondary-container text-secondary-container-foreground"
                              : "bg-surface-container text-muted-foreground"
                          }`}
                        >
                          {compensatoryHours}h acumuladas
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {formatJoinDate(user.hire_date || user.created_at)}
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-surface-container px-3 py-1 text-xs font-medium text-foreground">
                          Activo
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-surface-container-low hover:text-primary"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="mx-auto max-w-md space-y-3">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container text-primary">
                          <Users className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground [font-family:Manrope,Inter,ui-sans-serif,sans-serif]">
                          No hay empleados para mostrar
                        </h3>
                        <p className="text-sm leading-6 text-muted-foreground">
                          Cuando existan usuarios activos no diplomáticos, esta
                          vista mostrará el directorio con sus saldos de
                          vacaciones y horas compensatorias.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>
  );
}
