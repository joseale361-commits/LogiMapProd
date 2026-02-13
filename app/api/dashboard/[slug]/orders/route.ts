import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser, getDistributorBySlug } from '@/lib/supabase/server';
// import { getPendingApprovalOrders } from '@/lib/queries/dashboard'; // REMOVE FILTER
import { getOrdersByDistributorId } from '@/lib/queries/orders'; // USE THIS

export async function GET(
    request: NextRequest,
    { params }: { params: any }
) {
    try {
        const { slug } = await params;

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

        console.log('[API] Check Orders for DistributorID:', distributor.id);

        // Get pending approval orders
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select(`
                id,
                order_number,
                created_at,
                total_amount,
                status,
                customer_id,
                delivery_type,
                pickup_time,
                delivery_address_snapshot,
                payment_method,
                profiles!orders_customer_id_fkey (
                    full_name,
                    email
                )
            `)
            .eq('distributor_id', distributor.id)
            .in('status', ['pending', 'approved', 'processing', 'in_transit', 'delivered'])
            .order('created_at', { ascending: false });

        if (ordersError) {
            console.error('[API] Query Error:', ordersError);
            throw ordersError;
        }

        // Map to expected frontend structure
        const mappedOrders = (orders || []).map((order: any) => {
            const profile = order.profiles || order['profiles!orders_customer_id_fkey'];
            return {
                ...order,
                customer: {
                    full_name: profile?.full_name || 'Desconocido',
                    email: profile?.email || '',
                    phone: profile?.phone || null
                }
            };
        });

        console.log('[API] Orders Found (Pending Approval):', mappedOrders.length);

        return NextResponse.json({ success: true, orders: mappedOrders });
    } catch (error) {
        console.error('[API] Error fetching orders:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
