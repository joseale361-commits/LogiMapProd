"use client"

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CheckCircle, Package, ArrowLeft, Home, MapPin, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/supabase';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];

interface OrderConfirmationPageProps { }

export default function OrderConfirmationPage() {
    const router = useRouter();
    const params = useParams();
    const slug = params?.slug as string;
    const id = params?.id as string;
    const [orderId, setOrderId] = useState<string>('');
    const [order, setOrder] = useState<Order | null>(null);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            setOrderId(id);
            loadOrderDetails(id);
        }
    }, [id]);

    const loadOrderDetails = async (id: string) => {
        const supabase = createClient();

        try {
            // Load order
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select('*')
                .eq('id', id)
                .single();

            if (orderError) throw orderError;
            setOrder(orderData);

            // Load order items
            const { data: itemsData, error: itemsError } = await supabase
                .from('order_items')
                .select('*')
                .eq('order_id', id);

            if (itemsError) throw itemsError;
            setOrderItems(itemsData || []);
        } catch (err) {
            console.error('Error loading order:', err);
            setError('No se pudo cargar la información del pedido');
        } finally {
            setLoading(false);
        }
    };

    const handleContinueShopping = () => {
        router.push(`/shop/${slug}`);
    };

    const handleGoHome = () => {
        router.push('/shop');
    };

    // Format price as Colombian Peso
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    // Get payment method label
    const getPaymentMethodLabel = (method: string | null) => {
        switch (method) {
            case 'cash':
                return 'Efectivo contra entrega';
            case 'transfer':
                return 'Transferencia Bancaria';
            default:
                return method || 'No especificado';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando información del pedido...</p>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="max-w-md w-full">
                    <CardContent className="pt-6 text-center">
                        <p className="text-red-600 mb-4">{error || 'Pedido no encontrado'}</p>
                        <Button onClick={() => router.push(`/shop/${slug}`)}>
                            Volver a la tienda
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const addressSnapshot = order.delivery_address_snapshot as any;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Success Header */}
                <Card className="mb-6">
                    <CardContent className="pt-8 pb-6 text-center">
                        <div className="mb-4">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="w-12 h-12 text-green-600" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            ¡Pedido Exitoso!
                        </h1>
                        <p className="text-gray-600">
                            Tu pedido ha sido enviado y está pendiente de aprobación por el distribuidor.
                        </p>
                    </CardContent>
                </Card>

                {/* Order Details */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {/* Order Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Información del Pedido</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-500">Número de Pedido</p>
                                <p className="font-semibold text-gray-900">{order.order_number}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Fecha</p>
                                <p className="font-semibold text-gray-900">
                                    {new Date(order.created_at || '').toLocaleDateString('es-CO', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Estado</p>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Pendiente de Aprobación
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Delivery Address */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MapPin className="w-5 h-5" />
                                Dirección de Entrega
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {addressSnapshot && (
                                <>
                                    <p className="font-medium text-gray-900">{addressSnapshot.label}</p>
                                    <p className="text-sm text-gray-600">{addressSnapshot.street_address}</p>
                                    <p className="text-sm text-gray-600">
                                        {addressSnapshot.city}, {addressSnapshot.state}
                                    </p>
                                    {addressSnapshot.additional_info && (
                                        <p className="text-sm text-gray-500">{addressSnapshot.additional_info}</p>
                                    )}
                                    {addressSnapshot.delivery_instructions && (
                                        <p className="text-sm text-gray-500 mt-2">
                                            <span className="font-medium">Instrucciones:</span> {addressSnapshot.delivery_instructions}
                                        </p>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Payment Method */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <CreditCard className="w-5 h-5" />
                            Método de Pago
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="font-medium text-gray-900">{getPaymentMethodLabel(order.payment_method)}</p>
                    </CardContent>
                </Card>

                {/* Order Items */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Package className="w-5 h-5" />
                            Productos del Pedido
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {orderItems.map((item) => {
                                const productSnapshot = item.product_snapshot as any;
                                return (
                                    <div key={item.id} className="flex justify-between items-start py-3 border-b last:border-b-0">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">
                                                {productSnapshot?.name || 'Producto'}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {productSnapshot?.variant_name || ''} x {item.quantity}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900">
                                                {formatPrice(item.subtotal)}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {formatPrice(item.unit_price)} c/u
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Totals */}
                        <div className="mt-6 pt-4 border-t space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-medium">{formatPrice(order.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Envío</span>
                                <span className="font-medium text-green-600">Gratis</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                <span>Total</span>
                                <span className="text-blue-600">{formatPrice(order.total_amount)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Info Box */}
                <Card className="mb-6 bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <Package className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-medium text-blue-900 mb-1">
                                    ¿Qué sigue?
                                </p>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>• El distribuidor revisará tu pedido</li>
                                    <li>• Recibirás una notificación cuando sea aprobado</li>
                                    <li>• Podrás hacer seguimiento desde tu perfil</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        onClick={handleContinueShopping}
                        className="flex-1"
                        size="lg"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Continuar Comprando
                    </Button>
                    <Button
                        onClick={handleGoHome}
                        variant="outline"
                        className="flex-1"
                        size="lg"
                    >
                        <Home className="w-4 h-4 mr-2" />
                        Ir al Inicio
                    </Button>
                </div>
            </div>
        </div>
    );
}
