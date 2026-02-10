import { notFound } from 'next/navigation';
import { Plus, Pencil, Trash2, Package, FileSpreadsheet } from 'lucide-react';
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
    params: Promise<{
        slug: string;
    }>;
}

/**
 * Products management page for a distributor.
 */
export default async function ProductsPage({ params }: PageProps) {
    const { slug } = await params;

    // Get distributor by slug
    const distributor = await getDistributorBySlug(slug);
    if (!distributor) {
        notFound();
    }

    // Fetch products with aggregated variant data
    const products = await getProductsByDistributorId(distributor.id);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
                    <p className="text-gray-600 mt-2">
                        Gestiona el catálogo de productos de tu distribuidora
                    </p>
                </div>
                <div className="flex gap-2">
                    <ReplenishStockButton distributorId={distributor.id} slug={slug} />
                    <Link href={`/dashboard/${slug}/inventory/import`}>
                        <Button variant="outline" className="gap-2">
                            <FileSpreadsheet className="w-4 h-4" />
                            Importar Excel
                        </Button>
                    </Link>
                    <Link href={`/dashboard/${slug}/products/new`}>
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            Crear Producto
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Products Table or Empty State */}
            {products.length === 0 ? (
                <EmptyState />
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Lista de Productos</CardTitle>
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
                                            {(product.total_stock || 0).toLocaleString()}
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
                                                    path={`/dashboard/${slug}/products`}
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
 * Empty state component when no products exist.
 */
function EmptyState() {
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
                    Comienza a construir tu catálogo agregando tu primer producto.
                </p>
                <Link href="products/new">
                    <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Crear Primer Producto
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}
