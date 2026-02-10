import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

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

        const routeId = id;

        // Check if the route belongs to the current driver
        const { data: route, error: routeError } = await supabase
            .from('routes')
            .select('driver_id, status')
            .eq('id', routeId)
            .single();

        if (routeError || !route) {
            return NextResponse.json({ error: 'Route not found' }, { status: 404 });
        }

        if (route.driver_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (route.status !== 'planned') {
            return NextResponse.json({ error: 'Route is not in planned status' }, { status: 400 });
        }

        // Update route status to in_progress
        const { error: updateError } = await supabase
            .from('routes')
            .update({
                status: 'in_progress',
                started_at: new Date().toISOString(),
            })
            .eq('id', routeId);

        if (updateError) {
            console.error('Error starting route:', updateError);
            return NextResponse.json({ error: 'Failed to start route' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in start route API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
