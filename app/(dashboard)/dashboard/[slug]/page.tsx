import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, Route as RouteIcon, AlertTriangle } from 'lucide-react';
import { getDistributorBySlug } from '@/lib/supabase/server';
import { getProductsByDistributorId } from '@/lib/queries/products';
import Link from 'next/link';

interface PageProps {
  params: {
    slug: string;
  };
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
  const { slug } = params;

  // Guard clause: Get distributor
  const distributor = await getDistributorBySlug(slug);
  if (!distributor) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Distribuidora no encontrada</p>
      </div>
    );
  }

  // Fetch products to calculate inventory metrics
  const products = await getProductsByDistributorId(distributor.id);

  // Calculate low stock count: products with total_stock < 10 and is_active
  const LOW_STOCK_THRESHOLD = 10;
  const lowStockCount = products.filter(
    (p) => p.is_active && (p.total_stock || 0) < LOW_STOCK_THRESHOLD
  ).length;

  // Determine alert severity based on low stock count
  const hasCriticalStock = lowStockCount > 0;
  const alertColor = lowStockCount > 0 ? 'text-orange-600' : 'text-gray-400';

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Bienvenido a {distributor.name}
        </h1>
        <p className="text-gray-600 mt-1 md:mt-2">
          Resumen general de tu distribuidora
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
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

        {/* Inventario Crítico Card - Clickable Link to Low Stock Filter */}
        <Link href={`/dashboard/${slug}/inventory?filter=low_stock`}>
          <Card className={`cursor-pointer hover:shadow-xl transition-all duration-200 hover:-translate-y-1 ${hasCriticalStock ? 'border-orange-300 bg-orange-50' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Inventario Crítico
              </CardTitle>
              <AlertTriangle className={`h-5 w-5 ${alertColor}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${hasCriticalStock ? 'text-orange-600' : 'text-gray-900'}`}>
                {lowStockCount}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {lowStockCount > 0
                  ? `${lowStockCount} producto${lowStockCount > 1 ? 's' : ''} con stock bajo (< ${LOW_STOCK_THRESHOLD})`
                  : 'Sin productos con stock bajo'}
              </p>
              {lowStockCount > 0 && (
                <p className="text-xs text-orange-600 mt-2 font-medium">
                  → Click para ver productos
                </p>
              )}
            </CardContent>
          </Card>
        </Link>
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
