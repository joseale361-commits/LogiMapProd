import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
    const supabase = await createClient();

    // 1. Validate User
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { stopId, paymentMethod, amountCollected, notes } = body;

        // Validate required fields
        if (!stopId) {
            return NextResponse.json({ error: 'Stop ID es requerido' }, { status: 400 });
        }

        const actualPaymentMethod = paymentMethod || 'driver';

        console.log('[CompleteDelivery] Procesando stopId:', stopId);
        console.log('[CompleteDelivery] amountCollected:', amountCollected);

        // 2. Fetch Stop details with route info
        const { data: stopData, error: stopError } = await adminClient
            .from('route_stops')
            .select('*')
            .eq('id', stopId)
            .single();

        if (stopError || !stopData) {
            console.error('[CompleteDelivery] Error al buscar parada:', stopError);
            return NextResponse.json({ error: 'Parada no encontrada' }, { status: 404 });
        }

        // Check if stop is already completed
        if (stopData.status === 'completed') {
            return NextResponse.json({ error: 'Esta parada ya fue completada' }, { status: 400 });
        }

        // 3. Fetch Order details
        if (!stopData.order_id) {
            return NextResponse.json({ error: 'Esta parada no tiene un pedido asociado' }, { status: 400 });
        }

        const { data: orderData, error: orderError } = await adminClient
            .from('orders')
            .select('*')
            .eq('id', stopData.order_id)
            .single();

        if (orderError || !orderData) {
            console.error('[CompleteDelivery] Error al buscar pedido:', orderError);
            return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
        }

        const order = orderData;

        // 4. Calculate actual balance from payments
        const { data: payments, error: paymentsError } = await adminClient
            .from('payments')
            .select('amount')
            .eq('order_id', order.id);

        if (paymentsError) {
            console.error('[CompleteDelivery] Error al consultar pagos:', paymentsError);
        }

        const totalPaid = payments?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;
        const currentBalance = Number(order.total_amount || 0) - totalPaid;
        const collectedAmount = Number(amountCollected) || 0;
        const newBalance = Math.max(0, currentBalance - collectedAmount);
        const isFullyPaid = newBalance <= 0 && collectedAmount >= currentBalance;

        console.log('[CompleteDelivery] totalPaid:', totalPaid);
        console.log('[CompleteDelivery] currentBalance:', currentBalance);
        console.log('[CompleteDelivery] newBalance:', newBalance);

        // 5. Record payment if amount was collected
        if (collectedAmount > 0) {
            // Use RPC function to bypass PostgREST schema cache
            const { data: paymentId, error: paymentError } = await adminClient.rpc('insert_payment', {
                p_distributor_id: order.distributor_id,
                p_customer_id: order.customer_id,
                p_amount: collectedAmount,
                p_payment_method: actualPaymentMethod,
                p_notes: notes || `Cobrado por repartidor en entrega`,
                p_payment_date: new Date().toISOString().split('T')[0],
                p_created_by: user.id,
                p_order_id: order.id
            });

            if (paymentError) {
                console.error('[CompleteDelivery] Error al insertar pago via RPC:', JSON.stringify(paymentError, null, 2));
                return NextResponse.json(
                    { error: 'Error al registrar pago', details: paymentError.message, hint: paymentError.hint, code: paymentError.code },
                    { status: 500 }
                );
            }
            console.log('[CompleteDelivery] Payment inserted successfully via RPC, id:', paymentId);
        }

        // 6. Update order status and balance
        const orderUpdateData: Record<string, any> = {
            status: 'delivered',
            delivered_at: new Date().toISOString(),
            delivered_by: user.id
        };

        if (collectedAmount > 0) {
            orderUpdateData.payment_status = isFullyPaid ? 'paid' : 'partial';
        } else if (order.payment_status !== 'paid') {
            orderUpdateData.payment_status = 'pending';
        }

        const { error: orderUpdateError } = await adminClient
            .from('orders')
            .update(orderUpdateData)
            .eq('id', order.id);

        if (orderUpdateError) {
            console.error('[CompleteDelivery] Error al actualizar pedido:', JSON.stringify(orderUpdateError, null, 2));
            return NextResponse.json(
                { error: 'Error al actualizar pedido', details: orderUpdateError.message },
                { status: 500 }
            );
        }

        // 7. Update route stop status
        console.log('[CompleteDelivery] Updating stop:', stopId);
        const { error: stopUpdateError } = await adminClient
            .from('route_stops')
            .update({
                status: 'completed',
                delivered_at: new Date().toISOString(),
                notes: notes || stopData.notes || null
            })
            .eq('id', stopId);

        if (stopUpdateError) {
            console.error('[CompleteDelivery] Error al actualizar parada:', JSON.stringify(stopUpdateError, null, 2));
            return NextResponse.json(
                { error: 'Error al actualizar estado de parada', details: stopUpdateError.message, hint: stopUpdateError.hint, code: stopUpdateError.code },
                { status: 500 }
            );
        }

        // 8. Check if all stops on the route are completed
        const { data: routeStops, error: routeStopsError } = await adminClient
            .from('route_stops')
            .select('status')
            .eq('route_id', stopData.route_id);

        if (!routeStopsError && routeStops) {
            const allCompleted = routeStops.every((s: any) => s.status === 'completed');
            if (allCompleted) {
                await adminClient
                    .from('routes')
                    .update({
                        status: 'completed',
                        completed_at: new Date().toISOString()
                    })
                    .eq('id', stopData.route_id);
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                stopId,
                orderId: order.id,
                orderNumber: order.order_number,
                amountCollected: collectedAmount,
                newBalance,
                paymentStatus: orderUpdateData.payment_status,
                orderStatus: 'delivered'
            }
        });

    } catch (error) {
        console.error('[CompleteDelivery] Error inesperado:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : '';
        return NextResponse.json(
            { error: 'Error interno del servidor', details: errorMessage, stack: errorStack },
            { status: 500 }
        );
    }
}
