import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser, getDistributorBySlug } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

export async function GET(
    request: NextRequest,
    { params }: { params: any }
) {
    try {
        const { slug, id } = await params;

        // 1. Auth & Distributor Check
        const supabase = await createClient();
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const distributor = await getDistributorBySlug(slug);
        if (!distributor) return NextResponse.json({ error: 'Distributor not found' }, { status: 404 });

        // 2. Fetch Route Details with Driver
        const { data: route, error: routeError } = await adminClient
            .from('routes')
            .select(`
                *,
                driver:profiles!driver_id (
                    id, full_name, email, phone
                )
            `)
            .eq('id', id)
            .single();

        if (routeError || !route) {
            return NextResponse.json({ error: 'Route not found' }, { status: 404 });
        }

        // 3. Fetch Stops & Orders
        const { data: stops, error: stopsError } = await adminClient
            .from('route_stops')
            .select(`
                *,
                orders (
                    id,
                    order_number,
                    total_amount,
                    balance_due,
                    payment_status,
                    payment_method,
                    customer:profiles!customer_id (full_name)
                )
            `)
            .eq('route_id', id)
            .order('sequence_order');

        if (stopsError) {
            console.error('Stops Error:', stopsError);
            throw stopsError;
        }

        // 4. Fetch Payments for these orders
        // We want to know payments collected BY THE DRIVER for these orders.
        // Heuristic: Created by driver_id OR payment_method='cash' and date matches route?
        // Let's filter by order_ids and created_by = driver_id if possible.
        // If driver didn't user the app (e.g. legacy), maybe just manual log.
        // But since we built the app feature, we rely on created_by.

        const orderIds = stops?.map((s: any) => s.order_id).filter(Boolean) as string[] || [];

        let payments = [];
        if (orderIds.length > 0) {
            const { data: paymentsData, error: paymentsError } = await adminClient
                .from('payments')
                .select('*')
                .in('order_id', orderIds)
                .eq('created_by', route.driver_id); // STRICT: Only what THIS driver collected via app

            if (!paymentsError) {
                payments = paymentsData || [];
            }
        }

        // 5. Structure Response
        return NextResponse.json({
            success: true,
            route,
            stops,
            payments
        });

    } catch (error) {
        console.error('Route Detail API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
