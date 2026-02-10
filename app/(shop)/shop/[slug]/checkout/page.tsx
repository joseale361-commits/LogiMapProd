"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, CreditCard, Truck, ShoppingBag, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useCart, CartItem } from '@/lib/contexts/CartContext';
import { createOrderAction } from './actions';
import { Database } from '@/types/supabase';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { saveAddressAction } from '@/lib/actions/address';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import type { AddressFormData } from '@/components/shop/AddressModal';
import { getStateName, getCountryName } from '@/lib/utils/location';

// Dynamically import AddressModal to avoid SSR issues with Leaflet
const AddressModal = dynamic(
    () => import('@/components/shop/AddressModal').then((mod) => mod.AddressModal),
    { ssr: false }
);

type Address = Database['public']['Tables']['addresses']['Row'];

interface CheckoutPageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
    const router = useRouter();
    const { items, clearCart } = useCart();
    const [slug, setSlug] = useState<string>('');
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

    useEffect(() => {
        params.then(({ slug }) => {
            setSlug(slug);
            loadAddresses();
        });
    }, [params]);

    const loadAddresses = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.push('/login');
            return;
        }

        const { data, error } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true);

        if (error) {
            console.error('Error loading addresses:', error);
        } else {
            const typedData = (data as any[]) || [];
            setAddresses(typedData);
            if (typedData.length > 0) {
                const defaultAddress = typedData.find(a => a.is_default) || typedData[0];
                setSelectedAddressId(defaultAddress.id);
            }
        }
    };

    const handleCreateAddress = async (addressData: AddressFormData) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const result = await saveAddressAction(addressData);

            if (result.success) {
                toast.success('Dirección creada exitosamente');
                setIsAddressModalOpen(false);
                await loadAddresses(); // Reload addresses to refresh the list and select the new one
            } else {
                setError(result.error || 'Error al crear la dirección');
            }
        } catch (err) {
            console.error('Unexpected error creating address:', err);
            setError(`Error al crear la dirección: ${err instanceof Error ? err.message : 'Error desconocido'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!selectedAddressId) {
            setError('Por favor selecciona una dirección de entrega');
            return;
        }

        if (items.length === 0) {
            setError('El carrito está vacío');
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await createOrderAction({
                items,
                addressId: selectedAddressId,
                paymentMethod,
                distributorSlug: slug,
            });

            if (result.error) {
                setError(result.error);
            } else {
                clearCart();
                router.push(`/shop/${slug}/order-confirmation/${result.orderId}`);
            }
        } catch (err) {
            console.error('Error submitting order:', {
                message: err instanceof Error ? err.message : 'Unknown error',
                stack: err instanceof Error ? err.stack : undefined,
                fullError: JSON.stringify(err, null, 2)
            });
            setError('Error al procesar el pedido');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Format price as Colombian Peso
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="max-w-md w-full">
                    <CardContent className="pt-6 text-center">
                        <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Carrito vacío</h2>
                        <p className="text-gray-500 mb-4">No tienes productos en tu carrito</p>
                        <Button onClick={() => router.push(`/shop/${slug}`)}>
                            Volver a la tienda
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => router.push(`/shop/${slug}`)}
                        className="mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver a la tienda
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900">Finalizar Pedido</h1>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Left Column - Forms */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Address Selection */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPin className="w-5 h-5" />
                                        Dirección de Entrega
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {addresses.length > 0 ? (
                                        <RadioGroup value={selectedAddressId} onValueChange={setSelectedAddressId}>
                                            <div className="space-y-3">
                                                {addresses.map((address) => (
                                                    <div
                                                        key={address.id}
                                                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedAddressId === address.id
                                                            ? 'border-blue-500 bg-blue-50'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                            }`}
                                                        onClick={() => setSelectedAddressId(address.id)}
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <p className="font-medium text-gray-900">
                                                                    {address.label}
                                                                </p>
                                                                <p className="text-sm text-gray-600 mt-1">
                                                                    {address.street_address}
                                                                </p>
                                                                <p className="text-sm text-gray-600">
                                                                    {address.city}, {getStateName(address.state || '')}
                                                                </p>
                                                                {address.additional_info && (
                                                                    <p className="text-sm text-gray-500 mt-1">
                                                                        {address.additional_info}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <RadioGroupItem
                                                                value={address.id}
                                                                id={address.id}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </RadioGroup>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                            <p>No tienes direcciones guardadas</p>
                                        </div>
                                    )}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => setIsAddressModalOpen(true)}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Agregar Nueva Dirección
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Payment Method */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="w-5 h-5" />
                                        Método de Pago
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <RadioGroup
                                        value={paymentMethod}
                                        onValueChange={(value) => setPaymentMethod(value as 'cash' | 'transfer')}
                                    >
                                        <div className="flex items-center space-x-2 p-4 border rounded-lg">
                                            <RadioGroupItem value="cash" id="cash" />
                                            <Label htmlFor="cash" className="flex-1 cursor-pointer">
                                                <div className="font-medium">Efectivo contra entrega</div>
                                                <div className="text-sm text-gray-500">Paga al recibir tu pedido</div>
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2 p-4 border rounded-lg">
                                            <RadioGroupItem value="transfer" id="transfer" />
                                            <Label htmlFor="transfer" className="flex-1 cursor-pointer">
                                                <div className="font-medium">Transferencia Bancaria</div>
                                                <div className="text-sm text-gray-500">Realiza el pago antes del envío</div>
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column - Order Summary */}
                        <div className="lg:col-span-1">
                            <Card className="sticky top-4">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Truck className="w-5 h-5" />
                                        Resumen del Pedido
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Order Items */}
                                    <div className="space-y-3 max-h-64 overflow-y-auto">
                                        {items.map((item) => (
                                            <div key={item.variantId} className="flex gap-3">
                                                <div className="relative w-16 h-16 flex-shrink-0 bg-gray-200 rounded-md overflow-hidden">
                                                    {item.imageUrl ? (
                                                        <Image
                                                            src={item.imageUrl}
                                                            alt={item.productName}
                                                            fill
                                                            className="object-cover"
                                                            sizes="64px"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <ShoppingBag className="w-6 h-6 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 line-clamp-1">
                                                        {item.productName}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{item.variantName}</p>
                                                    <div className="flex justify-between items-center mt-1">
                                                        <span className="text-sm text-gray-600">x{item.quantity}</span>
                                                        <span className="text-sm font-semibold">
                                                            {formatPrice(item.price * item.quantity)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Totals */}
                                    <div className="border-t pt-4 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Subtotal</span>
                                            <span className="font-medium">{formatPrice(subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Envío</span>
                                            <span className="font-medium text-green-600">Gratis</span>
                                        </div>
                                        <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                            <span>Total</span>
                                            <span className="text-blue-600">{formatPrice(subtotal)}</span>
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        size="lg"
                                        disabled={isSubmitting || !selectedAddressId}
                                    >
                                        {isSubmitting ? 'Procesando...' : 'Enviar Pedido'}
                                    </Button>

                                    {error && (
                                        <div className="text-sm text-red-600 text-center">
                                            {error}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>

                {/* Address Modal */}
                <AddressModal
                    isOpen={isAddressModalOpen}
                    onClose={() => setIsAddressModalOpen(false)}
                    onSave={handleCreateAddress}
                />
            </div>
        </div>
    );
}
