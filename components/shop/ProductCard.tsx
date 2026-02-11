import { Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/lib/contexts/CartContext';
import { VariantItem } from '@/lib/queries/shop';

interface ProductCardProps {
    product: VariantItem;
}

export function ProductCard({ product }: ProductCardProps) {
    const { addItem } = useCart();

    // 1. CORRECCIÓN DE STOCK: Usar 'stock' (no stockValue)
    const stock = product.stock ?? 0; // Si es null, asume 0
    const isOutOfStock = stock <= 0;

    // 2. CORRECCIÓN DE PRECIOS: El backend ya envía el precio correcto
    const currentPrice = product.price; // Este ya es el precio de oferta si aplica
    const oldPrice = product.originalPrice; // Este es el precio tachado (si existe)
    const isDiscounted = product.isOnSale && oldPrice !== null;

    // Unidades por caja
    const packUnits = product.packUnits || 1;

    // Cálculo Precio por Unidad
    const pricePerUnit = currentPrice / packUnits;

    // Cálculo Porcentaje Ahorro
    const discountPercentage = isDiscounted && oldPrice
        ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100)
        : 0;

    // Formateador de Moneda
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    const handleAddToCart = () => {
        addItem({
            // Como es estructura plana, el ID de la variante es el ID principal
            productId: product.id,
            variantId: product.id,
            productName: product.name,
            variantName: '',
            price: currentPrice,
            packUnits: packUnits,
            imageUrl: product.image || '/placeholder.png',
        });
    };

    return (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 h-full flex flex-col justify-between border-gray-100">
            {/* Imagen del Producto */}
            <div className="relative w-full aspect-square bg-white rounded-t-lg overflow-hidden group">
                <img
                    src={product.image || '/placeholder.png'}
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                />

                {/* Badges (Etiquetas) */}
                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                    {isDiscounted && (
                        <Badge className="bg-red-600 hover:bg-red-700 shadow-sm animate-pulse">
                            -{discountPercentage}%
                        </Badge>
                    )}
                    {product.isNew && !isDiscounted && (
                        <Badge className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                            NUEVO
                        </Badge>
                    )}
                </div>
            </div>

            <CardContent className="p-4 space-y-3 flex-grow">
                {/* Nombre */}
                <div>
                    <h3 className="font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem] leading-tight text-sm md:text-base">
                        {product.name}
                    </h3>
                </div>

                {/* Precios */}
                <div className="space-y-1">
                    <div className="flex flex-col">
                        {isDiscounted && oldPrice && (
                            <span className="text-xs text-gray-400 line-through decoration-gray-400">
                                {formatPrice(oldPrice)}
                            </span>
                        )}
                        <span className={`text-xl md:text-2xl font-bold ${isDiscounted ? 'text-red-600' : 'text-gray-900'}`}>
                            {formatPrice(currentPrice)}
                        </span>
                    </div>

                    {/* Precio por Unidad (Clave B2B) */}
                    <p className="text-xs md:text-sm text-blue-600 font-medium">
                        {formatPrice(pricePerUnit)} / unidad
                    </p>
                    <p className="text-[10px] md:text-xs text-gray-400">
                        Presentación: {packUnits} {packUnits === 1 ? 'unidad' : 'unidades'}
                    </p>
                </div>

                {/* Indicador de Stock */}
                <div className="flex items-center gap-2 pt-2">
                    <div className={`w-2 h-2 rounded-full ${stock > 10
                        ? 'bg-green-500'
                        : stock > 0
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`} />
                    <span className={`text-xs ${isOutOfStock ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                        {stock > 0
                            ? `${stock} disponibles`
                            : 'Agotado'}
                    </span>
                </div>
            </CardContent>

            <CardFooter className="p-4 pt-0">
                <Button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className={`w-full font-semibold ${isDiscounted ? 'bg-red-600 hover:bg-red-700' : ''}`}
                    size="default"
                >
                    {isOutOfStock ? (
                        'Sin Stock'
                    ) : (
                        <>
                            <Plus className="w-4 h-4 mr-2" />
                            Agregar
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}