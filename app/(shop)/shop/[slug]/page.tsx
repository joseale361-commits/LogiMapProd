import { notFound } from 'next/navigation';
import { getShopData } from '@/lib/queries/shop';
import { ShopStorefront } from '@/components/shop/ShopStorefront';
import { Package } from 'lucide-react';

interface ShopPageProps {
    params: {
        slug: string;
    };
}

export default async function ShopPage({ params }: ShopPageProps) {
    const { slug } = params;
    const shopData = await getShopData(slug);

    if (!shopData) {
        notFound();
    }

    const { allProducts } = shopData;

    // Empty State Check
    if (allProducts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <Package className="w-12 h-12 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Catálogo vacío
                </h2>
                <p className="text-gray-500 max-w-md">
                    Esta distribuidora aún no ha agregado productos a su catálogo.
                    Vuelve más tarde para ver las novedades.
                </p>
            </div>
        );
    }

    return <ShopStorefront data={shopData} />;
}
