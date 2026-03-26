"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";

import createAdminUser from "@/actions/admin/users/create-user";
import deactivateAdminUser from "@/actions/admin/users/deactivate-user";
import listAdminUsers from "@/actions/admin/users/list-users";
import reactivateAdminUser from "@/actions/admin/users/reactivate-user";
import sendAdminUserPasswordResetLink from "@/actions/admin/users/send-password-reset-link";
import setAdminUserTemporaryPassword from "@/actions/admin/users/set-temporary-password";
import updateAdminUser from "@/actions/admin/users/update-user";
import issueNextUserVacationGrant from "@/actions/admin/vacation-grants/issue-next-user-grant";
import issueUserVacationGrant from "@/actions/admin/vacation-grants/issue-user-grant";
import listUserVacationGrants from "@/actions/admin/vacation-grants/list-user-grants";
import updateUserVacationGrant from "@/actions/admin/vacation-grants/update-user-grant";
import type { AdminUserListItem } from "@/lib/users/user-mappers";
import {
  JAPAN_SERVICE_BANDS,
  resolveJapanNextExpectedGrantDate,
  type JapanServiceBand,
  type JapanVacationRuleType,
} from "@/lib/vacations/japan-vacation-grants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Props = {
  initialUsers: AdminUserListItem[];
  initialError: string | null;
};

type MessageState = { type: "success" | "error"; text: string } | null;
type VacationGrantItem = {
  id: string;
  granted_on: string;
  service_band: JapanServiceBand;
  days_granted: number;
  days_remaining: number;
  expires_on: string;
  rule_type: JapanVacationRuleType;
  notes: string | null;
};

const GRANT_RULE_TYPE_OPTIONS = ["standard", "proportional", "manual"] as const;

const emptyCreateForm = {
  email: "",
  name: "",
  position: "",
  role: "user" as "admin" | "user",
  provisioningMode: "invite" as "invite" | "temporary_password",
  temporaryPassword: "",
  hireDate: "",
  isDiplomatic: false,
  weeklyDays: "",
  weeklyHours: "",
  attendanceEligible: "pending" as "pending" | "eligible" | "ineligible",
  grantMode: "automatic" as "automatic" | "manual",
  numVacations: "0",
  numCompensatorys: "0",
};

function attendanceValueToForm(value: boolean | null) {
  if (value === true) return "eligible";
  if (value === false) return "ineligible";
  return "pending";
}

function attendanceFormToValue(value: FormDataEntryValue | string) {
  if (value === "eligible") return true;
  if (value === "ineligible") return false;
  return null;
}

function formatWorkPattern(user: AdminUserListItem) {
  const days = user.weeklyDays == null ? "-" : `${user.weeklyDays}d`;
  const hours = user.weeklyHours == null ? "-" : `${user.weeklyHours}h`;
  return `${days} / ${hours}`;
}

function formatAdminDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  // Deterministic UTC formatting avoids SSR/CSR locale mismatches during hydration.
  return `${date.getUTCDate()}/${date.getUTCMonth() + 1}/${date.getUTCFullYear()}`;
}

