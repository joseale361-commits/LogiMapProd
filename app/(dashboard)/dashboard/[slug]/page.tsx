import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, Route as RouteIcon, AlertTriangle } from 'lucide-react';
import { getDistributorBySlug } from '@/lib/supabase/server';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * Dashboard page showing distributor overview.
 * 
 * Applies clean-code principles:
 * - Guard clause for error handling
 * - Flat structure
 * - Reusable utility functions
 */
export default async function DashboardPage({ params }: PageProps) {
  const { slug } = await params;

  // Guard clause: Get distributor
  const distributor = await getDistributorBySlug(slug);
  if (!distributor) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Distribuidora no encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenido a {distributor.name}
        </h1>
        <p className="text-gray-600 mt-2">
          Resumen general de tu distribuidora
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pedidos Hoy Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pedidos Hoy
            </CardTitle>
            <ShoppingBag className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">0</div>
            <p className="text-xs text-gray-500 mt-1">
              Sin pedidos registrados hoy
            </p>
          </CardContent>
        </Card>

        {/* Rutas Activas Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Rutas Activas
            </CardTitle>
            <RouteIcon className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">0</div>
            <p className="text-xs text-gray-500 mt-1">
              Sin rutas activas actualmente
            </p>
          </CardContent>
        </Card>

        {/* Inventario Crítico Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Inventario Crítico
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">0</div>
            <p className="text-xs text-gray-500 mt-1">
              Sin productos con stock bajo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder for additional content */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            No hay actividad reciente para mostrar
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
