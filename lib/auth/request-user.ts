import { cache } from "react";
import { createClient } from "@/utils/supabase/server";

// React clears this cache for each server render. Never persist sessions across requests.
export const getRequestUser = cache(async () => {
  const supabase = await createClient();
  return supabase.auth.getUser();
});

export const getRequestUserProfile = cache(async (userId: string) => {
  const supabase = await createClient();
  return supabase.from("users").select("*").eq("id", userId).single();
});
