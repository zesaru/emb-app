import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database.type';

let storageClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createStorageClient() {
  if (storageClient) {
    return storageClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  storageClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

  return storageClient;
}
