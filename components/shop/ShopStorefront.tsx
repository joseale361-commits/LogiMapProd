'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Package, SearchX } from 'lucide-react';
import { ProductCard } from '@/components/shop/ProductCard';
import { CategoryFilter } from '@/components/shop/CategoryFilter';
import { ShopData, VariantItem } from '@/lib/queries/shop';

interface ShopStorefrontProps {
    data: ShopData;
}

export function ShopStorefront({ data }: ShopStorefrontProps) {
    const { categories, allProducts } = data;
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('q')?.toLowerCase() || '';
    const selectedCategory = searchParams.get('category'); // Sync with URL

    // Filter products based on selected category AND search query
    const filteredProducts = useMemo(() => {
        let result = allProducts;

        // 1. Category Filter
        if (selectedCategory === 'ofertas') {
            result = result.filter((p: VariantItem) => p.isOnSale);
        } else if (selectedCategory === 'nuevos') {
            result = result.filter((p: VariantItem) => p.isNew);
        } else if (selectedCategory) {
            result = result.filter((p: VariantItem) => p.category_id === selectedCategory);
        }

        // 2. Search Filter
        if (searchQuery) {
            result = result.filter((p: VariantItem) =>
                p.name.toLowerCase().includes(searchQuery) ||
                (p.sku && p.sku.toLowerCase().includes(searchQuery))
            );
        }

        return result;
    }, [selectedCategory, allProducts, searchQuery]);

    // Dynamic Title for the Grid
    const gridTitle = useMemo(() => {
        if (selectedCategory === 'ofertas') return '🔥 Nuestras Ofertas';
        if (selectedCategory === 'nuevos') return '🆕 Últimas Novedades';
        if (!selectedCategory) return 'Todos los Productos';

        // Find category name from the objects list
        const cat = categories.find((c: any) => c.id === selectedCategory);
        return cat ? `${cat.icon || ''} ${cat.name}`.trim() : 'Productos';
    }, [selectedCategory, categories]);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Sticky Category Filter */}
            <CategoryFilter
                categories={categories}
            />

            <div className="max-w-7xl mx-auto p-4 md:p-6">
                {/* Main Grid (Everything categorized into one flat view) */}
                <section id="products-grid">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                            {gridTitle}
                        </h2>
                        <span className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border">
                            {filteredProducts.length} productos
                        </span>
                    </div>

                    {filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {filteredProducts.map((product: VariantItem) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl shadow-sm border border-dashed border-gray-200">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                <Package className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {searchQuery ? `No encontramos resultados para "${searchQuery}"` : 'No encontramos productos'}
                            </h3>
                            <p className="text-gray-500 max-w-xs mx-auto">
                                {searchQuery
                                    ? 'Intenta con otros términos o revisa la ortografía.'
                                    : 'No hay artículos disponibles en esta categoría por el momento.'}
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
