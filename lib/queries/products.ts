import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';

export type ProductWithVariants = Database['public']['Tables']['products']['Row'] & {
    variants: Database['public']['Tables']['product_variants']['Row'][];
};

// Función principal para obtener productos del Dashboard
export async function getProductsByDistributorId(distributorId: string) {
    const supabase = await createClient();

    try {
        console.log('[Products] Fetching products for distributorId:', distributorId);

        const { data, error } = await supabase
            .from('products')
            .select(`
                id,
                name,
                description,
                base_price,
                sku,
                image_url,
                is_active,
                created_at,
                distributor_id,
                variants:product_variants(*)
            `)
            .eq('distributor_id', distributorId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Products] Query Error:', JSON.stringify(error, null, 2));
            return [];
        }

        // Map and compute aggregated data
        return (data || []).map(product => {
            const variants = product.variants || [];
            const totalStock = variants.reduce((acc: number, v: any) => acc + (v.stock_virtual || 0), 0);
            const variantCount = variants.length;
            const defaultSku = product.sku || variants[0]?.sku || 'N/A';

            return {
                ...product,
                total_stock: totalStock,
                variant_count: variantCount,
                sku: defaultSku
            };
        });

    } catch (error) {
        console.error('[Products] Unexpected Error:', error);
        return [];
    }
}

// Función para obtener un solo producto (para editar)
export async function getProductById(id: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('products')
        .select(`
            *,
            variants:product_variants(*)
        `)
        .eq('id', id)
        .single();

    if (error) return null;
    return data;
}// Agregar al final del archivo
export async function getCategoriesByDistributorId(distributorId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('distributor_id', distributorId)
        .order('name');

    if (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
    return data;
}