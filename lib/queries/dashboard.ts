import { adminClient } from '../supabase/admin';
import { Database } from '@/types/supabase';

type Order = Database['public']['Tables']['orders']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export interface OrderWithCustomer extends Order {
    customer: {
        name: string;
        email: string | null;
        phone: string | null;
    };
    delivery_address_text: string;
}

/**
 * Fetches pending approval orders for a shop.
 */
export async function getPendingApprovalOrders(
    shopId: string
): Promise<OrderWithCustomer[]> {
    try {
        const { data: orders, error } = await adminClient
            .from('orders')
            .select(`
                *,
                customer:customers (
                    name,
                    email,
                    phone
                )
            `)
            .eq('distributor_id', shopId)
            .eq('status', 'pending') // Adjusted status from 'pending_approval' to 'pending'
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Dashboard] Error fetching pending orders:', error.message);
            return [];
        }

        if (!orders) {
            return [];
        }

        return orders.map((order: any) => ({
            ...order,
            customer: order.customer,
            delivery_address_text: order.shipping_address || '',
        })) as OrderWithCustomer[];
    } catch (err) {
        console.error('[Dashboard] Unexpected error in getPendingApprovalOrders:', err);
        return [];
    }
}

/**
 * Fetches approved/paid orders for a shop.
 */
export async function getApprovedOrders(
    shopId: string
): Promise<OrderWithCustomer[]> {
    try {
        console.log('[Dashboard] Fetching approved orders for shopId:', shopId);
        const { data: orders, error } = await adminClient
            .from('orders')
            .select(`
                *,
                customer:customers (
                    name,
                    email,
                    phone
                )
            `)
            .eq('distributor_id', shopId)
            .eq('status', 'approved')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Dashboard] Error fetching approved orders:', error.message);
            return [];
        }

        console.log('[Dashboard] Raw approved orders count:', orders?.length);

        if (!orders) {
            return [];
        }

        return orders.map((order: any) => ({
            ...order,
            customer: order.customer,
            delivery_address_text: order.shipping_address || '',
        })) as OrderWithCustomer[];
    } catch (err) {
        console.error('[Dashboard] Unexpected error in getApprovedOrders:', err);
        return [];
    }
}

/**
 * Fetches drivers for a shop.
 */
export async function getDistributorDrivers(
    shopId: string
): Promise<Profile[]> {
    try {
        console.log('[Dashboard] Fetching drivers for shopId:', shopId);
        const { data: drivers, error } = await adminClient
            .from('profiles')
            .select('*')
            .eq('distributor_id', shopId)
            .in('role', ['driver', 'staff', 'owner', 'admin'])
            .eq('is_active', true);

        if (error) {
            console.error('[Dashboard] Error fetching drivers:', error.message);
            return [];
        }

        console.log('[Dashboard] Raw drivers count:', drivers?.length);

        return drivers || [];
    } catch (err) {
        console.error('[Dashboard] Unexpected error in getDistributorDrivers:', err);
        return [];
    }
}

/**
 * FIXME: The following logic depends on 'routes' and 'route_stops' tables 
 * which were not found in the latest database schema.
 */

/*
export async function getActiveRoutes(shopId: string): Promise<any[]> {
    // Unsupported in current schema
    return [];
}

export async function createRouteWithStops(...) {
     // Unsupported in current schema
     return { success: false, error: 'Logistics module not available in current schema' };
}
*/

/**
 * Approves an order.
 */
export async function approveOrder(
    orderId: string,
    userId: string,
    invoiceNumber?: string
): Promise<{ success: boolean; error?: string; order?: any }> {
    try {
        // Fallback to manual update if RPC is missing or different
        const { data, error } = await adminClient
            .from('orders')
            .update({
                status: 'approved',
                approved_at: new Date().toISOString(),
                approved_by: userId,
                invoice_number: invoiceNumber || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId)
            .select()
            .single();

        if (error) {
            console.error('[Dashboard] Error approving order:', error.message);
            return { success: false, error: error.message };
        }

        return { success: true, order: data };
    } catch (err) {
        console.error('[Dashboard] Unexpected error in approveOrder:', err);
        return { success: false, error: 'Unexpected error occurred' };
    }
}

/**
 * Rejects an order.
 */
export async function rejectOrder(
    orderId: string,
    userId: string,
    cancellationReason?: string
): Promise<{ success: boolean; error?: string; order?: any }> {
    try {
        const { data, error } = await adminClient
            .from('orders')
            .update({
                status: 'cancelled',
                internal_notes: cancellationReason || null,
                approved_by: userId,
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId)
            .select()
            .single();

        if (error) {
            console.error('[Dashboard] Error rejecting order:', error.message);
            return { success: false, error: error.message };
        }

        return { success: true, order: data };
    } catch (err) {
        console.error('[Dashboard] Unexpected error in rejectOrder:', err);
        return { success: false, error: 'Unexpected error occurred' };
    }
}

/**
 * Marks a pickup order as ready for pickup.
 */
export async function markOrderAsReadyForPickup(
    orderId: string,
    userId: string
): Promise<{ success: boolean; error?: string; order?: any }> {
    try {
        const { data, error } = await adminClient
            .from('orders')
            .update({
                status: 'approved',
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId)
            .select()
            .single();

        if (error) {
            console.error('[Dashboard] Error marking order as ready:', error.message);
            return { success: false, error: error.message };
        }

        return { success: true, order: data };
    } catch (err) {
        console.error('[Dashboard] Unexpected error in markOrderAsReadyForPickup:', err);
        return { success: false, error: 'Unexpected error occurred' };
    }
}

/**
 * Marks a pickup order as delivered.
 */
export async function markOrderAsDelivered(
    orderId: string,
    userId: string
): Promise<{ success: boolean; error?: string; order?: any }> {
    try {
        const { data, error } = await adminClient
            .from('orders')
            .update({
                status: 'delivered',
                delivered_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId)
            .select()
            .single();

        if (error) {
            console.error('[Dashboard] Error marking order as delivered:', error.message);
            return { success: false, error: error.message };
        }

        return { success: true, order: data };
    } catch (err) {
        console.error('[Dashboard] Unexpected error in markOrderAsDelivered:', err);
        return { success: false, error: 'Unexpected error occurred' };
    }
}
