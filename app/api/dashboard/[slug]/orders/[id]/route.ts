import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser, getDistributorBySlug } from '@/lib/supabase/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string; id: string }> }
) {
    try {
        const { slug, id } = await params;

        // Initialize supabase client
        const supabase = await createClient();

        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'No autenticado' },
                { status: 401 }
            );
        }

        // Get distributor
        const distributor = await getDistributorBySlug(slug);
        if (!distributor) {
            return NextResponse.json(
                { success: false, error: 'Distribuidora no encontrada' },
                { status: 404 }
            );
        }

        // Get order by ID
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select(`
                id,
                order_number,
                created_at,
                total_amount,
                subtotal,
                status,
                customer_id,
                delivery_type,
                pickup_time,
                delivery_address_id,
                delivery_address_snapshot,
                delivery_location,
                requested_delivery_date,
                requested_delivery_time_slot,
                payment_method,
                invoice_number,
                profiles!orders_customer_id_fkey (
                    full_name,
                    email,
                    phone
                ),
                addresses!orders_delivery_address_id_fkey (
                    id,
                    street,
                    city,
                    department,
                    neighborhood,
                    interior,
                    notes,
                    latitude,
                    longitude
                )
            `)
            .eq('id', id)
            .eq('distributor_id', distributor.id)
            .single();

        if (orderError || !order) {
            console.error('[API] Error fetching order:', orderError);
            return NextResponse.json(
                { success: false, error: 'Pedido no encontrado' },
                { status: 404 }
            );
        }

        // Get order items with product and variant details
        const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select(`
                id,
                quantity,
                unit_price,
                total_price,
                products!order_items_product_id_fkey (
                    id,
                    name,
                    sku,
                    image_url
                ),
                product_variants!order_items_variant_id_fkey (
                    id,
                    name
                )
            `)
            .eq('order_id', id);

        if (itemsError) {
            console.error('[API] Error fetching order items:', itemsError);
        }

        // Handle profiles join - the foreign key syntax returns data with a different key
        const orderAny = order as any;
        const profile = orderAny.profiles || orderAny['profiles!orders_customer_id_fkey'];
        const address = orderAny.addresses || orderAny['addresses!orders_delivery_address_id_fkey'];

        // Map items with variant support
        const itemsAny = items as any[];
        const mappedItems = (itemsAny || []).map(item => ({
            id: item.id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            product: {
                id: item.products?.id || item['products!order_items_product_id_fkey']?.id,
                name: item.products?.name || item['products!order_items_product_id_fkey']?.name || 'Producto no encontrado',
                sku: item.products?.sku || item['products!order_items_product_id_fkey']?.sku,
                image_url: item.products?.image_url || item['products!order_items_product_id_fkey']?.image_url
            },
            variant: item.product_variants?.name || item['product_variants!order_items_variant_id_fkey']?.name || null
        }));

        // Map to expected frontend structure
        const mappedOrder = {
            ...orderAny,
            customer: {
                full_name: profile?.full_name || 'Desconocido',
                email: profile?.email || '',
                phone: profile?.phone || null
            },
            address: address ? {
                id: address.id,
                street: address.street,
                city: address.city,
                department: address.department,
                neighborhood: address.neighborhood,
                interior: address.interior,
                notes: address.notes,
                latitude: address.latitude,
                longitude: address.longitude
            } : null,
            items: mappedItems,
            delivery_address_text: orderAny.delivery_address_snapshot?.address || '',
        };

        return NextResponse.json({ success: true, order: mappedOrder });
    } catch (error) {
        console.error('[API] Error fetching order:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
