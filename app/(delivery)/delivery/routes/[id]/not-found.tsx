import Link from 'next/link';
import { MapPin, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RouteNotFound() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
                <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Ruta No Encontrada</h1>
                <p className="text-gray-600 mb-6">
                    La ruta que buscas no existe o ha sido eliminada. Por favor, verifica e intenta nuevamente.
                </p>
                <div className="flex gap-3 justify-center">
                    <Link href="/delivery/routes">
                        <Button variant="outline">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver a Rutas
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
