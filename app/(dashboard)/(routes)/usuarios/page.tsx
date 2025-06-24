import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import getUsers from "@/actions/getUsers";
import getUsersById from "@/actions/getUsersById";
import { UsersTable } from "./_components/users-table";

const UsuariosPage = async () => {
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
    redirect('/login');
  }

  const userData = await getUsersById(authUser.id);
  
  if (!userData || !Array.isArray(userData) || userData.length === 0 || userData[0].admin !== "admin") {
    redirect('/');
  }

  const users = await getUsers();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
        <p className="text-muted-foreground">
          Administra los usuarios del sistema
        </p>
      </div>
      
      <UsersTable data={users} />
    </div>
  );
};

export default UsuariosPage;