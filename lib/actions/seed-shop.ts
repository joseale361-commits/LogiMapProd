'use server';

import { revalidatePath } from 'next/cache';
import { adminClient } from '@/lib/supabase/admin';

/**
 * Creates the 'mi-tienda' distributor if it doesn't exist.
 * This is a helper for the demo environment.
 */
export async function seedShopDistributorAction() {
    try {
        // Check if exists
        const { data: existing } = await adminClient
            .from('distributors')
            .select('id')
            .eq('slug', 'mi-tienda')
            .single();

        if (existing) {
            return {
                success: true,
                message: 'La tienda "mi-tienda" ya existe.',
                alreadyExists: true
            };
        }

        // Create distributor
        const { data, error } = await adminClient
            .from('distributors')
            .insert({
                name: 'Mi Tienda',
                slug: 'mi-tienda',
                email: 'contacto@mitienda.com',
                phone: '+57 300 123 4567',
                is_active: true,
                plan_type: 'basic',
                subscription_status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select('slug')
            .single();

        if (error) {
            console.error('[SeedShop] Error creating distributor:', error);
            return { success: false, error: 'Error al crear la tienda.' };
        }

        return {
            success: true,
            message: 'Tienda creada exitosamente'
        };
    } catch (error) {
        console.error('[SeedShop] Unexpected error:', error);
        return { success: false, error: 'Error inesperado.' };
    }
}
