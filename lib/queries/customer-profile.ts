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
    country: string;
    postal_code: string | null;
    additional_info: string | null;
    delivery_instructions: string | null;
    is_default: boolean;
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
 * Get customer addresses
 * FIXME: 'addresses' table is missing in the new schema. 
 * Addresses are now likely stored as strings in main tables.
 */
export async function getCustomerAddresses(userId: string): Promise<CustomerAddress[]> {
    // Current schema doesn't have a separate addresses table.
    return [];
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
