import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDistributorBySlug } from '@/lib/supabase/server';
import { getCategoriesByDistributorId } from '@/lib/queries/products';
import { ProductForm } from '@/components/products/ProductForm';

interface PageProps {
    params: {
        slug: string;
    };
}

/**
 * Product creation page.
 */
export default async function NewProductPage({ params }: PageProps) {
    const { slug } = params;

    // Get distributor
    const distributor = await getDistributorBySlug(slug);
    if (!distributor) {
        notFound();
    }

    // Fetch categories for dropdown
    const categories = await getCategoriesByDistributorId(distributor.id);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href={`/dashboard/${slug}/products`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Crear Producto</h1>
                    <p className="text-gray-600 mt-1">
                        Agrega un nuevo producto con sus variantes
                    </p>
                </div>
            </div>

            {/* Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Información del Producto</CardTitle>
                </CardHeader>
                <CardContent>
                    <ProductForm
                        distributorId={distributor.id}
                        distributorSlug={slug}
                        categories={categories}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
