'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RouteError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Route error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Error en la Ruta</h2>
                <p className="text-gray-600 mb-4">
                    {error.message || 'Ocurrió un error al cargar la ruta'}
                </p>
                {error.digest && (
                    <p className="text-xs text-gray-400 mb-4">ID: {error.digest}</p>
                )}
                <div className="flex gap-3 justify-center">
                    <Button
                        variant="outline"
                        onClick={() => window.location.href = '/delivery/routes'}
                    >
                        Volver a Rutas
                    </Button>
                    <Button
                        onClick={reset}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reintentar
                    </Button>
                </div>
            </div>
        </div>
    );
}
