import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type Params = Promise<{ id: string }>;

export async function POST(
    request: NextRequest,
    { params }: { params: any }
) {
    const { id } = await params;
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const stopId = id;
        const body = await request.json();
        const { status, failureReason } = body;

        if (!status || !['delivered', 'failed'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        // Get the stop to verify it belongs to a route assigned to this driver
        const { data: stop, error: stopError } = await supabase
            .from('route_stops')
            .select('route_id')
            .eq('id', stopId)
            .single();

        if (stopError || !stop) {
            return NextResponse.json({ error: 'Stop not found' }, { status: 404 });
        }

        // Check if the route belongs to the current driver
        const { data: route, error: routeError } = await supabase
            .from('routes')
            .select('driver_id')
            .eq('id', stop.route_id)
            .single();

        if (routeError || !route) {
            return NextResponse.json({ error: 'Route not found' }, { status: 404 });
        }

        if (route.driver_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Prepare update data
        const updateData: any = {
            status,
            actual_arrival_time: new Date().toISOString(),
            actual_departure_time: new Date().toISOString(),
        };

        if (status === 'delivered') {
            updateData.delivered_at = new Date().toISOString();
            updateData.delivered_by = user.id;
        } else if (status === 'failed') {
            updateData.failure_reason = failureReason || null;
        }

        // Update the stop
        const { error: updateError } = await supabase
            .from('route_stops')
            .update(updateData)
            .eq('id', stopId);

        if (updateError) {
            console.error('Error updating stop:', updateError);
            return NextResponse.json({ error: 'Failed to update stop' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in update stop API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
