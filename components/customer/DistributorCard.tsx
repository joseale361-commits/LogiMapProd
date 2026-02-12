"use client"

import { useState } from 'react';
import { Star, Store, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { toggleFavoriteDistributor } from '@/lib/actions/customer';
import { toast } from 'sonner';
import Image from 'next/image';

interface DistributorCardProps {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    isFavorite?: boolean;
}

export function DistributorCard({ id, name, slug, logo_url, isFavorite = false }: DistributorCardProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [favorite, setFavorite] = useState(isFavorite);

    const handleToggleFavorite = async () => {
        setIsLoading(true);

        try {
            const result = await toggleFavoriteDistributor(id);

            if (result.success) {
                setFavorite(result.isFavorite);
                toast.success(result.message || 'Actualizado correctamente');
            } else {
                toast.error(result.message || 'Error al actualizar favoritos');
                console.error('Toggle favorite error:', result.message);
            }
        } catch (error) {
            toast.error('Error inesperado');
            console.error('Unexpected error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoToStore = () => {
        router.push(`/shop/${slug}`);
    };

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                    {/* Logo */}
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                        {logo_url ? (
                            <Image
                                src={logo_url}
                                alt={name}
                                width={80}
                                height={80}
                                className="object-cover"
                            />
                        ) : (
                            <Store className="w-10 h-10 text-gray-400" />
                        )}
                    </div>

                    {/* Name */}
                    <h3 className="font-bold text-lg text-gray-900">{name}</h3>

                    {/* Actions */}
                    <div className="flex flex-col w-full gap-2">
                        <Button
                            onClick={handleGoToStore}
                            className="w-full"
                        >
                            <Store className="w-4 h-4 mr-2" />
                            Ir a Tienda
                        </Button>

                        <Button
                            variant={favorite ? "secondary" : "outline"}
                            onClick={handleToggleFavorite}
                            disabled={isLoading}
                            className="w-full"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Star className={`w-4 h-4 mr-2 ${favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                            )}
                            {favorite ? 'Quitar de Favoritos' : 'Agregar a Favoritos'}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
