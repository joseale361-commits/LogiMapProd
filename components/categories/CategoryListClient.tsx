'use client';

import { useState } from 'react';
import { CategoryForm } from './CategoryForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash, Pencil } from 'lucide-react';
import { deleteCategory, generateDefaultCategories } from '@/lib/actions/categories';
import { Loader2, Sparkles } from 'lucide-react';

interface Category {
    id: string;
    name: string;
    icon: string | null;
    display_order: number | null;
    is_active: boolean | null;
    distributor_id: string;
}

interface CategoryListClientProps {
    categories: Category[];
    distributorId: string;
    slug: string;
}

export function CategoryListClient({ categories, distributorId, slug }: CategoryListClientProps) {
    const [isSeeding, setIsSeeding] = useState(false);

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar esta categoría?')) {
            await deleteCategory(id, slug);
        }
    };

    const handleSeedDefaults = async () => {
        setIsSeeding(true);
        const result = await generateDefaultCategories(distributorId, slug);
        setIsSeeding(false);
        if (!result.success) {
            alert(result.error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Categorías</h1>
                    <p className="text-muted-foreground">Gestiona las categorías de tu catálogo.</p>
                </div>
                <div className="flex items-center gap-2">
                    {categories.length === 0 && (
                        <Button
                            variant="outline"
                            onClick={handleSeedDefaults}
                            disabled={isSeeding}
                            className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 decoration-amber-500"
                        >
                            {isSeeding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                            Categorías Base
                        </Button>
                    )}
                    <CategoryForm distributorId={distributorId} slug={slug} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                    <Card key={category.id} className="relative group hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-lg font-medium">
                                <span className="mr-2 text-2xl">{category.icon || '📦'}</span>
                                {category.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
                                <span>Orden: {category.display_order}</span>
                                <div className="flex gap-2">
                                    <CategoryForm
                                        distributorId={distributorId}
                                        slug={slug}
                                        category={category}
                                        trigger={
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-700">
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                        }
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-500 hover:text-red-700"
                                        onClick={() => handleDelete(category.id)}
                                    >
                                        <Trash className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {categories.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500 border-2 border-dashed rounded-lg">
                        <p>No tienes categorías creadas.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
