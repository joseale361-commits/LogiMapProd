'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { seedCategoriesAction } from '@/lib/actions/seed-categories';

interface SeedCategoriesButtonProps {
    distributorId: string;
}

export function SeedCategoriesButton({ distributorId }: SeedCategoriesButtonProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSeed = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await seedCategoriesAction(distributorId);

            if (result.success) {
                router.refresh();
            } else {
                if (!result.skipped) {
                    setError(result.error || 'Error al crear categorías');
                }
            }
        } catch (err) {
            console.error('Error seeding categories:', err);
            setError('Error inesperado');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <Button
                onClick={handleSeed}
                disabled={isLoading}
                variant="default"
                className="gap-2"
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Sparkles className="w-4 h-4" />
                )}
                {isLoading ? 'Creando...' : 'Crear Categorías de Prueba'}
            </Button>
            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    );
}
