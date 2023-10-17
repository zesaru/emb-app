import getsCompensatorioById from "@/actions/getCompensatorioById";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
import { Button } from "@/components/ui/button";  
  
export default async function CTable (id: any)   {
   const compensatory = await getsCompensatorioById (id.id);
  return (
    <Table>
  <TableCaption></TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>ID</TableHead>
      <TableHead>Nombre</TableHead>
      <TableHead>Evento</TableHead>
      <TableHead className="text-center">Fecha</TableHead>
      <TableHead className="text-center">Horas</TableHead>
      <TableHead className="text-center">Action</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell className="font-medium">{compensatory[0].id}</TableCell>
      <TableCell>{compensatory[0].user1.name}</TableCell>
      <TableCell>{compensatory[0].event_name}</TableCell>
      <TableCell className="text-center">{compensatory[0].event_date}</TableCell>
      <TableCell className="text-center">{compensatory[0].hours}</TableCell>
      <TableCell className="text-center"><Button>Aprobar</Button></TableCell>
    </TableRow>
  </TableBody>
</Table>

  )
}

