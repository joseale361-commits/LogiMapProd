import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';

/**
 * Browser client for Supabase with cookie storage.
 * This client is used in client components and handles authentication state.
 * Uses cookies instead of localStorage for SSR compatibility.
 */
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    }
  );
};
