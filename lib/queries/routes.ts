import { createClient } from '@/lib/supabase/server';

// Environment variable for Mapbox token
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/**
 * Call Mapbox Optimization API to get the optimal route order.
 * @param warehouseLocation - { lng, lat } of the warehouse (start point)
 * @param orderLocations - Array of { lng, lat, orderId } for each delivery point
 * @returns Array of orderIds in optimal order, or null if optimization fails
 */
export async function optimizeRouteOrder(
    warehouseLocation: { lng: number; lat: number },
    orderLocations: { lng: number; lat: number; orderId: string }[]
): Promise<string[] | null> {
    if (!MAPBOX_TOKEN) {
        console.error('[Routes] Mapbox token not configured');
        return null;
    }

    if (orderLocations.length === 0) {
        return [];
    }

    try {
        // Build coordinates string: lng,lat;lng,lat;... (warehouse first)
        const coordsString = [
            `${warehouseLocation.lng},${warehouseLocation.lat}`,
            ...orderLocations.map(loc => `${loc.lng},${loc.lat}`)
        ].join(';');

        const url = `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${coordsString}?source=first&roundtrip=true&access_token=${MAPBOX_TOKEN}`;

        console.log('[Routes] Calling Mapbox Optimization API...');

        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Routes] Mapbox API error:', response.status, errorText);
            return null;
        }

        const data = await response.json();

        if (data.code !== 'Ok' || !data.waypoints || data.waypoints.length === 0) {
            console.error('[Routes] Mapbox returned invalid response:', data);
            return null;
        }

        // Mapbox returns waypoints with waypoint_index
        // waypoint_index 0 is the warehouse (source=first)
        // waypoint_index 1+ are the optimized order of deliveries
        const optimizedOrder: string[] = [];

        // Create a map of waypoint_index -> orderId
        const waypointMap = new Map<number, string>();
        data.waypoints.forEach((wp: any, index: number) => {
            if (index > 0) { // Skip warehouse (index 0)
                const orderIndex = wp.waypoint_index - 1; // Adjust for warehouse offset
                if (orderIndex >= 0 && orderIndex < orderLocations.length) {
                    waypointMap.set(orderIndex, orderLocations[orderIndex].orderId);
                }
            }
        });

        // Return ordered by waypoint_index
        const sortedWaypoints = data.waypoints
            .filter((_: any, idx: number) => idx > 0) // Skip warehouse
            .sort((a: any, b: any) => a.waypoint_index - b.waypoint_index);

        sortedWaypoints.forEach((wp: any) => {
            const orderIndex = wp.waypoint_index - 1;
            if (orderIndex >= 0 && orderIndex < orderLocations.length) {
                optimizedOrder.push(orderLocations[orderIndex].orderId);
            }
        });

        console.log('[Routes] Optimization successful. Original order:', orderLocations.length, 'Optimized order:', optimizedOrder.length);
        return optimizedOrder;

    } catch (error) {
        console.error('[Routes] Error calling Mapbox Optimization API:', error);
        return null;
    }
}

