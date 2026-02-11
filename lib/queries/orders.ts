import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';

type Distributor = Database['public']['Tables']['distributors']['Row'];

export interface OrderDetail {
    id: string;
    created_at: string | null;
    total_amount: number;
    status: string;
    distributor_id: string;
    delivery_type: string;
    pickup_time: string | null;
    distributor: {
        name: string;
        phone: string | null;
    };
    items: {
        id: string;
        quantity: number;
        unit_price: number;
        subtotal: number;
        variant_id: string | null;
        variant_name: string;
    }[];
    delivery_address_snapshot: {
        label?: string;
        street_address?: string;
        city?: string;
    } | null;
}

export async function getOrderById(orderId: string): Promise<OrderDetail | null> {
    const supabase = await createClient();

    const { data: order, error } = await (supabase
        .from('orders') as any)
        .select(`
            id,
            created_at,
            total_amount,
            status,
            distributor_id,
            delivery_type,
            pickup_time,
            distributors (
                name,
                phone
            ),
            order_items (
                id,
                quantity,
                unit_price,
                subtotal,
                variant_id,
                product_variants (
                    name
                )
            ),
            delivery_address_snapshot
        `)
        .eq('id', orderId)
        .single();

    if (error || !order) {
        console.error('Error fetching order:', error);
        return null;
    }

    return {
        id: order.id,
        created_at: order.created_at,
        total_amount: Number(order.total_amount),
        status: order.status,
        distributor_id: order.distributor_id,
        delivery_type: order.delivery_type,
        pickup_time: order.pickup_time,
        distributor: {
            name: order.distributors?.name || 'Tienda desconocida',
            phone: order.distributors?.phone,
        },
        items: (order.order_items || []).map((item: any) => ({
            id: item.id,
            quantity: item.quantity,
            unit_price: Number(item.unit_price),
            subtotal: Number(item.subtotal),
            variant_id: item.variant_id,
            variant_name: item.product_variants?.name || 'Variante desconocida',
        })),
        delivery_address_snapshot: order.delivery_address_snapshot as {
            label?: string;
            street_address?: string;
            city?: string;
        } | null,
    };
}
// Función para listar pedidos en el Dashboard
export async function getOrdersByDistributorId(distributorId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('orders')
        .select(`
            id,
            order_number,
            created_at,
            total_amount,
            status,
            customer_id,
            profiles!orders_customer_id_fkey (
                full_name,
                email
            )
        `)
        .eq('distributor_id', distributorId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching orders list:', JSON.stringify(error, null, 2)); // Log detallado
        return [];
    }

    return (data || []).map((order: any) => {
        // Obtenemos el perfil de forma robusta (puede venir como 'profiles' o con el nombre de la FK)
        const profile = order.profiles || order['profiles!orders_customer_id_fkey'];

        return {
            id: order.id,
            order_number: order.order_number, // Mantenemos snake_case si lo espera el componente
            orderNumber: order.order_number,  // Y camelCase para compatibilidad
            date: order.created_at,
            created_at: order.created_at,
            total: order.total_amount,
            total_amount: order.total_amount,
            status: order.status,
            customer: {
                full_name: profile?.full_name || 'Desconocido',
                email: profile?.email || '',
                phone: profile?.phone || null
            }
        };
    });
}