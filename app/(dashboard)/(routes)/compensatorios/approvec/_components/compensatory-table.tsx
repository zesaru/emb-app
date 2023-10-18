'use client';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function CTable({ compensatory }: { compensatory: any }) {
  const compensatorio = compensatory[0];
  return (
    <>
      <Table>
        <TableCaption></TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Evento</TableHead>
            <TableHead className="text-center">Fecha</TableHead>
            <TableHead className="text-center">Horas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">{compensatorio.id}</TableCell>
            <TableCell>{compensatorio.user1.name}</TableCell>
            <TableCell>{compensatorio.event_name}</TableCell>
            <TableCell className="text-center">
              {compensatorio.event_date}
            </TableCell>
            <TableCell className="text-center">{compensatorio.hours}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </>
  );
}
