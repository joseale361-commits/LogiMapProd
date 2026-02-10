'use server';

import { revalidatePath } from 'next/cache';
import { adminClient } from '@/lib/supabase/admin';

/**
 * Seeds initial categories for a distributor.
 * Only creates categories if none exist.
 */
export async function seedCategoriesAction(distributorId: string) {
    try {
        // Check if categories already exist
        const { data: existingCategories, error: checkError } = await adminClient
            .from('categories')
            .select('id')
            .eq('distributor_id', distributorId)
            .limit(1);

        if (checkError) {
            console.error('[SeedCategories] Error checking categories:', checkError);
            return { success: false, error: 'Error al verificar categorías' };
        }

        if (existingCategories && existingCategories.length > 0) {
            return {
                success: false,
                error: 'Ya existen categorías para este distributor',
                skipped: true
            };
        }

        // Insert sample categories
        const categories = [
            { name: 'Bebidas', slug: 'bebidas', description: 'Bebidas y refrescos' },
            { name: 'Snacks', slug: 'snacks', description: 'Snacks y botanas' },
            { name: 'Lácteos', slug: 'lacteos', description: 'Productos lácteos' },
            { name: 'Panadería', slug: 'panaderia', description: 'Pan y productos de panadería' },
            { name: 'Abarrotes', slug: 'abarrotes', description: 'Productos de abarrotes' },
        ];

        const categoriesToInsert = categories.map(cat => ({
            ...cat,
            distributor_id: distributorId,
            is_active: true,
        }));

        const { error: insertError, data } = await adminClient
            .from('categories')
            .insert(categoriesToInsert)
            .select('id');

        if (insertError) {
            console.error('[SeedCategories] Error inserting categories:', insertError);
            return { success: false, error: 'Error al crear categorías' };
        }

        // Revalidate products page
        revalidatePath('/dashboard/[slug]/products/new', 'page');

        return {
            success: true,
            count: data?.length || 0,
            message: `${data?.length || 0} categorías creadas exitosamente`
        };
    } catch (error) {
        console.error('[SeedCategories] Unexpected error:', error);
        return { success: false, error: 'Error inesperado' };
    }
}
