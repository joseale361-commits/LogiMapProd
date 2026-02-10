'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteProductAction } from '@/lib/actions/products';
import { useToast } from '@/hooks/use-toast';

interface DeleteProductButtonProps {
    productId: string;
    productName: string;
    path: string;
}

export function DeleteProductButton({ productId, productName, path }: DeleteProductButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const { toast } = useToast();

    const handleDelete = async () => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente el producto "${productName}" y todas sus variantes?`)) {
            return;
        }

        setIsDeleting(true);
        try {
            const result = await deleteProductAction(productId, path);
            if (result.success) {
                toast({
                    title: 'Producto eliminado',
                    description: 'El producto se ha eliminado correctamente.',
                });
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'No se pudo eliminar el producto.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Ocurrió un error inesperado al eliminar el producto.',
                variant: 'destructive',
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            disabled={isDeleting}
            onClick={handleDelete}
            title="Eliminar producto"
        >
            {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <Trash2 className="w-4 h-4" />
            )}
        </Button>
    );
}
