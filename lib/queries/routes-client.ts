import { createClient } from '@/lib/supabase/client';

/**
 * Browser client version of getActiveRoutes
 * Used by Client Components to fetch active routes
 */
export async function getActiveRoutes(distributorId: string) {
    const supabase = createClient();

    console.log('[getActiveRoutesBrowser] Fetching active routes for distributor:', distributorId);

    const { data: routesData, error } = await supabase
        .from('routes')
        .select(`
            *,
            driver:profiles!routes_driver_id_fkey (id, full_name, phone),
            stops:route_stops (id, status)
        `)
        .eq('distributor_id', distributorId)
        .not('status', 'eq', 'completed')
        .not('status', 'eq', 'finished')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[getActiveRoutesBrowser] Error:', error);
        return [];
    }

    // Process routes to add stop counts and driver info
    const processedRoutes = (routesData || []).map((r: any) => ({
        ...r,
        completed_stops: r.stops?.filter((s: any) => s.status === 'completed').length || 0,
        total_stops: r.stops?.length || 0
    }));

    console.log('[getActiveRoutesBrowser] Active routes found:', processedRoutes.length);

    return processedRoutes;
}
