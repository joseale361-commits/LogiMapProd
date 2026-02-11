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
    addressId?: string; // Optional for pickup
    paymentMethod: 'cash' | 'transfer' | 'credit';
    distributorSlug: string;
    deliveryType: 'delivery' | 'pickup';
    pickupTime?: string;
    initialPayment?: number;
    deliveryFee?: number; // Calculated delivery fee based on distance
    // POS Mode: customer_id for admin/staff creating orders on behalf of clients
    customerId?: string;
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
        const supabase = await createSupabaseServerClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
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
            return { success: false, error: 'Distribuidor no encontrado' };
        }

        // Get user role for this distributor
        const { data: distributorUser, error: roleError } = await adminClient
            .from('distributor_users')
            .select('role')
            .eq('user_id', user.id)
            .eq('distributor_id', distributor.id)
            .eq('is_active', true)
            .single();

        // Role not found, default to 'client'
        const userRole = distributorUser?.role || 'client';
        const isAdminOrStaff = userRole === 'admin' || userRole === 'staff';

        // POS Mode: Determine the customer_id for the order
        let customerId: string;

        if (input.customerId) {
            // Admin/Staff creating order for a specific client
            if (!isAdminOrStaff) {
                return { success: false, error: 'No autorizado para crear pedidos en nombre de otros clientes' };
            }

            // Verify the customer exists and has a relationship with this distributor
            const { data: customerRel, error: customerError } = await adminClient
                .from('customer_relationships')
                .select('customer_id')
                .eq('customer_id', input.customerId)
                .eq('distributor_id', distributor.id)
                .eq('status', 'active')
                .single();

            if (customerError || !customerRel) {
                return { success: false, error: 'Cliente no válido para este distribuidor' };
            }

            customerId = input.customerId;
        } else {
            // Regular client creating order for themselves
            customerId = user.id;
        }

        // Get the address or create dummy snapshot for pickup
        let addressId: string | null = null;
        let addressSnapshot: any = null;

        if (input.deliveryType === 'delivery') {
            if (!input.addressId) {
                return { success: false, error: 'Dirección de envío requerida para domicilio' };
            }

            const { data: addr, error: addressError } = await adminClient
                .from('addresses')
                .select('*')
                .eq('id', input.addressId)
                .eq('user_id', customerId)
                .eq('is_active', true)
                .single();

            if (addressError || !addr) {
                return { success: false, error: 'Dirección no encontrada' };
            }
            addressId = addr.id;
            addressSnapshot = addr;
        } else {
            // Pickup: Create dummy snapshot to satisfy NOT NULL constraint
            addressSnapshot = {
                label: "Retiro en Bodega",
                street_address: "Dirección de la Distribuidora",
                city: "Local",
                is_pickup: true
            };
        }

        // Calculate totals
        const subtotal = input.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const deliveryFee = input.deliveryFee || 0;
        const totalAmount = subtotal + deliveryFee;

        // Generate order number
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        // CRITICAL: Get parent product IDs from variants to fix FK error
        // The cart stores variant IDs, but order_items needs the parent product_id
        const variantIds = input.items.map(item => item.variantId);

        const { data: variants, error: variantsError } = await adminClient
            .from('product_variants')
            .select('id, product_id')
            .in('id', variantIds);

        if (variantsError || !variants) {
            return {
                success: false,
                error: 'Error al obtener información de productos'
            };
        }

        // Create a map of variant_id -> product_id for quick lookup
        const variantToProductMap = new Map(
            variants.map((v: { id: string; product_id: string }) => [v.id, v.product_id])
        );

        // Prepare items for RPC call with correct product_id (parent)
        const itemsForRpc = input.items.map(item => {
            const parentProductId = variantToProductMap.get(item.variantId);

            if (!parentProductId) {
                throw new Error(`Product ID not found for variant ${item.variantId}`);
            }

            return {
                product_id: parentProductId,
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
            };
        });

        // Create order and order items in a transaction using RPC
        const { data: orderData, error: orderError } = await (adminClient as any).rpc('create_order_with_items', {
            p_customer_id: customerId,
            p_distributor_id: distributor.id,
            p_order_number: orderNumber,
            p_subtotal: subtotal,
            p_total_amount: totalAmount,
            p_payment_method: input.paymentMethod,
            p_delivery_address_id: addressId,
            p_delivery_address_snapshot: addressSnapshot,
            p_items: itemsForRpc,
            p_delivery_type: input.deliveryType,
            p_pickup_time: input.pickupTime || null,
            p_initial_payment: input.initialPayment || 0,
            p_delivery_fee: deliveryFee
        });

        if (orderError) {
            return {
                success: false,
                error: `Error al crear el pedido: ${orderError.message || 'Error desconocido'}`
            };
        }

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
        return {
            success: false,
            error: `Error inesperado al procesar el pedido: ${error instanceof Error ? error.message : 'Error desconocido'}`
        };
    }
}
