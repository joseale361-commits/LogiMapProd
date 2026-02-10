'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Toggle a distributor in customer's favorites
 * FIXME: customer_relationships table is missing in the new schema.
 * Re-implementing as a no-op or using a different mechanism if required later.
 */
export async function toggleFavoriteDistributor(shopId: string) {
    // Current schema doesn't support multiple shop links/favorites per customer record
    // as customers are directly linked to a single shop via shop_id.
    return { success: true, isFavorite: true, message: 'Función en mantenimiento: El portal ahora es monomarca.' };
}

// Keep old functions for backward compatibility
export async function addFavoriteDistributor(shopId: string) {
    return toggleFavoriteDistributor(shopId);
}

export async function removeFavoriteDistributor(shopId: string) {
    return toggleFavoriteDistributor(shopId);
}
