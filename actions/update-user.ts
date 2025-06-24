"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { UsersEntity } from "@/types/collections";
import { revalidatePath } from "next/cache";

interface UpdateUserData {
  name: string;
  email: string;
  admin: string | null;
  role: string | null;
  is_active: boolean;
}

interface UpdateUserResult {
  success: boolean;
  data?: UsersEntity;
  error?: string;
}

export async function updateUser(
  userId: string,
  userData: UpdateUserData
): Promise<UpdateUserResult> {
  try {
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

    const { data, error } = await supabase
      .from('users')
      .update({
        name: userData.name,
        email: userData.email,
        admin: userData.admin,
        role: userData.role,
        is_active: userData.is_active,
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    revalidatePath('/usuarios');
    
    return {
      success: true,
      data: data as UsersEntity,
    };
  } catch (error) {
    console.error('Unexpected error updating user:', error);
    return {
      success: false,
      error: 'Error inesperado al actualizar usuario',
    };
  }
}