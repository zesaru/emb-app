import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import getUsersById from "@/actions/getUsersById";
import getActiveUsers from "@/actions/getActiveUsers";
import getSystemStats from "@/actions/getSystemStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, Shield, Clock, CheckCircle } from "lucide-react";

export const dynamic = "force-dynamic";

const ReportPage = async () => {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const userData = await getUsersById(authUser.id);
  
  if (!userData || !Array.isArray(userData) || userData.length === 0 || userData[0].admin !== "admin") {
    redirect('/');
  }

  const activeUsers = await getActiveUsers();
  const stats = await getSystemStats();

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Reporte del Sistema</h1>
        <p className="text-muted-foreground">
          Estadísticas y usuarios activos del sistema
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Usuarios Activos
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalActiveUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalInactiveUsers} inactivos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Administradores
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalAdmins}
            </div>
            <p className="text-xs text-muted-foreground">
              Con privilegios admin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Compensatorios
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalCompensatorios}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingCompensatorios} pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Vacaciones
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalVacations}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingVacations} pendientes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuarios Activos ({activeUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <p className="text-sm font-medium">Rol</p>
                    <Badge variant="outline">
                      {user.role || "Sin rol"}
                    </Badge>
                  </div>
                  
                  {user.admin && (
                    <div className="text-center">
                      <p className="text-sm font-medium">Admin</p>
                      <Badge variant="destructive">
                        <Shield className="w-3 h-3 mr-1" />
                        {user.admin}
                      </Badge>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <p className="text-sm font-medium">Vacaciones</p>
                    <p className="text-lg font-bold text-blue-600">
                      {user.num_vacations || 0}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm font-medium">Compensatorios</p>
                    <p className="text-lg font-bold text-green-600">
                      {user.num_compensatorys || 0}
                    </p>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="ml-2 text-sm text-green-600">Activo</span>
                  </div>
                </div>
              </div>
            ))}
            
            {activeUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No hay usuarios activos en el sistema
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportPage;