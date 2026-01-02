"use client";

import * as React from "react";
import { toast } from "react-toastify";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Download, Trash2, RotateCcw, HardDrive } from "lucide-react";
import { RestoreDialog } from "./restore-dialog";
import { BackupMetadata } from "@/lib/backup/backup-types";

interface BackupListProps {
  initialBackups: BackupMetadata[];
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

function formatDate(date: Date): string {
  return date.toLocaleString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusBadge(status: string) {
  const styles = {
    completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  };

  const labels = {
    completed: "Completado",
    failed: "Fallido",
    pending: "Pendiente",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        styles[status as keyof typeof styles] || styles.completed
      }`}
    >
      {labels[status as keyof typeof labels] || status}
    </span>
  );
}

function getLocationBadge(locations: string[]) {
  const hasLocal = locations.includes("local");
  const hasCloud = locations.includes("cloud");

  return (
    <div className="flex gap-1">
      {hasLocal && (
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
          <HardDrive className="mr-1 h-3 w-3" />
          Local
        </span>
      )}
      {hasCloud && (
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
          Cloud
        </span>
      )}
    </div>
  );
}

export function BackupList({ initialBackups }: BackupListProps) {
  const [data, setData] = React.useState<BackupMetadata[]>(initialBackups);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [restoreDialogOpen, setRestoreDialogOpen] = React.useState(false);
  const [selectedBackup, setSelectedBackup] = React.useState<BackupMetadata | null>(null);

  const handleDownload = async (backup: BackupMetadata) => {
    try {
      const response = await fetch(`/api/backups/${backup.id}/download`);
      if (!response.ok) throw new Error("Error al descargar backup");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = backup.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Backup descargado exitosamente");
    } catch (error) {
      console.error("Error downloading backup:", error);
      toast.error("Error al descargar el backup");
    }
  };

  const handleRestore = (backup: BackupMetadata) => {
    setSelectedBackup(backup);
    setRestoreDialogOpen(true);
  };

  const confirmRestore = async () => {
    if (!selectedBackup) return;

    try {
      const response = await fetch("/api/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backupId: selectedBackup.id }),
      });

      if (!response.ok) throw new Error("Error al restaurar backup");

      toast.success("Backup restaurado exitosamente");
      setRestoreDialogOpen(false);
    } catch (error) {
      console.error("Error restoring backup:", error);
      toast.error("Error al restaurar el backup");
    }
  };

  const handleDelete = async (backup: BackupMetadata) => {
    if (!confirm(`¿Estás seguro de eliminar el backup "${backup.filename}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/backups/${backup.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Error al eliminar backup");

      setData(data.filter((b) => b.id !== backup.id));
      toast.success("Backup eliminado exitosamente");
    } catch (error) {
      console.error("Error deleting backup:", error);
      toast.error("Error al eliminar el backup");
    }
  };

  const columns: ColumnDef<BackupMetadata>[] = [
    {
      accessorKey: "createdAt",
      header: "Fecha",
      cell: ({ row }) => formatDate(row.getValue("createdAt")),
    },
    {
      accessorKey: "filename",
      header: "Nombre",
    },
    {
      accessorKey: "size",
      header: "Tamaño",
      cell: ({ row }) => formatFileSize(row.getValue("size")),
    },
    {
      accessorKey: "storageLocation",
      header: "Ubicación",
      cell: ({ row }) => getLocationBadge(row.getValue("storageLocation")),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const backup = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {backup.status === "completed" && (
                <>
                  <DropdownMenuItem onClick={() => handleDownload(backup)}>
                    <Download className="mr-2 h-4 w-4" />
                    Descargar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRestore(backup)}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restaurar
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem
                onClick={() => handleDelete(backup)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <>
      <div>
        <div className="flex items-center py-4">
          <Input
            placeholder="Filtrar por nombre..."
            value={
              (table.getColumn("filename")?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn("filename")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No hay backups disponibles.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
          </Button>
        </div>
      </div>

      {selectedBackup && (
        <RestoreDialog
          isOpen={restoreDialogOpen}
          onClose={() => setRestoreDialogOpen(false)}
          onConfirm={confirmRestore}
          backupName={selectedBackup.filename}
        />
      )}
    </>
  );
}
