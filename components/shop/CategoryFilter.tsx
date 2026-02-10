'use client';

import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';

interface Category {
    id: string;
    name: string;
    icon?: string | null;
}

interface CategoryFilterProps {
    categories: Category[];
    className?: string;
}

export function CategoryFilter({ categories, className }: CategoryFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentCategory = searchParams.get('category');

    const handleSelect = (id: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (id) {
            params.set('category', id);
        } else {
            params.delete('category');
        }
        router.push(`?${params.toString()}`, { scroll: false });
    };

    return (
        <div className={cn("sticky top-[64px] z-40 bg-white/95 backdrop-blur-sm border-b p-3 shadow-sm", className)}>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 px-1 items-center">

                {/* TODAS */}
                <button
                    onClick={() => handleSelect(null)}
                    className={cn(
                        "h-9 px-4 rounded-full text-sm font-medium border flex items-center justify-center shrink-0 transition-colors",
                        !currentCategory
                            ? "bg-gray-900 text-white border-gray-900"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    )}
                >
                    Todo
                </button>

                {/* OFERTAS */}
                <button
                    onClick={() => handleSelect('ofertas')}
                    className={cn(
                        "h-9 px-4 rounded-full text-sm font-medium border flex items-center justify-center gap-1 shrink-0 transition-colors",
                        currentCategory === 'ofertas'
                            ? "bg-red-600 text-white border-red-600"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    )}
                >
                    🔥 Ofertas
                </button>

                {/* NUEVOS */}
                <button
                    onClick={() => handleSelect('nuevos')}
                    className={cn(
                        "h-9 px-4 rounded-full text-sm font-medium border flex items-center justify-center gap-1 shrink-0 transition-colors",
                        currentCategory === 'nuevos'
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    )}
                >
                    🆕 Nuevos
                </button>

                {/* DINÁMICAS (Filtradas) */}
                {categories
                    .filter(cat => !['ofertas', 'nuevos', 'oferta', 'nuevo'].includes(cat.name.toLowerCase()))
                    .map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => handleSelect(cat.id)}
                            className={cn(
                                "h-9 px-4 rounded-full text-sm font-medium border flex items-center justify-center gap-2 shrink-0 transition-colors",
                                currentCategory === cat.id
                                    ? "bg-gray-900 text-white border-gray-900"
                                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                            )}
                        >
                            {cat.icon ? <span>{cat.icon}</span> : null}
                            <span>{cat.name || "Sin Nombre"}</span>
                        </button>
                    ))}
            </div>
        </div>
    );
}