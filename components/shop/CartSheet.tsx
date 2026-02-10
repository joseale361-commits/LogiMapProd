"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useCart, CartItem } from '@/lib/contexts/CartContext';
import Image from 'next/image';

interface CartSheetProps {
    distributorSlug: string;
}

export function CartSheet({ distributorSlug }: CartSheetProps) {
    const { items, updateQuantity, removeItem, clearCart } = useCart();
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    // Format price as Colombian Peso
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    const handleCheckout = () => {
        setIsOpen(false);
        router.push(`/shop/${distributorSlug}/checkout`);
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative w-11 h-11">
                    <ShoppingBag className="w-6 h-6 text-gray-700" />
                    {totalItems > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {totalItems}
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md flex flex-col">
                <SheetHeader>
                    <SheetTitle>Tu Carrito ({totalItems} {totalItems === 1 ? 'item' : 'items'})</SheetTitle>
                </SheetHeader>

                {items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                        <ShoppingBag className="w-16 h-16 mb-4 text-gray-300" />
                        <p className="text-lg font-medium">Tu carrito está vacío</p>
                        <p className="text-sm">Agrega productos para comenzar</p>
                    </div>
                ) : (
                    <>
                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto py-4 space-y-4">
                            {items.map((item) => (
                                <CartItemCard
                                    key={item.variantId}
                                    item={item}
                                    onUpdateQuantity={updateQuantity}
                                    onRemove={removeItem}
                                    formatPrice={formatPrice}
                                />
                            ))}
                        </div>

                        {/* Cart Summary */}
                        <div className="border-t pt-4 space-y-4">
                            <div className="flex justify-between items-center text-lg font-semibold">
                                <span>Total Estimado:</span>
                                <span className="text-blue-600">{formatPrice(subtotal)}</span>
                            </div>
                            <Button
                                onClick={handleCheckout}
                                className="w-full"
                                size="lg"
                            >
                                Confirmar Pedido
                            </Button>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}

interface CartItemCardProps {
    item: CartItem;
    onUpdateQuantity: (variantId: string, quantity: number) => void;
    onRemove: (variantId: string) => void;
    formatPrice: (price: number) => string;
}

function CartItemCard({ item, onUpdateQuantity, onRemove, formatPrice }: CartItemCardProps) {
    const subtotal = item.price * item.quantity;

    return (
        <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
            {/* Product Image */}
            <div className="relative w-20 h-20 flex-shrink-0 bg-gray-200 rounded-md overflow-hidden">
                {item.imageUrl ? (
                    <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        className="object-cover"
                        sizes="80px"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8 text-gray-400" />
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                    {item.productName}
                </h4>
                <p className="text-xs text-gray-500 mt-1">{item.variantName}</p>
                <p className="text-sm font-semibold text-blue-600 mt-1">
                    {formatPrice(item.price)}
                </p>

                {/* Quantity Controls */}
                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onUpdateQuantity(item.variantId, item.quantity - 1)}
                        >
                            <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onUpdateQuantity(item.variantId, item.quantity + 1)}
                        >
                            <Plus className="w-3 h-3" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{formatPrice(subtotal)}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => onRemove(item.variantId)}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
