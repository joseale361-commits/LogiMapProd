import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

/**
 * Admin client for Supabase with service role key.
 * This client bypasses RLS policies and should only be used in server-side code.
 */
const getAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('[Supabase] CRITICAL: Missing admin environment variables!');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Lazy-loaded admin client
export const adminClient = new Proxy({} as any, {
  get: (target, prop) => {
    return (getAdminClient() as any)[prop];
  }
});

// Export createAdminClient for explicit admin client creation
export const createAdminClient = getAdminClient;
