"use client"

import { useState, useMemo } from 'react';
import { Search, Store, Star, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DistributorCard } from './DistributorCard';
import { DistributorCardData } from '@/lib/queries/customer';

interface DistributorListProps {
    favorites: DistributorCardData[];
    allDistributors: DistributorCardData[];
}

export function DistributorList({ favorites, allDistributors }: DistributorListProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredFavorites = useMemo(() => {
        if (!searchQuery) return favorites;
        return favorites.filter(d =>
            d.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [favorites, searchQuery]);

    const filteredOthers = useMemo(() => {
        // Filter out favorites from the "all" list to match the logic in the original page
        const favoriteIds = new Set(favorites.map(f => f.id));
        const others = allDistributors.filter(d => !favoriteIds.has(d.id));

        if (!searchQuery) return others;
        return others.filter(d =>
            d.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [allDistributors, favorites, searchQuery]);

    const hasResults = filteredFavorites.length > 0 || filteredOthers.length > 0;

    return (
        <div className="space-y-12">
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                    type="text"
                    placeholder="Buscar distribuidores por nombre..."
                    className="pl-10 pr-10 py-6 text-lg rounded-2xl shadow-sm border-gray-200 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                )}
            </div>

            {/* Favorite Distributors */}
            {(searchQuery === '' || filteredFavorites.length > 0) && (
                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                        {searchQuery ? `Favoritos (${filteredFavorites.length})` : 'Mis Distribuidores Favoritos'}
                    </h2>
                    {filteredFavorites.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredFavorites.map((distributor) => (
                                <DistributorCard key={distributor.id} {...distributor} />
                            ))}
                        </div>
                    ) : !searchQuery && (
                        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                            <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 font-medium">No tienes distribuidores favoritos aún</p>
                            <p className="text-sm text-gray-400 mt-1">Explora los proveedores disponibles abajo y presiona la estrella</p>
                        </div>
                    )}
                </section>
            )}

            {/* All Distributors / Others */}
            {(searchQuery === '' || filteredOthers.length > 0) && (
                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Store className="w-6 h-6 text-blue-600" />
                        {searchQuery ? `Otros Proveedores (${filteredOthers.length})` : 'Explorar Proveedores'}
                    </h2>
                    {filteredOthers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredOthers.map((distributor) => (
                                <DistributorCard key={distributor.id} {...distributor} />
                            ))}
                        </div>
                    ) : !searchQuery && (
                        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                            <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No hay más proveedores disponibles</p>
                        </div>
                    )}
                </section>
            )}

            {/* No Results State */}
            {!hasResults && searchQuery && (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Search className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No encontramos coincidencias</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                        No hay distribuidores que coincidan con "<span className="font-semibold text-gray-900">{searchQuery}</span>".
                        Intenta con otro nombre.
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => setSearchQuery('')}
                        className="mt-6"
                    >
                        Limpiar búsqueda
                    </Button>
                </div>
            )}
        </div>
    );
}
