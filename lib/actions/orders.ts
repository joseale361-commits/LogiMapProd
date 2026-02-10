"use server"

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function cancelOrderAction(orderId: string) {
    const supabase = await createClient();

    // Check current status first to ensure it's still pending_approval
    const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single();

    if (fetchError || !order) {
        return { success: false, error: 'No se pudo encontrar el pedido' };
    }

    if (order.status !== 'pending_approval') {
        return { success: false, error: 'El pedido ya no puede ser cancelado' };
    }

    const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);

    if (updateError) {
        console.error('Error cancelling order:', updateError);
        return { success: false, error: 'Error al cancelar el pedido' };
    }

    revalidatePath(`/shop/orders/${orderId}`);
    revalidatePath('/shop/profile');

    return { success: true };
}
