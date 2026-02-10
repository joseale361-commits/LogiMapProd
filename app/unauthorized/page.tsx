import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Acceso No Autorizado
          </h1>
          
          <p className="text-gray-600 mb-6">
            No tienes permiso para acceder a esta distribuidora. 
            Por favor, verifica que estás intentando acceder a la distribuidora correcta 
            o contacta al administrador.
          </p>
          
          <div className="space-y-3">
            <Link href="/" className="block">
              <Button className="w-full">
                Ir al Inicio
              </Button>
            </Link>
            
            <Link href="/login" className="block">
              <Button variant="outline" className="w-full">
                Iniciar Sesión
              </Button>
            </Link>
          </div>
        </div>
        
        <p className="text-center text-sm text-gray-500 mt-6">
          Si crees que esto es un error, por favor contacta al soporte técnico.
        </p>
      </div>
    </div>
  );
}
