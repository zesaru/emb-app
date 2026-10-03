"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  ColumnDef,
  SortingState,
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
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = React.useTransition();
  const sorting: SortingState = [{ id: "event_date", desc: params.get("sort") !== "asc" }];
  function navigate(nextPage: number, sort = params.get("sort") || "desc") {
    const next = new URLSearchParams(params.toString());
    next.set("page", String(nextPage));
    next.set("sort", sort);
    startTransition(() => router.push(`${pathname}?${next}`));
  }

  const table = useReactTable({
    data,
    columns,
    manualPagination: true,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      navigate(1, next[0]?.desc === false ? "asc" : "desc");
    },
    state: {
      sorting,
    },  
  })

  return (
    <div className="p-8">
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
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No hay registros para estos filtros.
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
