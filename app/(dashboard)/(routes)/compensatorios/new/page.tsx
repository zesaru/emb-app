import { AccountForm } from "./_components/compensatory-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SettingsAccountPage() {
  return (
    <div className="space-y-6 p-5">
      <Card>
        <CardHeader>
          <CardTitle>Compensatorios</CardTitle>
          <CardDescription>Solicitud de registro de días compensatorios</CardDescription>
        </CardHeader>
        <CardContent>
          <AccountForm />
        </CardContent>
      </Card>
    </div>
  );
}
