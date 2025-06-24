"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Shield, ShieldOff } from "lucide-react";
import { UsersEntity } from "@/types/collections";
import { EditUserDialog } from "./edit-user-dialog";

interface UsersTableProps {
  data: UsersEntity[];
}

export const UsersTable = ({ data }: UsersTableProps) => {
  const [editingUser, setEditingUser] = useState<UsersEntity | null>(null);
  const [users, setUsers] = useState<UsersEntity[]>(data);

  const handleUserUpdate = (updatedUser: UsersEntity) => {
    setUsers(users.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    ));
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Usuarios</CardTitle>
          <CardDescription>
            Lista de todos los usuarios registrados en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.name}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.admin ? "destructive" : "secondary"}>
                      {user.admin ? (
                        <>
                          <Shield className="w-3 h-3 mr-1" />
                          {user.admin}
                        </>
                      ) : (
                        <>
                          <ShieldOff className="w-3 h-3 mr-1" />
                          Usuario
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">
                      {user.role || "Sin rol"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? "default" : "secondary"}>
                      {user.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingUser(user)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EditUserDialog
        user={editingUser}
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        onUserUpdate={handleUserUpdate}
      />
    </>
  );
};