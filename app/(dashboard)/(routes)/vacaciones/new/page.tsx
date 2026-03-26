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
            Complete el período y la cantidad de días a solicitar.
          </CardDescription>
          <div>
            <Button asChild variant="link" className="h-auto px-0 text-sm">
              <Link href="/vacaciones/policy">
                Ver política de vacaciones en Japón
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
