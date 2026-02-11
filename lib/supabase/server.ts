import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { Database } from '@/types/supabase';
import { adminClient } from './admin';

/**
 * Creates a Supabase server client with proper Next.js 15+ cookie handling.
 * 
 * Uses React.cache() for per-request deduplication (Rule 3.6 from nextjs-react-expert).
 * This ensures that within a single request, multiple calls return the same instance,
 * avoiding duplicate database connections.
 * 
 * @returns Supabase client configured for server-side use
 * @throws Error if environment variables are missing
 */
export const createSupabaseServerClient = cache(async () => {
  console.log('[Supabase] Initializing Server Client...');
  const cookieStore = await cookies();
  console.log('[Supabase] CookieStore obtained successfully');

  // Debug: Check if cookieStore has expected methods
  if (typeof cookieStore.getAll !== 'function') {
    console.error('[Supabase] CRITICAL: cookieStore.getAll is NOT a function!', cookieStore);
  }


  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as CookieOptions)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
});

// Export alias for convenience
export const createClient = createSupabaseServerClient;

/**
 * Gets the current authenticated user.
 */
export const getCurrentUser = async () => {
  console.log('[Supabase] getCurrentUser hit...');
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('[Supabase] getCurrentUser auth error:', error.message);
      return null;
    }

    if (user) {
      console.log('[Supabase] getCurrentUser success:', user.email);
    } else {
      console.log('[Supabase] getCurrentUser: No session/user found');
    }

    return user;
  } catch (err) {
    console.error('[Supabase] getCurrentUser CRASH:', err);
    return null;
  }
};

/**
 * Gets a distributor by slug.
 */
export const getDistributorBySlug = async (slug: string) => {
  console.log('[Supabase] getDistributorBySlug hit for slug:', slug);

  try {
    const { data: distributor, error } = await adminClient
      .from('distributors')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error('[Supabase] getDistributorBySlug error:', error.message);
      return null;
    }

    return distributor;
  } catch (err) {
    console.error('[Supabase] getDistributorBySlug unexpected error:', err);
    return null;
  }
};

/**
 * Gets distributor settings from the v_distributor_settings view.
 * This view returns location_json (GeoJSON) instead of raw PostGIS HEX.
 */
export const getDistributorSettingsBySlug = async (slug: string) => {
  console.log('[Supabase] getDistributorSettingsBySlug hit for slug:', slug);

  try {
    const { data: distributor, error } = await adminClient
      .from('v_distributor_settings')
      .select('slug, address, location_json')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error('[Supabase] getDistributorSettingsBySlug error:', error.message);
      return null;
    }

    return distributor;
  } catch (err) {
    console.error('[Supabase] getDistributorSettingsBySlug unexpected error:', err);
    return null;
  }
};

/**
 * Checks if the current user has access to a specific distributor.
 */
export const hasDistributorAccess = async (userId: string, distributorId: string) => {
  console.log('[Supabase] Checking access for user', userId, 'to distributor', distributorId);

  try {
    const { data, error } = await adminClient
      .from('distributor_users')
      .select('*')
      .eq('user_id', userId)
      .eq('distributor_id', distributorId)
      .eq('is_active', true);

    if (error) {
      console.error('[Supabase] hasDistributorAccess error:', error.message);
      return false;
    }

    const hasAccess = data && data.length > 0;
    console.log('[Supabase] Access result:', hasAccess);
    return hasAccess;
  } catch (err) {
    console.error('[Supabase] hasDistributorAccess unexpected error:', err);
    return false;
  }
};

/**
 * Gets the user's role and distributor information.
 * Returns null if user is not authenticated or has no distributor access.
 */
export const getUserRoleAndDistributor = async () => {
  console.log('[Supabase] getUserRoleAndDistributor hit...');

  const user = await getCurrentUser();
  if (!user) {
    console.log('[Supabase] No user found');
    return null;
  }

  try {
    const { data: distributorUsers, error } = await adminClient
      .from('distributor_users')
      .select(`
        *,
        distributors!inner (
          id,
          name,
          slug
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (error) {
      console.error('[Supabase] getUserRoleAndDistributor error:', error.message);
      return null;
    }

    if (!distributorUsers || distributorUsers.length === 0) {
      console.log('[Supabase] No distributor access found for user:', user.id);
      return null;
    }

    // Return the first active distributor user with their role
    const firstDistributorUser = distributorUsers[0];
    return {
      userId: user.id,
      email: user.email,
      role: firstDistributorUser.role,
      distributor: firstDistributorUser.distributors,
    };
  } catch (err) {
    console.error('[Supabase] getUserRoleAndDistributor unexpected error:', err);
    return null;
  }
};

/**
 * Gets the user's role for a specific distributor.
 * Returns null if user is not authenticated or has no access to the distributor.
 */
export const getUserRoleForDistributor = async (userId: string, distributorId: string) => {
  console.log('[Supabase] getUserRoleForDistributor hit for user:', userId, 'distributor:', distributorId);

  try {
    const { data: distributorUser, error } = await adminClient
      .from('distributor_users')
      .select('role')
      .eq('user_id', userId)
      .eq('distributor_id', distributorId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('[Supabase] getUserRoleForDistributor error:', error.message);
      return null;
    }

    return distributorUser?.role || null;
  } catch (err) {
    console.error('[Supabase] getUserRoleForDistributor unexpected error:', err);
    return null;
  }
};
