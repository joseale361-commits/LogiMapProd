import { notFound } from 'next/navigation';
import { getDistributorBySlug } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import ProductEditForm from '@/components/products/ProductEditForm';
import { getCategoriesByDistributorId } from '@/lib/queries/products';

interface PageProps {
    params: {
        slug: string;
        id: string;
    };
}

export default async function ProductEditPage({ params }: PageProps) {
    const { slug, id } = params;

    const distributor = await getDistributorBySlug(slug);
    if (!distributor) notFound();

    // Fetch product with variants
    const { data: product, error } = await adminClient
        .from('products')
        .select(`
            *,
            product_variants (*)
        `)
        .eq('id', id)
        .eq('distributor_id', distributor.id)
        .single();

    if (error || !product) {
        console.error('Error fetching product:', error);
        notFound();
    }

    const categories = await getCategoriesByDistributorId(distributor.id);

    return (
        <div className="container mx-auto py-8 px-4">
            <ProductEditForm
                product={product}
                variants={(product.product_variants || []).map((v: any) => ({
                    ...v,
                    target_stock: v.target_stock || 0
                }))}
                categories={categories}
                distributorId={distributor.id}
                slug={slug}
            />
        </div>
    );
}
