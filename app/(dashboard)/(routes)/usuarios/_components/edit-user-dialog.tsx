"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
// Removed toast import
import { UsersEntity } from "@/types/collections";
import { updateUser } from "@/actions/update-user";

const userSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  admin: z.string().nullable(),
  role: z.string().nullable(),
  isAdmin: z.boolean(),
  isActive: z.boolean(),
});

type UserFormData = z.infer<typeof userSchema>;

interface EditUserDialogProps {
  user: UsersEntity | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdate: (user: UsersEntity) => void;
}

export const EditUserDialog = ({
  user,
  isOpen,
  onClose,
  onUserUpdate,
}: EditUserDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      admin: user?.admin || null,
      role: user?.role || null,
      isAdmin: user?.admin === "admin",
      isActive: user?.is_active ?? true,
    },
  });

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || "",
        email: user.email || "",
        admin: user.admin || null,
        role: user.role || null,
        isAdmin: user.admin === "admin",
        isActive: user.is_active ?? true,
      });
      setMessage(null);
    }
  }, [user, form]);

  const onSubmit = async (data: UserFormData) => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Adjust admin field based on isAdmin toggle
      const updateData = {
        name: data.name,
        email: data.email,
        admin: data.isAdmin ? "admin" : null,
        role: data.role,
        is_active: data.isActive,
      };
      
      const result = await updateUser(user.id, updateData);
      
      if (result.success && result.data) {
        onUserUpdate(result.data);
        setMessage({ type: 'success', text: 'Usuario actualizado correctamente' });
        setTimeout(() => {
          onClose();
          setMessage(null);
        }, 1500);
      } else {
        setMessage({ type: 'error', text: result.error || 'Error al actualizar usuario' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error inesperado al actualizar usuario' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica la información del usuario seleccionado.
            </DialogDescription>
          </DialogHeader>

          {message && (
            <div className={`p-3 rounded-md text-sm ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="name">Nombre Completo</Label>
              <Input 
                id="name"
                {...form.register("name")} 
                placeholder="Nombre completo" 
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                {...form.register("email")} 
                type="email" 
                placeholder="email@ejemplo.com" 
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isAdmin" className="text-base">
                  Administrador
                </Label>
                <div className="text-sm text-muted-foreground">
                  El usuario tendrá privilegios de administrador
                </div>
              </div>
              <Switch
                id="isAdmin"
                checked={form.watch("isAdmin")}
                onCheckedChange={(checked) => form.setValue("isAdmin", checked)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isActive" className="text-base">
                  Usuario Activo
                </Label>
                <div className="text-sm text-muted-foreground">
                  El usuario puede acceder al sistema
                </div>
              </div>
              <Switch
                id="isActive"
                checked={form.watch("isActive")}
                onCheckedChange={(checked) => form.setValue("isActive", checked)}
              />
            </div>

            <div>
              <Label htmlFor="role">Rol</Label>
              <Input 
                id="role"
                {...form.register("role")} 
                placeholder="empleado, manager, etc." 
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};