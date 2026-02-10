import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getDistributorBySlug } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

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

        return NextResponse.json({ success: true, distributor });
    } catch (error) {
        console.error('[API] Error fetching settings:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const body = await request.json();
        const { name, phone, logo_url, theme_color, delivery_zones } = body;

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

        // Build update object with only provided fields
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone;
        if (logo_url !== undefined) updateData.logo_url = logo_url;
        if (theme_color !== undefined) {
            updateData.settings = {
                ...(distributor.settings as any || {}),
                theme_color,
            };
        }
        if (delivery_zones !== undefined) {
            updateData.delivery_zones = delivery_zones;
        }

        // Update distributor
        const { data: updatedDistributor, error } = await adminClient
            .from('distributors')
            .update(updateData)
            .eq('id', distributor.id)
            .select()
            .single();

        if (error) {
            console.error('[API] Error updating distributor:', error.message);
            return NextResponse.json(
                { success: false, error: 'Error al actualizar la configuración' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, distributor: updatedDistributor });
    } catch (error) {
        console.error('[API] Error updating settings:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
