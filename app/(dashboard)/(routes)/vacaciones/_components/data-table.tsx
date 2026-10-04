"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  page: number
  pages: number
}

export function DataTable<TData, TValue>({
  columns,
  data,
  page,
  pages,
}: DataTableProps<TData, TValue>) {
  const router = useRouter(), pathname = usePathname(), params = useSearchParams();
  const [pending, startTransition] = React.useTransition();
  function navigate(page: number) {
    const next = new URLSearchParams(params.toString());
    next.set("page", String(page));
    startTransition(() => router.push(`${pathname}?${next}`));
  }

  const table = useReactTable({
    data,
    columns,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="p-6">
      <div className="rounded-md border border-gray-200">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="border-b border-gray-200">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
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
                  className="border-b border-gray-100"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-gray-500">
                  No hay solicitudes de vacaciones
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <span className="mr-auto text-sm text-slate-500" role="status">Página {page} de {pages}{pending ? " · Cargando…" : ""}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(page - 1)}
          disabled={pending || page <= 1}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(page + 1)}
          disabled={pending || page >= pages}
        >
          Siguiente
        </Button>
      </div>
    </div>
  )
}
