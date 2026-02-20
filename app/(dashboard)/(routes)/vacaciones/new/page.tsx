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
          <CardTitle>Solicitar Vacaciones</CardTitle>
          <CardDescription>Complete el período y la cantidad de días a solicitar.</CardDescription>
        </CardHeader>
        <CardContent>
          <VacationNewForm />
        </CardContent>
      </Card>
    </div>
  );
}
