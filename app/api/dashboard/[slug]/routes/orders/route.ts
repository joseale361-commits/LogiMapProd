import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getDistributorBySlug } from '@/lib/supabase/server';
import { getApprovedOrdersForRouting } from '@/lib/queries/routes';

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

        console.log('[API] Routes - Search Orders for DistributorID:', distributor.id);

        // Get approved orders
        const orders = await getApprovedOrdersForRouting(distributor.id);

        console.log('[API] Routes - Approved Orders Found:', orders.length);

        // FORCE NO-CACHE: Add cache control headers
        const response = NextResponse.json({ success: true, orders });
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');

        return response;
    } catch (error) {
        console.error('[API] Error fetching approved orders:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
