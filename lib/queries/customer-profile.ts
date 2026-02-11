import { createClient } from '@/lib/supabase/server';

export interface CustomerProfileData {
    id: string;
    full_name: string;
    phone: string | null;
}

export interface CustomerAddress {
    id: string;
    label: string | null;
    street_address: string;
    city: string;
    state: string | null;
    country: string | null;
    postal_code: string | null;
    additional_info: string | null;
    delivery_instructions: string | null;
    is_default: boolean | null;
    lat: number | null;
    lng: number | null;
}

export interface CustomerOrder {
    id: string;
    created_at: string;
    total_amount: number;
    status: string;
    distributor_name: string;
}

/**
 * Get customer profile data
 */
export async function getCustomerProfile(userId: string): Promise<CustomerProfileData | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching customer profile:', error.message);
        return null;
    }

    return data;
}

/**
 * Get customer addresses from the addresses table
 */
export async function getCustomerAddresses(userId: string): Promise<CustomerAddress[]> {
    const supabase = await createClient();

    console.log('[getCustomerAddresses] Fetching addresses for userId:', userId);

    const { data, error } = await supabase
        .from('addresses')
        .select('id, label, street_address, city, state, country, postal_code, additional_info, delivery_instructions, is_default')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[getCustomerAddresses] Error fetching addresses:', error.message);
        return [];
    }

    console.log('[getCustomerAddresses] Found addresses:', data?.length || 0, data);

    return (data || []).map(addr => ({
        id: addr.id,
        label: addr.label,
        street_address: addr.street_address,
        city: addr.city,
        state: addr.state,
        country: addr.country,
        postal_code: addr.postal_code,
        additional_info: addr.additional_info,
        delivery_instructions: addr.delivery_instructions,
        is_default: addr.is_default,
        lat: null,
        lng: null,
    }));
}

/**
 * Get customer order history
 */
export async function getCustomerOrders(userId: string, limit: number = 10): Promise<CustomerOrder[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('orders')
        .select(`
            id,
            created_at,
            total_amount,
            status,
            distributor_id,
            distributors(name)
        `)
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching customer orders:', error.message);
        return [];
    }

    return (data || []).map((order: any) => ({
        id: order.id,
        created_at: order.created_at,
        total_amount: Number(order.total_amount),
        status: order.status,
        distributor_name: order.distributors?.name || 'Distribuidor desconocido',
    }));
}
