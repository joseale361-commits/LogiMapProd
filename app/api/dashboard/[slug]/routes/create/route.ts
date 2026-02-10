import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getDistributorBySlug } from '@/lib/supabase/server';
import { createRouteWithStops } from '@/lib/queries/dashboard';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const body = await request.json();
        const { driverId, orderIds, plannedDate, notes } = body;

        if (!driverId || !orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Datos incompletos' },
                { status: 400 }
            );
        }

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

        // Create route
        const result = await createRouteWithStops(
            distributor.id,
            driverId,
            user.id,
            orderIds,
            plannedDate,
            notes
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error('[API] Error creating route:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