export function UsersAdminPanel({ initialUsers, initialError }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [message, setMessage] = useState<MessageState>(
    initialError ? { type: "error", text: initialError } : null
  );
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);

  const [editingUser, setEditingUser] = useState<AdminUserListItem | null>(null);
  const [tempPasswordUser, setTempPasswordUser] = useState<AdminUserListItem | null>(null);
  const [tempPassword, setTempPassword] = useState("");
  const [grantUser, setGrantUser] = useState<AdminUserListItem | null>(null);
  const [grantDate, setGrantDate] = useState("");
  const [grantNotes, setGrantNotes] = useState("");
  const [grantHistory, setGrantHistory] = useState<VacationGrantItem[]>([]);
  const [grantsLoading, setGrantsLoading] = useState(false);
  const [editingGrant, setEditingGrant] = useState<VacationGrantItem | null>(null);

  const filteredUsers = useMemo(() => {
    let result = [...users];
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((u) =>
        u.email.toLowerCase().includes(q) ||
        (u.name || "").toLowerCase().includes(q) ||
        (u.position || "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((u) => statusFilter === "active" ? u.isActive : !u.isActive);
    }
    if (roleFilter !== "all") {
      result = result.filter((u) => u.role === roleFilter);
    }

    result.sort((a, b) => {
      if (a.isDiplomatic !== b.isDiplomatic) {
        return Number(a.isDiplomatic) - Number(b.isDiplomatic);
      }

      const aName = (a.name || a.email).toLowerCase();
      const bName = (b.name || b.email).toLowerCase();
      return aName.localeCompare(bName, "es");
    });

    return result;
  }, [roleFilter, search, statusFilter, users]);

  const reloadUsers = () => {
    startTransition(async () => {
      const result = await listAdminUsers();

      if (!result.success) {
        setMessage({ type: "error", text: result.error });
        return;
      }

      setUsers(result.data);
    });
  };

  const setSuccess = (text: string) => setMessage({ type: "success", text });
  const setError = (text: string) => setMessage({ type: "error", text });

  const reloadGrantHistory = async (user: AdminUserListItem, grantIdToKeepEditing?: string | null) => {
    const result = await listUserVacationGrants({ userId: user.id });
    if (!result.success) {
      setError(result.error);
      return null;
    }

    const history = result.data as VacationGrantItem[];
    setGrantHistory(history);
    setGrantDate(
      user.hireDate
        ? resolveJapanNextExpectedGrantDate(
            user.hireDate,
            history[0]?.granted_on ?? null,
            new Date().toISOString().slice(0, 10),
          )
        : new Date().toISOString().slice(0, 10)
    );

    if (grantIdToKeepEditing) {
      setEditingGrant(history.find((grant) => grant.id === grantIdToKeepEditing) ?? null);
    }

    return history;
  };

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await createAdminUser({
        email: createForm.email,
        name: createForm.name,
        position: createForm.position || undefined,
        role: createForm.role,
        provisioningMode: createForm.provisioningMode,
        temporaryPassword: createForm.provisioningMode === "temporary_password" ? createForm.temporaryPassword : undefined,
        hireDate: createForm.hireDate || undefined,
        isDiplomatic: createForm.isDiplomatic,
        weeklyDays: createForm.weeklyDays === "" ? null : Number(createForm.weeklyDays),
        weeklyHours: createForm.weeklyHours === "" ? null : Number(createForm.weeklyHours),
        attendanceEligible: attendanceFormToValue(createForm.attendanceEligible),
        grantMode: createForm.grantMode,
        numVacations: Number(createForm.numVacations || "0"),
        numCompensatorys: Number(createForm.numCompensatorys || "0"),
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSuccess(result.message || "Usuario creado");
      setCreateOpen(false);
      setCreateForm(emptyCreateForm);
      reloadUsers();
    });
  };

  const handleUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingUser) return;
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "");
    const position = String(form.get("position") || "");
    const role = String(form.get("role") || "user") as "admin" | "user";
    const hireDate = String(form.get("hireDate") || "");
    const isDiplomatic = form.get("isDiplomatic") === "on";
    const weeklyDaysValue = String(form.get("weeklyDays") || "");
    const weeklyHoursValue = String(form.get("weeklyHours") || "");
    const attendanceEligible = attendanceFormToValue(String(form.get("attendanceEligible") || "pending"));
    const grantMode = String(form.get("grantMode") || "automatic") as "automatic" | "manual";
    const numVacations = Number(form.get("numVacations") || "0");
    const numCompensatorys = Number(form.get("numCompensatorys") || "0");

    startTransition(async () => {
      const result = await updateAdminUser({
        id: editingUser.id,
        name,
        position: position || undefined,
        role,
        hireDate: hireDate || undefined,
        isDiplomatic,
        weeklyDays: weeklyDaysValue === "" ? null : Number(weeklyDaysValue),
        weeklyHours: weeklyHoursValue === "" ? null : Number(weeklyHoursValue),
        attendanceEligible,
        grantMode,
        numVacations,
        numCompensatorys,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSuccess(result.message || "Usuario actualizado");
      setEditingUser(null);
      reloadUsers();
    });
  };

  const handleDeactivate = (userId: string) => {
    setMessage(null);
    startTransition(async () => {
      const result = await deactivateAdminUser({ userId });
      if (!result.success) return setError(result.error);
      setSuccess(result.message || "Usuario desactivado");
      reloadUsers();
    });
  };

  const handleReactivate = (userId: string) => {
    setMessage(null);
    startTransition(async () => {
      const result = await reactivateAdminUser({ userId });
      if (!result.success) return setError(result.error);
      setSuccess(result.message || "Usuario reactivado");
      reloadUsers();
    });
  };

  const handleResetLink = (userId: string) => {
    setMessage(null);
    startTransition(async () => {
      const result = await sendAdminUserPasswordResetLink({ userId });
      if (!result.success) return setError(result.error);
      setSuccess(result.message || "Enlace enviado");
    });
  };

  const handleSetTempPassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!tempPasswordUser) return;
    setMessage(null);

    startTransition(async () => {
      const result = await setAdminUserTemporaryPassword({
        userId: tempPasswordUser.id,
        password: tempPassword,
      });
      if (!result.success) return setError(result.error);
      setSuccess(result.message || "Contraseña actualizada");
      setTempPassword("");
      setTempPasswordUser(null);
    });
  };

  const openGrantDialog = (user: AdminUserListItem) => {
    setGrantUser(user);
    setGrantNotes("");
    setEditingGrant(null);
    setGrantHistory([]);
    setGrantsLoading(true);
    setGrantDate(
      user.hireDate
        ? resolveJapanNextExpectedGrantDate(
            user.hireDate,
            null,
            new Date().toISOString().slice(0, 10),
          )
        : new Date().toISOString().slice(0, 10)
    );

    startTransition(async () => {
      await reloadGrantHistory(user);
      setGrantsLoading(false);
    });
  };

  const handleIssueGrant = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!grantUser) return;
    setMessage(null);

    startTransition(async () => {
      const result = await issueUserVacationGrant({
        userId: grantUser.id,
        grantedOn: grantDate,
        notes: grantNotes || undefined,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      await reloadGrantHistory(grantUser);

      setSuccess(result.message || "Grant emitido");
      reloadUsers();
    });
  };

  const handleIssueNextGrant = () => {
    if (!grantUser) return;
    setMessage(null);

    startTransition(async () => {
      const result = await issueNextUserVacationGrant({
        userId: grantUser.id,
        notes: grantNotes || undefined,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      await reloadGrantHistory(grantUser);

      setSuccess(result.message || "Siguiente grant emitido");
      reloadUsers();
    });
  };

  const handleUpdateGrant = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!grantUser || !editingGrant) return;
    setMessage(null);

    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await updateUserVacationGrant({
        id: editingGrant.id,
        userId: grantUser.id,
        grantedOn: String(form.get("grantedOn") || ""),
        serviceBand: String(form.get("serviceBand") || "") as JapanServiceBand,
        daysGranted: Number(form.get("daysGranted") || "0"),
        daysRemaining: Number(form.get("daysRemaining") || "0"),
        expiresOn: String(form.get("expiresOn") || ""),
        ruleType: String(form.get("ruleType") || "") as JapanVacationRuleType,
        notes: String(form.get("notes") || "").trim() || null,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      await reloadGrantHistory(grantUser, editingGrant.id);
      setSuccess(result.message || "Grant actualizado");
      reloadUsers();
    });
  };

  const handleOpenGrantsFromEditor = (user: AdminUserListItem) => {
    setEditingUser(null);
    openGrantDialog(user);
  };

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={`rounded-md border px-3 py-2 text-sm ${
            message.type === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-3 md:grid-cols-5">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, email o cargo"
              className="md:col-span-2"
            />
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
            >
              <option value="all">Todos los roles</option>
              <option value="admin">Admin</option>
              <option value="user">Usuario</option>
            </select>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={reloadUsers} disabled={isPending} className="w-full">
                Refrescar
              </Button>
              <Button type="button" onClick={() => setCreateOpen(true)} className="w-full">
                Crear usuario
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="w-full overflow-x-auto rounded-md border">
        <Table className="min-w-[1380px]">
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Jornada</TableHead>
              <TableHead>Asistencia 80%</TableHead>
              <TableHead>Proximo grant</TableHead>
              <TableHead>Vacaciones</TableHead>
              <TableHead>Compensatorios</TableHead>
              <TableHead>Ingreso</TableHead>
              <TableHead>Diplomatico</TableHead>
              <TableHead className="min-w-[180px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="font-medium">{user.name || "Sin nombre"}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground">
                    {user.position || "Sin cargo"}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                    {user.role === "admin" ? "Admin" : "Usuario"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.isActive ? "secondary" : "outline"}>
                    {user.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell>{formatWorkPattern(user)}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      user.attendanceEligible == null
                        ? "outline"
                        : user.attendanceEligible
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {user.attendanceEligible == null ? "Pendiente" : user.attendanceEligible ? "Elegible" : "No elegible"}
                  </Badge>
                </TableCell>
                <TableCell>{user.grantMode === "manual" ? "Manual" : formatAdminDate(user.nextExpectedGrantDate)}</TableCell>
                <TableCell>{user.numVacations}</TableCell>
                <TableCell>{user.numCompensatorys}</TableCell>
                <TableCell>{formatAdminDate(user.hireDate || user.createdAt)}</TableCell>
                <TableCell>
                  <Badge variant={user.isDiplomatic ? "default" : "outline"}>
                    {user.isDiplomatic ? "Si" : "No"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => setEditingUser(user)} disabled={isPending}>
                      Editar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={12} className="text-center text-muted-foreground">
                  No hay usuarios para los filtros seleccionados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear usuario</DialogTitle>
            <DialogDescription>
              Puedes invitar por email o crear una cuenta con contraseña temporal.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <Input
              value={createForm.name}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Nombre"
              required
            />
            <Input
              value={createForm.position}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, position: e.target.value }))}
              placeholder="Cargo"
            />
            <Input
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="Email"
              required
            />
            <Input
              type="date"
              value={createForm.hireDate}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, hireDate: e.target.value }))}
            />
            <label className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={createForm.isDiplomatic}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, isDiplomatic: e.target.checked }))}
              />
              Es diplomático
            </label>
            <div className="grid grid-cols-3 gap-3">
              <Input
                type="number"
                min={1}
                max={7}
                value={createForm.weeklyDays}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, weeklyDays: e.target.value }))}
                placeholder="Días/semana"
              />
              <Input
                type="number"
                min={0}
                max={168}
                step="0.5"
                value={createForm.weeklyHours}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, weeklyHours: e.target.value }))}
                placeholder="Horas/semana"
              />
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={createForm.attendanceEligible}
                onChange={(e) => setCreateForm((prev) => ({
                  ...prev,
                  attendanceEligible: e.target.value as "pending" | "eligible" | "ineligible",
                }))}
              >
                <option value="pending">80% pendiente</option>
                <option value="eligible">80% elegible</option>
                <option value="ineligible">80% no elegible</option>
              </select>
            </div>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={createForm.grantMode}
              onChange={(e) => setCreateForm((prev) => ({
                ...prev,
                grantMode: e.target.value as "automatic" | "manual",
              }))}
            >
              <option value="automatic">Grant automático</option>
              <option value="manual">Grant manual</option>
            </select>
            <div className="grid grid-cols-2 gap-3">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={createForm.role}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, role: e.target.value as "admin" | "user" }))}
              >
                <option value="user">Usuario</option>
                <option value="admin">Admin</option>
              </select>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={createForm.provisioningMode}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, provisioningMode: e.target.value as any }))}
              >
                <option value="invite">Invitación email</option>
                <option value="temporary_password">Contraseña temporal</option>
              </select>
            </div>
            {createForm.provisioningMode === "temporary_password" && (
              <Input
                type="password"
                value={createForm.temporaryPassword}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, temporaryPassword: e.target.value }))}
                placeholder="Contraseña temporal (mín. 8)"
                required
              />
            )}
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                min={0}
                value={createForm.numVacations}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, numVacations: e.target.value }))}
                placeholder="Vacaciones"
              />
              <Input
                type="number"
                min={0}
                value={createForm.numCompensatorys}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, numCompensatorys: e.target.value }))}
                placeholder="Compensatorios"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Guardando..." : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
            <DialogDescription>
              Actualiza nombre, rol y saldos iniciales del perfil interno.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <form onSubmit={handleUpdate} className="space-y-3">
              <Input defaultValue={editingUser.name || ""} name="name" placeholder="Nombre" required />
              <Input defaultValue={editingUser.position || ""} name="position" placeholder="Cargo" />
              <Input value={editingUser.email} disabled readOnly />
              <Input
                name="hireDate"
                type="date"
                defaultValue={editingUser.hireDate || ""}
              />
              <div className="grid grid-cols-3 gap-3">
                <Input
                  name="weeklyDays"
                  type="number"
                  min={1}
                  max={7}
                  defaultValue={editingUser.weeklyDays ?? ""}
                  placeholder="Días/semana"
                />
                <Input
                  name="weeklyHours"
                  type="number"
                  min={0}
                  max={168}
                  step="0.5"
                  defaultValue={editingUser.weeklyHours ?? ""}
                  placeholder="Horas/semana"
                />
                <select
                  name="attendanceEligible"
                  defaultValue={attendanceValueToForm(editingUser.attendanceEligible)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="pending">80% pendiente</option>
                  <option value="eligible">80% elegible</option>
                  <option value="ineligible">80% no elegible</option>
                </select>
              </div>
              <select
                name="grantMode"
                defaultValue={editingUser.grantMode}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="automatic">Grant automático</option>
                <option value="manual">Grant manual</option>
              </select>
              <label className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm">
                <input
                  name="isDiplomatic"
                  type="checkbox"
                  defaultChecked={editingUser.isDiplomatic}
                />
                Es diplomático
              </label>
              <select
                name="role"
                defaultValue={editingUser.role}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="user">Usuario</option>
                <option value="admin">Admin</option>
              </select>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  name="numVacations"
                  type="number"
                  min={0}
                  defaultValue={editingUser.numVacations}
                  placeholder="Vacaciones"
                />
                <Input
                  name="numCompensatorys"
                  type="number"
                  min={0}
                  defaultValue={editingUser.numCompensatorys}
                  placeholder="Compensatorios"
                />
              </div>
              <div className="rounded-md border border-input p-3">
                <div className="mb-3">
                  <div className="text-sm font-medium">Acciones administrativas</div>
                  <div className="text-xs text-muted-foreground">
                    Estas acciones afectan acceso y credenciales del usuario.
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenGrantsFromEditor(editingUser)}
                    disabled={isPending}
                  >
                    Gestionar grants
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleResetLink(editingUser.id)}
                    disabled={isPending}
                  >
                    Enviar enlace de reset
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setTempPasswordUser(editingUser)}
                    disabled={isPending}
                  >
                    Asignar contraseña temporal
                  </Button>
                  {editingUser.isActive ? (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => handleDeactivate(editingUser.id)}
                      disabled={isPending}
                    >
                      Desactivar usuario
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => handleReactivate(editingUser.id)}
                      disabled={isPending}
                    >
                      Reactivar usuario
                    </Button>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingUser(null)} disabled={isPending}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Guardando..." : "Actualizar"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!tempPasswordUser} onOpenChange={(open) => !open && setTempPasswordUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar contraseña temporal</DialogTitle>
            <DialogDescription>
              Esta acción cambiará la contraseña en Supabase Auth para el usuario seleccionado.
            </DialogDescription>
          </DialogHeader>
          {tempPasswordUser && (
            <form onSubmit={handleSetTempPassword} className="space-y-3">
              <Input value={tempPasswordUser.email} disabled />
              <Input
                type="password"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                placeholder="Nueva contraseña temporal (mín. 8)"
                required
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setTempPasswordUser(null)} disabled={isPending}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Actualizando..." : "Actualizar contraseña"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!grantUser} onOpenChange={(open) => {
        if (!open) {
          setGrantUser(null);
          setEditingGrant(null);
        }
      }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Grants de vacaciones</DialogTitle>
            <DialogDescription>
              Emite un grant manual para el usuario y revisa el historial registrado por el nuevo motor.
            </DialogDescription>
          </DialogHeader>
          {grantUser && (
            <div className="space-y-4">
              <div className="grid gap-2 rounded-md border p-3 text-sm md:grid-cols-4">
                <div>
                  <div className="text-muted-foreground">Usuario</div>
                  <div className="font-medium">{grantUser.name || grantUser.email}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Ingreso</div>
                  <div className="font-medium">{formatAdminDate(grantUser.hireDate)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Jornada</div>
                  <div className="font-medium">{formatWorkPattern(grantUser)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Asistencia 80%</div>
                  <div className="font-medium">
                    {grantUser.attendanceEligible == null ? "Pendiente" : grantUser.attendanceEligible ? "Elegible" : "No elegible"}
                  </div>
                </div>
              </div>

              <form onSubmit={handleIssueGrant} className="space-y-3 rounded-md border p-3">
                <div className="grid gap-3 md:grid-cols-[180px_1fr]">
                  <Input
                    type="date"
                    value={grantDate}
                    onChange={(e) => setGrantDate(e.target.value)}
                    required
                  />
                  <Input
                    value={grantNotes}
                    onChange={(e) => setGrantNotes(e.target.value)}
                    placeholder="Notas administrativas del grant"
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleIssueNextGrant} disabled={isPending}>
                    {isPending ? "Calculando..." : "Emitir siguiente"}
                  </Button>
                  <Button type="submit" disabled={isPending || !grantDate}>
                    {isPending ? "Emitiendo..." : "Emitir grant"}
                  </Button>
                </DialogFooter>
              </form>

              {editingGrant && (
                <form key={editingGrant.id} onSubmit={handleUpdateGrant} className="space-y-3 rounded-md border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">Editar grant</div>
                      <div className="text-xs text-muted-foreground">
                        Ajusta fecha, saldo, expiracion, regla o notas del grant seleccionado.
                      </div>
                    </div>
                    <Button type="button" variant="ghost" onClick={() => setEditingGrant(null)} disabled={isPending}>
                      Cerrar editor
                    </Button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <Input
                      name="grantedOn"
                      type="date"
                      defaultValue={editingGrant.granted_on}
                      required
                    />
                    <select
                      name="serviceBand"
                      defaultValue={editingGrant.service_band}
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {JAPAN_SERVICE_BANDS.map((band) => (
                        <option key={band} value={band}>
                          {band}
                        </option>
                      ))}
                    </select>
                    <select
                      name="ruleType"
                      defaultValue={editingGrant.rule_type}
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {GRANT_RULE_TYPE_OPTIONS.map((ruleType) => (
                        <option key={ruleType} value={ruleType}>
                          {ruleType}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <Input
                      name="daysGranted"
                      type="number"
                      min={0}
                      defaultValue={editingGrant.days_granted}
                      required
                    />
                    <Input
                      name="daysRemaining"
                      type="number"
                      min={0}
                      defaultValue={editingGrant.days_remaining}
                      required
                    />
                    <Input
                      name="expiresOn"
                      type="date"
                      defaultValue={editingGrant.expires_on}
                      required
                    />
                  </div>
                  <Input
                    name="notes"
                    defaultValue={editingGrant.notes ?? ""}
                    placeholder="Notas administrativas del grant"
                  />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setEditingGrant(null)} disabled={isPending}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isPending}>
                      {isPending ? "Guardando..." : "Guardar cambios"}
                    </Button>
                  </DialogFooter>
                </form>
              )}

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grant</TableHead>
                      <TableHead>Tramo</TableHead>
                      <TableHead>Regla</TableHead>
                      <TableHead>Otorgado</TableHead>
                      <TableHead>Disponible</TableHead>
                      <TableHead>Expira</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grantsLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          Cargando grants...
                        </TableCell>
                      </TableRow>
                    ) : grantHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No hay grants registrados para este usuario.
                        </TableCell>
                      </TableRow>
                    ) : (
                      grantHistory.map((grant) => (
                        <TableRow key={grant.id}>
                          <TableCell>{formatAdminDate(grant.granted_on)}</TableCell>
                          <TableCell>{grant.service_band}</TableCell>
                          <TableCell>{grant.rule_type}</TableCell>
                          <TableCell>{grant.days_granted}</TableCell>
                          <TableCell>{grant.days_remaining}</TableCell>
                          <TableCell>{formatAdminDate(grant.expires_on)}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              size="sm"
                              variant={editingGrant?.id === grant.id ? "default" : "outline"}
                              onClick={() => setEditingGrant(grant)}
                              disabled={isPending}
                            >
                              Editar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
