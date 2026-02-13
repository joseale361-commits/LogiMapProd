import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const supabase = createAdminClient();
        const routeId = params.id;

        // 1. Get Stops
        const { data: stops, error: stopsError } = await supabase
            .from('route_stops')
            .select('id, status, order_id')
            .eq('route_id', routeId);

        if (stopsError) throw stopsError;

        // 2. Process Orders
        for (const stop of stops || []) {
            if (stop.status.toLowerCase() === 'completed') {
                const { error } = await supabase.from('orders').update({ status: 'delivered' }).eq('id', stop.order_id);
                if (error) console.error('Order Update Error:', error);
            } else if (['finished', 'delivered'].includes(stop.status.toLowerCase())) {
                const { error } = await supabase.from('orders').update({ status: 'delivered' }).eq('id', stop.order_id);
                if (error) console.error('Order Update Error:', error);
            } else {
                // Failed or Pending -> Return to pool
                await supabase.from('orders').update({ status: 'approved' }).eq('id', stop.order_id);
            }
        }

        // 3. Close Route
        const { error: updateError } = await supabase
            .from('routes')
            .update({ status: 'finished', finished_at: new Date().toISOString() })
            .eq('id', routeId);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Finish Route Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
