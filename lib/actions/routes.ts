'use server';

import { createRouteWithStops } from '@/lib/queries/routes';
import { getCurrentUser, getDistributorBySlug } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createRouteAction(
    slug: string,
    driverId: string,
    orderIds: string[],
    plannedDate: string,
    notes?: string
) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('No autenticado');

        const distributor = await getDistributorBySlug(slug);
        if (!distributor) throw new Error('Distribuidora no encontrada');

        const result = await createRouteWithStops(
            distributor.id,
            driverId,
            user.id,
            orderIds,
            plannedDate,
            notes
        );

        if (result.success) {
            revalidatePath(`/dashboard/${slug}/routes`);
        }

        return result;
    } catch (error: any) {
        console.error('[Action] Error creating route:', error);
        return { success: false, error: error.message };
    }
}
