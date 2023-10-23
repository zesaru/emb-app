import { VacationNewForm } from "./_components/vacation-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NewVacationPage() {
  return (
    <div className="space-y-6 p-5">
      <Card>
        <CardHeader>
          <CardTitle>Vacaciones</CardTitle>
          <CardDescription>SOLICITUD DE VACACIONES</CardDescription>
        </CardHeader>
        <CardContent>
          <VacationNewForm />
        </CardContent>
      </Card>
    </div>
  );
}
