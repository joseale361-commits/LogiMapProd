import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser, getDistributorBySlug } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

export async function GET(
    request: NextRequest,
    { params }: { params: any }
) {
    try {
        const { slug } = await params;

        const supabase = await createClient();
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const distributor = await getDistributorBySlug(slug);
        if (!distributor) return NextResponse.json({ error: 'Distributor not found' }, { status: 404 });

        // Fetch routes
        const { data: routes, error } = await adminClient
            .from('routes')
            .select(`
                *,
                driver:profiles!driver_id (full_name)
            `)
            .eq('distributor_id', distributor.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        return NextResponse.json({
            success: true,
            routes
        });

    } catch (error) {
        console.error('Routes List API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
