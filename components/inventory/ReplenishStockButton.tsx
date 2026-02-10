'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { replenishInventoryAction } from '@/lib/actions/inventory';
import { useToast } from '@/hooks/use-toast';

interface ReplenishStockButtonProps {
    distributorId: string;
    slug: string;
}

export function ReplenishStockButton({ distributorId, slug }: ReplenishStockButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleReplenish = async () => {
        setIsLoading(true);
        try {
            const result = await replenishInventoryAction(distributorId, slug);

            if (result.success) {
                toast({
                    title: "Stock actualizado",
                    description: `Se rellenaron ${result.count} productos correctamente.`,
                    variant: "default",
                });
            } else {
                toast({
                    title: "Error",
                    description: "No se pudo actualizar el stock: " + result.error,
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error inesperado",
                description: "Ocurrió un error al intentar actualizar el stock.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="outline"
            className="gap-2"
            onClick={handleReplenish}
            disabled={isLoading}
        >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Rellenando...' : 'Rellenar Stock Diario'}
        </Button>
    );
}
