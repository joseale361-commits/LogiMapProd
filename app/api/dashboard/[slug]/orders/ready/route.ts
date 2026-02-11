import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getDistributorBySlug } from '@/lib/supabase/server';
import { markOrderAsReadyForPickup } from '@/lib/queries/dashboard';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const body = await request.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json(
                { success: false, error: 'ID de pedido requerido' },
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

        // Mark as ready
        const result = await markOrderAsReadyForPickup(orderId, user.id);

        return NextResponse.json(result);
    } catch (error) {
        console.error('[API] Error marking order as ready:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
