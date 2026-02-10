"use server"

import { revalidatePath } from 'next/cache';
import { adminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { CartItem } from '@/lib/contexts/CartContext';
import { Database } from '@/types/supabase';

type Address = Database['public']['Tables']['addresses']['Row'];
type Distributor = Database['public']['Tables']['distributors']['Row'];

interface CreateOrderInput {
    items: CartItem[];
    addressId: string;
    paymentMethod: 'cash' | 'transfer';
    distributorSlug: string;
}

interface CreateOrderResult {
    success: boolean;
    orderId?: string;
    error?: string;
}

/**
 * Creates an order with all its items using a SQL transaction.
 * This ensures that either all data is saved or nothing is saved.
 */
export async function createOrderAction(input: CreateOrderInput): Promise<CreateOrderResult> {
    try {
        console.log('[Order] Starting order creation...');

        // Get the current user using server client (has access to cookies/session)
        const supabase = await createSupabaseServerClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            console.error('[Order] User not authenticated:', userError);
            return { success: false, error: 'Usuario no autenticado' };
        }

        // Get the distributor by slug
        const { data: distributor, error: distributorError } = await adminClient
            .from('distributors')
            .select('*')
            .eq('slug', input.distributorSlug)
            .eq('is_active', true)
            .single();

        if (distributorError || !distributor) {
            console.error('[Order] Distributor not found:', distributorError);
            return { success: false, error: 'Distribuidor no encontrado' };
        }

        // Get the address
        const { data: address, error: addressError } = await adminClient
            .from('addresses')
            .select('*')
            .eq('id', input.addressId)
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single();

        if (addressError || !address) {
            console.error('[Order] Address not found:', addressError);
            return { success: false, error: 'Dirección no encontrada' };
        }

        // Calculate totals
        const subtotal = input.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const totalAmount = subtotal; // No delivery fee for now

        // Generate order number
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        // Prepare items for RPC call
        const itemsForRpc = input.items.map(item => ({
            product_id: item.productId,
            variant_id: item.variantId,
            quantity: item.quantity,
            unit_price: item.price,
            pack_units: item.packUnits,
            subtotal: item.price * item.quantity,
            product_snapshot: {
                name: item.productName,
                variant_name: item.variantName,
                image_url: item.imageUrl,
            },
        }));

        console.log('[Order] Creating order with data:', {
            customerId: user.id,
            distributorId: distributor.id,
            orderNumber,
            subtotal,
            totalAmount,
            paymentMethod: input.paymentMethod,
            addressId: address.id,
            itemsCount: itemsForRpc.length,
            items: itemsForRpc
        });

        // Create order and order items in a transaction using RPC
        const { data: orderData, error: orderError } = await (adminClient as any).rpc('create_order_with_items', {
            p_customer_id: user.id,
            p_distributor_id: distributor.id,
            p_order_number: orderNumber,
            p_subtotal: subtotal,
            p_total_amount: totalAmount,
            p_payment_method: input.paymentMethod,
            p_delivery_address_id: address.id,
            p_delivery_address_snapshot: address as any,
            p_items: itemsForRpc,
        });

        if (orderError) {
            console.error('[Order] Error creating order:', {
                message: orderError.message,
                details: orderError.details,
                hint: orderError.hint,
                code: orderError.code,
                fullError: JSON.stringify(orderError, null, 2)
            });
            return {
                success: false,
                error: `Error al crear el pedido: ${orderError.message || 'Error desconocido'}`
            };
        }

        console.log('[Order] Order created successfully:', orderData);

        // Revalidate paths
        revalidatePath(`/shop/${input.distributorSlug}`);
        revalidatePath(`/shop/${input.distributorSlug}/checkout`);

        // Handle JSONB response (new format) or Table response (old format fallback)
        const orderId = (orderData as any)?.order_id || (orderData as any)?.id || (Array.isArray(orderData) && orderData[0]?.id) || orderData;

        return {
            success: true,
            orderId: orderId,
        };
    } catch (error) {
        console.error('[Order] Unexpected error:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            fullError: JSON.stringify(error, null, 2)
        });
        return {
            success: false,
            error: `Error inesperado al procesar el pedido: ${error instanceof Error ? error.message : 'Error desconocido'}`
        };
    }
}
