import { notFound } from 'next/navigation';
import { Plus, Pencil, Trash2, Package, FileSpreadsheet, Filter } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDistributorBySlug } from '@/lib/supabase/server';
import { getProductsByDistributorId } from '@/lib/queries/products';
import { ReplenishStockButton } from '@/components/inventory/ReplenishStockButton';
import { DeleteProductButton } from '@/components/products/DeleteProductButton';

interface PageProps {
    params: {
        slug: string;
    };
    searchParams: {
        filter?: string;
    };
}

/**
 * Inventory page for a distributor with filtering capabilities.
 * Supports 'low_stock' filter to show only products with stock < 10.
 */
export default async function InventoryPage({ params, searchParams }: PageProps) {
    const { slug } = params;
    const { filter } = searchParams;

    // Get distributor by slug
    const distributor = await getDistributorBySlug(slug);
    if (!distributor) {
        notFound();
    }

    // Fetch products with aggregated variant data
    const allProducts = await getProductsByDistributorId(distributor.id);

    // Apply filter based on searchParams
    const LOW_STOCK_THRESHOLD = 10;
    const showLowStockOnly = filter === 'low_stock';

    const products = showLowStockOnly
        ? allProducts.filter((p) => p.is_active && (p.total_stock || 0) < LOW_STOCK_THRESHOLD)
        : allProducts;

    // Calculate low stock count for the indicator
    const lowStockCount = allProducts.filter(
        (p) => p.is_active && (p.total_stock || 0) < LOW_STOCK_THRESHOLD
    ).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
                    <p className="text-gray-600 mt-2">
                        {showLowStockOnly
                            ? `Mostrando ${products.length} producto${products.length !== 1 ? 's' : ''} con stock bajo`
                            : 'Gestiona el inventario de tu distribuidora'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href={`/dashboard/${slug}/products`}>
                        <Button variant="outline" className="gap-2">
                            <Package className="w-4 h-4" />
                            Ver Productos
                        </Button>
                    </Link>
                    <Link href={`/dashboard/${slug}/inventory/import`}>
                        <Button variant="outline" className="gap-2">
                            <FileSpreadsheet className="w-4 h-4" />
                            Importar Excel
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                <Link href={`/dashboard/${slug}/inventory`}>
                    <Button
                        variant={!showLowStockOnly ? 'default' : 'outline'}
                        className="gap-2"
                    >
                        <Package className="w-4 h-4" />
                        Todos los productos ({allProducts.length})
                    </Button>
                </Link>
                <Link href={`/dashboard/${slug}/inventory?filter=low_stock`}>
                    <Button
                        variant={showLowStockOnly ? 'default' : 'outline'}
                        className={`gap-2 ${showLowStockOnly ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                    >
                        <Filter className="w-4 h-4" />
                        Stock bajo ({lowStockCount})
                    </Button>
                </Link>
            </div>

            {/* Products Table or Empty State */}
            {products.length === 0 ? (
                <EmptyState showLowStock={showLowStockOnly} slug={slug} />
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {showLowStockOnly ? 'Productos con Stock Bajo' : 'Lista de Productos'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Imagen</TableHead>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead className="text-center">Variantes</TableHead>
                                    <TableHead className="text-right">Stock Total</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map((product) => (
                                    <TableRow key={product.id}>
                                        {/* Image */}
                                        <TableCell>
                                            <Avatar className="w-12 h-12 rounded-md">
                                                <AvatarImage
                                                    src={product.image_url || undefined}
                                                    alt={product.name}
                                                />
                                                <AvatarFallback className="rounded-md bg-gray-100">
                                                    <Package className="w-6 h-6 text-gray-400" />
                                                </AvatarFallback>
                                            </Avatar>
                                        </TableCell>

                                        {/* Name */}
                                        <TableCell className="font-medium">
                                            {product.name}
                                            {product.brand && (
                                                <span className="block text-sm text-gray-500">
                                                    {product.brand}
                                                </span>
                                            )}
                                        </TableCell>

                                        {/* SKU */}
                                        <TableCell className="font-mono text-sm">
                                            {product.sku}
                                        </TableCell>

                                        {/* Variant Count */}
                                        <TableCell className="text-center">
                                            <Badge variant="secondary">
                                                {product.variant_count || 0}
                                            </Badge>
                                        </TableCell>

                                        {/* Total Stock */}
                                        <TableCell className="text-right font-medium">
                                            <span className={(product.total_stock || 0) < 10 ? 'text-orange-600 font-bold' : ''}>
                                                {(product.total_stock || 0).toLocaleString()}
                                                {(product.total_stock || 0) < 10 && (
                                                    <span className="ml-1 text-xs">⚠️</span>
                                                )}
                                            </span>
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell>
                                            <Badge
                                                variant={product.is_active ? 'default' : 'secondary'}
                                                className={
                                                    product.is_active
                                                        ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                                        : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                                                }
                                            >
                                                {product.is_active ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/dashboard/${slug}/products/${product.id}/edit`}>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                                <DeleteProductButton
                                                    productId={product.id}
                                                    productName={product.name}
                                                    path={`/dashboard/${slug}/inventory${showLowStockOnly ? '?filter=low_stock' : ''}`}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

/**
 * Empty state component when no products exist or filter returns no results.
 */
function EmptyState({ showLowStock, slug }: { showLowStock: boolean; slug: string }) {
    if (showLowStock) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="rounded-full bg-green-100 p-6 mb-4">
                        <Package className="w-12 h-12 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        ¡Excelente! Sin productos con stock bajo
                    </h3>
                    <p className="gray-600 text-center mb-6 max-w-sm">
                        Todos tus productos tienen niveles de inventario saludables.
                    </p>
                    <Link href={`/dashboard/${slug}/inventory`}>
                        <Button variant="outline" className="gap-2">
                            Ver todos los productos
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="rounded-full bg-gray-100 p-6 mb-4">
                    <Package className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No tienes productos aún
                </h3>
                <p className="text-gray-600 text-center mb-6 max-w-sm">
                    Comienza a construir tu inventario agregando tu primer producto.
                </p>
                <Link href={`/dashboard/${slug}/products/new`}>
                    <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Crear Primer Producto
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}
