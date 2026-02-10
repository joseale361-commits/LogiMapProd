import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

export interface VariantItem {
    id: string;
    name: string;
    price: number;
    originalPrice: number | null;
    image: string | null;
    isNew: boolean;
    isOnSale: boolean;
    packUnits: number;
    sku: string | null;
    stock: number | null;
    category_id: string | null;
}

export interface ShopData {
    distributor: any;
    categories: { id: string; name: string; icon: string | null }[];
    allProducts: VariantItem[];
}

// Obtener datos de la tienda (Perfil + Categorías)
export async function getShopData(slug: string) {
    // Usamos cliente anónimo para páginas públicas
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 1. Buscar Distribuidora
    const { data: distributor, error: distError } = await supabase
        .from('distributors')
        .select('*')
        .eq('slug', slug)
        .single();

    if (distError || !distributor) {
        console.error('[Shop] Distributor not found:', distError);
        return null;
    }

    // 2. Buscar Categorías
    const { data: categories } = await supabase
        .from('categories')
        .select('id, name, icon')
        .eq('distributor_id', distributor.id)
        .order('display_order'); // Ordenamos por orden visual

    // 3. Buscar Productos
    const allProducts = await getShopProducts(distributor.id);

    return {
        distributor,
        categories: categories || [],
        allProducts
    };
}

// Obtener Productos (Filtrados)
export async function getShopProducts(distributorId: string, categoryId?: string) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    try {
        // PASO A: Obtener IDs de productos padre válidos
        let productQuery = supabase
            .from('products')
            .select('id')
            .eq('distributor_id', distributorId)
            .eq('is_active', true);

        // Filtro por Categoría
        if (categoryId && categoryId !== 'ofertas' && categoryId !== 'nuevos') {
            productQuery = productQuery.eq('category_id', categoryId);
        }

        const { data: products } = await productQuery;
        const productIds = products?.map(p => p.id) || [];

        if (productIds.length === 0) return [];

        // PASO B: Obtener Variantes
        let variantQuery = supabase
            .from('product_variants')
            .select(`
                *,
                product:products (
                    id, name, description, image_url, category_id
                )
            `)
            .in('product_id', productIds)
            .eq('is_active', true);

        // Filtros Especiales
        if (categoryId === 'ofertas') {
            variantQuery = variantQuery.eq('is_on_sale', true);
        }
        if (categoryId === 'nuevos') {
            variantQuery = variantQuery.eq('is_new', true);
        }

        const { data: variants, error } = await variantQuery;

        if (error) throw error;

        // PASO C: Mapeo final (Flattening)
        // Aquí es donde arreglamos la imagen
        return variants.map((v: any) => ({
            id: v.id,
            // Nombre: "Coca Cola" + "Lata"
            name: `${v.product?.name || ''} ${v.name || ''}`.trim(),

            price: v.is_on_sale ? v.sale_price : v.price,
            originalPrice: v.is_on_sale ? v.price : null,

            // IMAGEN CORREGIDA: Usa image_url de variante, o del padre
            image: v.image_url || v.product?.image_url || '/placeholder.png',

            isNew: v.is_new,
            isOnSale: v.is_on_sale,
            packUnits: v.pack_units || 1, // Fallback a 1 si es null
            sku: v.sku,
            stock: v.stock_virtual,
            category_id: v.product?.category_id
        }));

    } catch (error) {
        console.error('[Shop] getShopProducts error:', JSON.stringify(error, null, 2));
        return [];
    }
}

// Helper para obtener distribuidora individualmente (si se necesita)
export async function getDistributorBySlug(slug: string) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
        .from('distributors')
        .select('*')
        .eq('slug', slug)
        .single();
    return data;
}