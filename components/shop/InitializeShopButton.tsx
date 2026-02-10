'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { seedShopDistributorAction } from '@/lib/actions/seed-shop';

export function InitializeShopButton() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInitialize = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await seedShopDistributorAction();

            if (result.success) {
                setSuccess(true);
                // Redirect after small delay
                setTimeout(() => {
                    window.location.href = '/shop/mi-tienda';
                }, 1500);
            } else {
                setError(result.error || 'Error al crear la tienda');
            }
        } catch (err) {
            setError('Error de conexión');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <Button variant="outline" className="gap-2 border-green-500 text-green-600 bg-green-50">
                <CheckCircle className="w-4 h-4" />
                ¡Tienda Creada! Redirigiendo...
            </Button>
        );
    }

    return (
        <div className="flex flex-col items-center gap-2">
            <Button
                onClick={handleInitialize}
                disabled={isLoading}
                variant="outline"
                className="gap-2 border-blue-200 hover:bg-blue-50 text-blue-700"
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Store className="w-4 h-4" />
                )}
                Crear Tienda Demo "Mi Tienda"
            </Button>
            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    );
}
