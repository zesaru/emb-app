import { redirectIfAuthenticated } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ResetForm from './_components/resetForm'

const ResetPage = async () => {
  // Redirect to dashboard if already authenticated
  await redirectIfAuthenticated();

  return (
    <div className="space-y-6 p-5">
      <Card>
        <CardHeader>
          <CardTitle>Recuperar Contraseña</CardTitle>
          <CardDescription>
            Ingresa tu email para recibir un enlace de recuperación de contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResetForm />
        </CardContent>
      </Card>
    </div>
  );
}

export default ResetPage