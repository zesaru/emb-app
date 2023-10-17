import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


export default async function CTable(compensatory:any) {


  console.log(compensatory)
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
            <TableCell className="font-medium">{compensatory.id}</TableCell>
            <TableCell></TableCell>
            <TableCell>{compensatory.event_name}</TableCell>
            <TableCell className="text-center">
              {compensatory.event_date}
            </TableCell>
            <TableCell className="text-center">
              {compensatory.hours}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      
    </>
  );
}
