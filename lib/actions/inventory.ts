'use server';

import { adminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function replenishInventoryAction(shopId: string, slug: string) {
    try {
        const { data, error } = await adminClient.rpc('replenish_stock', {
            p_shop_id: shopId
        });

        if (error) {
            console.error('Replenish Stock Error:', error);
            throw new Error(error.message);
        }

        revalidatePath(`/dashboard/${slug}/products`);
        return { success: true, count: data };
    } catch (error) {
        console.error('Replenish Inventory Action Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}
