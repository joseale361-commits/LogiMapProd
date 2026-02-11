import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

export async function POST(
    request: NextRequest,
    { params }: { params: any }
) {
    try {
        const { id } = await params;

        // 1. Auth Check - Ensure Admin
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Update Route Status
        const { error } = await adminClient
            .from('routes')
            .update({
                status: 'finished',
                finished_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            console.error('Error finishing route:', error);
            return NextResponse.json({ error: 'Failed to finish route' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Finish Route API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
