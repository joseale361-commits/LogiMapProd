'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createCategory(formData: FormData, distributorId: string, slug: string) {
    const supabase = await createSupabaseServerClient();

    const name = formData.get('name') as string;
    const icon = formData.get('icon') as string;
    const display_order = parseInt(formData.get('display_order') as string) || 0;

    if (!name) return { success: false, error: 'Name is required' };

    // Generate basic slug from name
    const categorySlug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    const { data, error } = await supabase
        .from('categories')
        .insert({
            name,
            slug: categorySlug,
            icon,
            display_order,
            distributor_id: distributorId,
            is_active: true
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating category:', error);
        return { success: false, error: 'Failed to create category' };
    }

    revalidatePath(`/dashboard/${slug}/categories`);
    return { success: true, category: data };
}

export async function updateCategory(id: string, formData: FormData, slug: string) {
    const supabase = await createSupabaseServerClient();

    const name = formData.get('name') as string;
    const icon = formData.get('icon') as string;
    const display_order = parseInt(formData.get('display_order') as string) || 0;
    const is_active = formData.get('is_active') === 'true';

    const { error } = await supabase
        .from('categories')
        .update({
            name,
            icon,
            display_order,
            is_active
        })
        .eq('id', id);

    if (error) {
        console.error('Error updating category:', error);
        return { success: false, error: 'Failed to update category' };
    }

    revalidatePath(`/dashboard/${slug}/categories`);
    return { success: true };
}

export async function deleteCategory(id: string, slug: string) {
    const supabase = await createSupabaseServerClient();

    // Soft delete by setting is_active to false, or hard delete?
    // User requested "Gestion de Categorias Reales", usually implies full control.
    // Constraints check: if products depend on it, hard delete might fail or cascade.
    // For now, let's try hard delete. If it fails, return error.

    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting category:', error);
        return { success: false, error: 'Failed to delete category (might be in use)' };
    }

    revalidatePath(`/dashboard/${slug}/categories`);
    return { success: true };
}

export async function generateDefaultCategories(distributorId: string, slug: string) {
    const supabase = await createSupabaseServerClient();

    const defaults = [
        { name: 'Gaseosas', icon: '🥤', display_order: 1 },
        { name: 'Energizantes', icon: '⚡', display_order: 2 },
        { name: 'Cervezas', icon: '🍺', display_order: 3 },
        { name: 'Jugos', icon: '🧃', display_order: 4 },
        { name: 'Licores', icon: '🥃', display_order: 5 },
        { name: 'Snacks', icon: '🍟', display_order: 6 },
    ];

    const insertions = defaults.map(cat => ({
        ...cat,
        slug: cat.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
        distributor_id: distributorId,
        is_active: true
    }));

    const { error } = await supabase
        .from('categories')
        .insert(insertions);

    if (error) {
        console.error('Error seeding categories:', error);
        return { success: false, error: 'Failed to seed categories' };
    }

    revalidatePath(`/dashboard/${slug}/categories`);
    return { success: true };
}
