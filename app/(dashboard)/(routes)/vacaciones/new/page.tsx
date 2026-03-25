import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VacationNewForm } from "./_components/vacation-form";

export default function NewVacationPage() {
  return (
    <div className="space-y-6 p-5">
      <Card>
        <CardHeader>
          <CardTitle>Solicitar Vacaciones</CardTitle>
          <CardDescription>
            Complete el periodo y la cantidad de dias a solicitar.
          </CardDescription>
          <div>
            <Button asChild variant="link" className="h-auto px-0 text-sm">
              <Link href="/vacaciones/policy">
                Ver politica de vacaciones en Japon
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <VacationNewForm />
        </CardContent>
      </Card>
    </div>
  );
}
