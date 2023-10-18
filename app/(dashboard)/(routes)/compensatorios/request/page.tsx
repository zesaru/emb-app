'use client';

import RequestForm from './_components/requestForm';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RequestPage() {
  return (
    <div className="space-y-6 p-5">
      <Card>
        <CardHeader>
          <CardTitle>Compensatorios</CardTitle>
          <CardDescription>SOLICITUD HORAS DE COMPENSATORIOS</CardDescription>
        </CardHeader>
        <CardContent>
         <RequestForm/>
        </CardContent>
      </Card>
    </div>
  );
}
