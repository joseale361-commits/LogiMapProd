import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getDistributorBySlug } from '@/lib/supabase/server';
import { getDriversByDistributorId } from '@/lib/queries/routes';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

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

        console.log('[API] Drivers - Search for DistributorID:', distributor.id);

        const drivers = await getDriversByDistributorId(distributor.id);

        console.log('[API] Drivers - Found:', drivers.length);
        console.log(drivers);

        return NextResponse.json({ success: true, drivers });
    } catch (error) {
        console.error('[API] Error fetching drivers:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