// 1. Obtener Choferes Disponibles
// (Buscamos en distributor_users y hacemos join con profiles)
export async function getDriversByDistributorId(distributorId: string) {
    const supabase = await createClient();

    console.log('[getDriversByDistributorId] Buscando choferes para:', distributorId);

    // 1. Obtener IDs de usuarios con rol 'driver'
    const { data: userRoles, error: rolesError } = await supabase
        .from('distributor_users')
        .select('user_id')
        .eq('distributor_id', distributorId)
        .eq('role', 'driver')
        .eq('is_active', true);
    if (rolesError) {
        console.error('[getDriversByDistributorId] Error roles:', rolesError);
        return [];
    }

    console.log('[getDriversByDistributorId] IDs encontrados en distributor_users:', userRoles?.length || 0);

    if (!userRoles || userRoles.length === 0) {
        return [];
    }

    const userIds = userRoles.map(ur => ur.user_id);

    // 2. Obtener Perfiles
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
            id,
            full_name,
            email,
            phone
        `)
        .in('id', userIds);

    if (profilesError) {
        console.error('[getDriversByDistributorId] Error perfiles:', profilesError);
        return [];
    }

    console.log('[getDriversByDistributorId] Perfiles encontrados:', profiles?.length || 0);

    return (profiles || []).map(p => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        phone: p.phone
    }));
}

export async function createRouteWithStops(
    distributorId: string,
    driverId: string,
    createdBy: string,
    orderIds: string[],
    plannedDate: string,
    notes?: string,
    slug?: string // Optional slug for getting warehouse location
) {
    const supabase = await createClient();

    try {
        // 0. Get warehouse location from distributor settings
        let warehouseLocation: { lng: number; lat: number } | null = null;
        if (slug) {
            const { getDistributorSettingsBySlug } = await import('@/lib/supabase/server');
            const settings = await getDistributorSettingsBySlug(slug);
            if (settings?.location_json?.coordinates) {
                // PostGIS format: [lng, lat]
                warehouseLocation = {
                    lng: settings.location_json.coordinates[0],
                    lat: settings.location_json.coordinates[1]
                };
                console.log('[Routes] Warehouse location found:', warehouseLocation);
            } else {
                console.warn('[Routes] No warehouse location found for distributor');
            }
        }

        // 1. Obtener detalles de pedidos (Corregido: incluye join con addresses para obtener location)
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select(`
                id,
                order_number,
                delivery_address_id,
                delivery_address_snapshot,
                customer:profiles!orders_customer_id_fkey (
                    full_name,
                    phone
                ),
                addresses (
                    id,
                    location
                )
            `)
            .in('id', orderIds);

        if (ordersError || !orders) {
            console.error('[Routes] Error fetching orders:', ordersError);
            throw new Error('Error al obtener datos de pedidos');
        }

        // 2. Optimize route order using Mapbox (if warehouse location is available)
        let optimizedOrderIds: string[] | null = null;
        if (warehouseLocation && orders.length > 1) {
            const orderLocations = orders.map((order: any) => {
                const loc = order.addresses?.location;
                return {
                    lng: loc?.coordinates?.[0] || loc?.[0] || 0,
                    lat: loc?.coordinates?.[1] || loc?.[1] || 0,
                    orderId: order.id
                };
            }).filter((loc: any) => loc.lng !== 0 && loc.lat !== 0);

            if (orderLocations.length === orders.length) {
                optimizedOrderIds = await optimizeRouteOrder(warehouseLocation, orderLocations);
            }
        }

        // Reorder orders based on optimization, or use original order if optimization failed
        let orderedOrders = orders;
        if (optimizedOrderIds && optimizedOrderIds.length === orders.length) {
            console.log('[Routes] Using optimized route order');
            const orderMap = new Map(orders.map((o: any) => [o.id, o]));
            orderedOrders = optimizedOrderIds.map(id => orderMap.get(id)).filter(Boolean);
        } else {
            console.log('[Routes] Using original selection order (optimization skipped or failed)');
        }

        // 3. Generar número de ruta y Crear Ruta
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        const routeNumber = `RT-${dateStr}-${randomStr}`;

        const { data: route, error: routeError } = await supabase
            .from('routes')
            .insert({
                distributor_id: distributorId,
                driver_id: driverId,
                created_by: createdBy,
                planned_date: plannedDate,
                status: 'active',
                notes: notes,
                total_stops: orderedOrders.length,
                route_number: routeNumber
            })
            .select()
            .single();

        if (routeError) throw routeError;

        // 4. Crear Paradas (using optimized order)
        const stopsData = orderedOrders.map((order: any, index: number) => {
            const deliveryLocation = order.addresses?.location || null;

            // Validar que delivery_location exista
            if (!deliveryLocation) {
                throw new Error(`Dirección sin ubicación válida para el pedido: ${order.order_number || order.id}`);
            }

            return {
                route_id: route.id,
                order_id: order.id,
                sequence_order: index + 1,
                status: 'pending',
                delivery_location: deliveryLocation,
                delivery_address_text: order.delivery_address_snapshot?.street_address || 'Sin dirección',
                customer_name: order.customer?.full_name || 'Desconocido',
                customer_phone: order.customer?.phone
            };
        });

        const { error: stopsError } = await supabase
            .from('route_stops')
            .insert(stopsData);

        if (stopsError) throw stopsError;

        // 4. Actualizar pedidos
        const { error: updateError } = await supabase
            .from('orders')
            .update({ status: 'in_transit' })
            .in('id', orderIds);

        if (updateError) throw updateError;

        return { success: true, routeId: route.id };

    } catch (error: any) {
        console.error('[Routes] Create Error:', error);
        return { success: false, error: error.message };
    }
}

// 2. Obtener Pedidos Aprobados para Rutes
export async function getApprovedOrdersForRouting(distributorId: string) {
    const supabase = await createClient();

    console.log('[DEBUG-CACHE] Fetching orders with NO-CACHE for distributor:', distributorId);

    const { data: ordersData, error } = await supabase
        .from('v_orders_with_geojson' as any)
        .select('*')
        .eq('distributor_id', distributorId)
        .neq('status', 'in_transit'); // Filter out orders already in transit

    if (error) {
        console.error('Supabase Query Error:', error);
        return [];
    }

    console.log('[DEBUG-CACHE] Orders fetched successfully:', ordersData?.length || 0, 'orders');
    if (ordersData && ordersData.length > 0) {
        console.log('[DEBUG-CACHE] First order sample:', JSON.stringify(ordersData[0], null, 2));
    }

    return (ordersData || []).map((o: any) => ({
        id: o.id,
        order_number: o.order_number,
        total_amount: o.total_amount,
        status: o.status,
        created_at: o.created_at,
        lat: null,
        lng: null,
        customer: {
            full_name: o.customer?.full_name || o.client_name || 'Desconocido',
            phone: o.customer?.phone || o.customer_phone || null,
            email: o.customer?.email || o.customer_email || null
        },
        address: o.address || 'Sin dirección',
        location_json: o.location_json || null,
        delivery_type: o.delivery_type || 'delivery',
        requested_delivery_date: o.requested_delivery_date,
        requested_delivery_time_slot: o.requested_delivery_time_slot
    }));
}

// 3. Obtener Rutas Activas (para Admin Dashboard)
export async function getActiveRoutes(distributorId: string) {
    const supabase = await createClient();

    console.log('[getActiveRoutes] Fetching active routes for distributor:', distributorId);

    const { data: routesData, error } = await supabase
        .from('routes')
        .select(`
            *,
            driver:profiles!routes_driver_id_fkey (id, full_name, phone),
            stops:route_stops (id, status)
        `)
        .eq('distributor_id', distributorId)
        .neq('status', 'finished')
        .neq('status', 'completed')
        .neq('status', 'delivered')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[getActiveRoutes] Error:', error);
        return [];
    }

    console.log('[getActiveRoutes] Active routes found:', routesData?.length || 0);

    return (routesData || []).map((r: any) => ({
        id: r.id,
        route_number: r.route_number,
        status: r.status,
        planned_date: r.planned_date,
        created_at: r.created_at,
        driver: r.driver,
        total_stops: r.stops?.length || 0,
        completed_stops: r.stops?.filter((s: any) => s.status === 'completed').length || 0
    }));
}