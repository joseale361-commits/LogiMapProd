import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const { data: route, error } = await supabase
            .from('routes')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !route) {
            return NextResponse.json(
                { error: 'Ruta no encontrada' },
                { status: 404 }
            );
        }

        return NextResponse.json(route);
    } catch (error) {
        console.error('Error fetching route:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
