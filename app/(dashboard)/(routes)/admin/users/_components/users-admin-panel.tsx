"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";

import createAdminUser from "@/actions/admin/users/create-user";
import deactivateAdminUser from "@/actions/admin/users/deactivate-user";
import listAdminUsers from "@/actions/admin/users/list-users";
import reactivateAdminUser from "@/actions/admin/users/reactivate-user";
import sendAdminUserPasswordResetLink from "@/actions/admin/users/send-password-reset-link";
import setAdminUserTemporaryPassword from "@/actions/admin/users/set-temporary-password";
import updateAdminUser from "@/actions/admin/users/update-user";
import type { AdminUserListItem } from "@/lib/users/user-mappers";
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

const emptyCreateForm = {
  email: "",
  name: "",
  role: "user" as "admin" | "user",
  provisioningMode: "invite" as "invite" | "temporary_password",
  temporaryPassword: "",
  numVacations: "0",
  numCompensatorys: "0",
};

export function UsersAdminPanel({ initialUsers, initialError }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [message, setMessage] = useState<MessageState>(
    initialError ? { type: "error", text: initialError } : null
  );
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);

  const [editingUser, setEditingUser] = useState<AdminUserListItem | null>(null);
  const [tempPasswordUser, setTempPasswordUser] = useState<AdminUserListItem | null>(null);
  const [tempPassword, setTempPassword] = useState("");

  const filteredUsers = useMemo(() => {
    let result = [...users];
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((u) =>
        u.email.toLowerCase().includes(q) || (u.name || "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((u) => statusFilter === "active" ? u.isActive : !u.isActive);
    }
    if (roleFilter !== "all") {
      result = result.filter((u) => u.role === roleFilter);
    }
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

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await createAdminUser({
        email: createForm.email,
        name: createForm.name,
        role: createForm.role,
        provisioningMode: createForm.provisioningMode,
        temporaryPassword: createForm.provisioningMode === "temporary_password" ? createForm.temporaryPassword : undefined,
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
    const role = String(form.get("role") || "user") as "admin" | "user";
    const numVacations = Number(form.get("numVacations") || "0");
    const numCompensatorys = Number(form.get("numCompensatorys") || "0");

    startTransition(async () => {
      const result = await updateAdminUser({
        id: editingUser.id,
        name,
        role,
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
              placeholder="Buscar por nombre o email"
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Vacaciones</TableHead>
            <TableHead>Compensatorios</TableHead>
            <TableHead>Creado</TableHead>
            <TableHead className="min-w-[320px]">Acciones</TableHead>
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
                <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                  {user.role === "admin" ? "Admin" : "Usuario"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={user.isActive ? "secondary" : "outline"}>
                  {user.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </TableCell>
              <TableCell>{user.numVacations}</TableCell>
              <TableCell>{user.numCompensatorys}</TableCell>
              <TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setEditingUser(user)} disabled={isPending}>
                    Editar
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => handleResetLink(user.id)} disabled={isPending}>
                    Enviar reset
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setTempPasswordUser(user)} disabled={isPending}>
                    Password temporal
                  </Button>
                  {user.isActive ? (
                    <Button type="button" size="sm" variant="destructive" onClick={() => handleDeactivate(user.id)} disabled={isPending}>
                      Desactivar
                    </Button>
                  ) : (
                    <Button type="button" size="sm" onClick={() => handleReactivate(user.id)} disabled={isPending}>
                      Reactivar
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {filteredUsers.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                No hay usuarios para los filtros seleccionados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

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
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="Email"
              required
            />
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
              <Input value={editingUser.email} disabled readOnly />
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
    </div>
  );
}
