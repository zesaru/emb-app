"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UsersEntity } from "@/types/collections";

export async function getAllUsers(): Promise<UsersEntity[]> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  );

  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/login');
  }

  // Obtener datos del usuario actual para verificar permisos
  const { data: currentUserData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (userError || !currentUserData) {
    throw new Error('Error al obtener datos del usuario actual');
  }

  // Verificar permisos de administrador
  const isAdmin = currentUserData.admin === 'true' || currentUserData.role === 'admin';
  
  if (!isAdmin) {
    throw new Error('No tienes permisos de administrador');
  }

  // Obtener todos los usuarios con estadísticas
  const { data: users, error } = await supabase
    .from('users')
    .select(`
      *,
      compensatorys_count:compensatorys(count),
      vacations_count:vacations(count),
      attendances_count:attendances(count)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    throw new Error('Error al obtener usuarios');
  }

  return users || [];
}