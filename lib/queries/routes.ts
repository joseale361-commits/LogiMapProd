import { createClient } from '@/lib/supabase/server';

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
    notes?: string
) {
    const supabase = await createClient();

    try {
        // 1. Obtener detalles de pedidos (Corregido: profiles)
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select(`
                id,
                delivery_location,
                delivery_address_snapshot,
                customer:profiles!orders_customer_id_fkey (
                    full_name,
                    phone
                )
            `)
            .in('id', orderIds);

        if (ordersError || !orders) {
            console.error('[Routes] Error fetching orders:', ordersError);
            throw new Error('Error al obtener datos de pedidos');
        }

        // 2. Generar número de ruta y Crear Ruta
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
                status: 'planning',
                notes: notes,
                total_stops: orders.length,
                route_number: routeNumber
            })
            .select()
            .single();

        if (routeError) throw routeError;

        // 3. Crear Paradas
        const stopsData = orders.map((order: any, index: number) => ({
            route_id: route.id,
            order_id: order.id,
            sequence_order: index + 1,
            status: 'pending',
            delivery_location: order.delivery_location,
            delivery_address_text: order.delivery_address_snapshot?.street_address || 'Sin dirección',
            customer_name: order.customer?.full_name || 'Desconocido',
            customer_phone: order.customer?.phone
        }));

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

// 2. Obtener Pedidos Aprobados para Rutas
export async function getApprovedOrdersForRouting(distributorId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('orders')
        .select(`
            id,
            order_number,
            total_amount,
            status,
            delivery_location,
            delivery_address_snapshot,
            customer:profiles!orders_customer_id_fkey (
    full_name,
    phone
)
        `)
        .eq('distributor_id', distributorId)
        .eq('status', 'approved');

    if (error) {
        console.error('[Routes] Error fetching orders:', error);
        return [];
    }

    return data.map((o: any) => ({
        id: o.id,
        order_number: o.order_number,
        total_amount: o.total_amount,
        status: o.status,
        created_at: o.created_at,
        customer: {
            full_name: o.customer?.full_name || 'Desconocido',
            phone: o.customer?.phone || null,
            email: null
        },
        delivery_address_text: o.delivery_address_snapshot?.street_address || 'Sin dirección',
        delivery_location: o.delivery_location,
        requested_delivery_date: null, // Basic placeholders if not in schema
        requested_delivery_time_slot: null
    }));
}