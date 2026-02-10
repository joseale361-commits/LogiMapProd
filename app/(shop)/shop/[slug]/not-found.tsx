import { Package, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { InitializeShopButton } from '@/components/shop/InitializeShopButton';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            {/* Icon */}
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <Package className="w-12 h-12 text-gray-400" />
            </div>

            {/* Error Message */}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Tienda no encontrada
            </h1>
            <p className="text-gray-600 max-w-md mb-8">
                Lo sentimos, no pudimos encontrar la tienda que buscas.
                Verifica que la URL sea correcta o intenta con otra tienda.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild variant="default">
                    <Link href="/">
                        <Home className="w-4 h-4 mr-2" />
                        Ir al Inicio
                    </Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href="javascript:history.back()">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver
                    </Link>
                </Button>
            </div>

            {/* Additional Help */}
            <div className="mt-12 p-6 bg-gray-50 rounded-lg max-w-md">
                <h2 className="font-semibold text-gray-900 mb-2">
                    ¿Necesitas ayuda?
                </h2>
                <p className="text-sm text-gray-600">
                    Si crees que esto es un error, por favor contacta al soporte
                    técnico o verifica con el distribuidor el enlace correcto.
                </p>
            </div>

            {/* Demo Helper */}
            <div className="mt-8 pt-8 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-3">¿Eres desarrollador? Configura el entorno de prueba:</p>
                <InitializeShopButton />
            </div>
        </div>
    );
}
