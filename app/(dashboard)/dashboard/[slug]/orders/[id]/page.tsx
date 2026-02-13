'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Package, User, MapPin, Clock, DollarSign, Check, X, ShoppingCart, FileText } from 'lucide-react';

interface OrderItem {
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    product: {
        id: string;
        name: string;
        sku: string | null;
        image_url: string | null;
    };
    variant: string | null;
}

interface Address {
    id: string;
    street: string;
    city: string | null;
    department: string | null;
    neighborhood: string | null;
    interior: string | null;
    notes: string | null;
    latitude: number | null;
    longitude: number | null;
}

interface Order {
    id: string;
    order_number: string;
    status: string;
    total_amount: number;
    subtotal: number;
    created_at: string;
    delivery_address_text: string | null;
    delivery_location: any;
    requested_delivery_date: string | null;
    requested_delivery_time_slot: string | null;
    delivery_type: 'delivery' | 'pickup';
    pickup_time: string | null;
    payment_method: string;
    invoice_number: string | null;
    // Relations
    items?: Array<{
        id: string;
        quantity: number;
        unit_price: number;
        subtotal: number;
        product: { name: string };
    }>;
    order_items?: Array<{
        id: string;
        quantity: number;
        unit_price: number;
        subtotal: number;
        product: { name: string };
    }>;
    address?: {
        street_address: string;
        city: string;
    } | null;
}

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug as string;
    const id = params?.id as string;

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        if (slug && id) {
            fetchOrder(slug, id);
        }
    }, [slug, id]);

    const fetchOrder = async (distributorSlug: string, orderId: string) => {
        try {
            setLoading(true);
            const supabase = createClient();

            const { data: order, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    items:order_items(
                        id, quantity, unit_price, subtotal,
                        product:products(name)
                    ),
                    address:addresses(street_address, city)
                `)
                .eq('id', orderId)
                .single();

            if (error) {
                console.error('Error fetching order:', error);
                showNotification('error', 'Error al cargar pedido');
                return;
            }

            if (order) {
                const typedOrder = order as unknown as Order;
                console.log('Order Data:', typedOrder);
                console.log('Order Items:', typedOrder.items);
                setOrder(typedOrder);
                // Pre-fill invoice number if already exists
                if (typedOrder.invoice_number) {
                    setInvoiceNumber(typedOrder.invoice_number);
                }
            } else {
                showNotification('error', 'Pedido no encontrado');
            }
        } catch (error) {
            console.error('Error fetching order:', error);
            showNotification('error', 'Error al cargar pedido');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!order) return;

        // Validate invoice number is required
        const trimmedInvoice = invoiceNumber.trim();
        if (!trimmedInvoice) {
            showNotification('error', 'Por favor ingrese el número de factura/ticket antes de aprobar');
            return;
        }

        try {
            setActionLoading(true);
            const response = await fetch(`/api/dashboard/${slug}/orders/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: order.id, invoiceNumber: trimmedInvoice }),
            });
            const data = await response.json();

            if (data.success) {
                showNotification('success', 'Pedido aprobado exitosamente');
                // Refresh order data
                fetchOrder(slug, order.id);
            } else {
                showNotification('error', data.error || 'Error al aprobar pedido');
            }
        } catch (error) {
            console.error('Error approving order:', error);
            showNotification('error', 'Error al aprobar pedido');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!order) return;

        const reason = prompt('Motivo del rechazo:');
        if (!reason) return;

        try {
            setActionLoading(true);
            const response = await fetch(`/api/dashboard/${slug}/orders/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: order.id,
                    cancellationReason: reason
                }),
            });
            const data = await response.json();

            if (data.success) {
                showNotification('success', 'Pedido rechazado');
                setTimeout(() => {
                    router.push(`/dashboard/${slug}/orders`);
                }, 1500);
            } else {
                showNotification('error', data.error || 'Error al rechazar pedido');
            }
        } catch (error) {
            console.error('Error rejecting order:', error);
            showNotification('error', 'Error al rechazar pedido');
        } finally {
            setActionLoading(false);
        }
    };

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { color: string; label: string }> = {
            pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pendiente' },
            pending_approval: { color: 'bg-orange-100 text-orange-800', label: 'Pendiente de Aprobación' },
            approved: { color: 'bg-blue-100 text-blue-800', label: 'Aprobado' },
            ready: { color: 'bg-purple-100 text-purple-800', label: 'Listo' },
            delivered: { color: 'bg-green-100 text-green-800', label: 'Entregado' },
            cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelado' }
        };

        const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>{config.label}</span>;
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Cargando pedido...</div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardContent className="p-8 text-center">
                        <p className="text-gray-500">Pedido no encontrado</p>
                        <Button onClick={() => router.push(`/dashboard/${slug}/orders`)} className="mt-4">
                            Volver a Pedidos
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Handle both possible data structures: order.items or order.order_items
    const items = order.items || order.order_items || [];

    return (
        <div className="container mx-auto p-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/${slug}/orders`)}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Pedido #{order.order_number}</h1>
                    <p className="text-gray-500">{formatDate(order.created_at)}</p>
                </div>
                {getStatusBadge(order.status)}
            </div>

            {/* Notification */}
            {notification && (
                <div className={`mb-6 p-4 rounded-lg ${notification.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                    <div className="flex items-center gap-2">
                        {notification.type === 'success' ? (
                            <Check className="w-5 h-5" />
                        ) : (
                            <X className="w-5 h-5" />
                        )}
                        <span>{notification.message}</span>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Order Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Customer Info - TEMPORARILY DISABLED FOR DEBUG */}
                    {/*
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Información del Cliente
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-gray-500">Nombre</Label>
                                    <p className="font-medium">{order.customer.full_name}</p>
                                </div>
                                <div>
                                    <Label className="text-gray-500">Email</Label>
                                    <p className="font-medium">{order.customer.email || 'No disponible'}</p>
                                </div>
                                <div>
                                    <Label className="text-gray-500">Teléfono</Label>
                                    <p className="font-medium">{order.customer.phone || 'No disponible'}</p>
                                </div>
                                <div>
                                    <Label className="text-gray-500">Tipo de Entrega</Label>
                                    <p className="font-medium">
                                        {order.delivery_type === 'delivery' ? '🚚 Delivery' : '🏪 Retiro en tienda'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    */}

                    {/* Delivery Address */}
                    {(order.delivery_type === 'delivery' || order.address) && (
                        <Card className={order.address ? "border-blue-200" : ""}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5" />
                                    Dirección de Entrega
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {order.address ? (
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-2">
                                            <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                                            <div>
                                                <p className="font-medium">{order.address.street_address}</p>
                                                <p className="text-sm text-gray-500">
                                                    {order.address.city}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p>{order.delivery_address_text || 'No disponible'}</p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Order Items Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5" />
                                Productos ({items.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {items && items.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-3 px-2 font-medium text-gray-600">Producto</th>
                                                <th className="text-center py-3 px-2 font-medium text-gray-600">Cantidad</th>
                                                <th className="text-right py-3 px-2 font-medium text-gray-600">Precio Unit.</th>
                                                <th className="text-right py-3 px-2 font-medium text-gray-600">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(items as Array<{ id: string; quantity: number; unit_price: number; subtotal: number; product?: { name: string } }>).map((item) => (
                                                <tr key={item.id} className="border-b hover:bg-gray-50">
                                                    <td className="py-3 px-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 bg-white rounded border flex-shrink-0 flex items-center justify-center">
                                                                <Package className="w-6 h-6 text-gray-400" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium">{item.product?.name || 'Producto'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-2 text-center">
                                                        <span className="font-medium">{item.quantity}</span>
                                                    </td>
                                                    <td className="py-3 px-2 text-right">
                                                        {formatCurrency(item.unit_price)}
                                                    </td>
                                                    <td className="py-3 px-2 text-right font-medium">
                                                        {formatCurrency(item.subtotal)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-gray-50">
                                                <td colSpan={3} className="py-3 px-2 text-right font-bold">
                                                    Total:
                                                </td>
                                                <td className="py-3 px-2 text-right font-bold text-lg">
                                                    {formatCurrency(order.total_amount)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-500">No hay productos</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Summary & Actions */}
                <div className="space-y-6">
                    {/* Order Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="w-5 h-5" />
                                Resumen
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Método de pago</span>
                                <span className="font-medium">{order.payment_method}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Fecha de creación</span>
                                <span className="font-medium">{formatDate(order.created_at)}</span>
                            </div>
                            {order.requested_delivery_date && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Fecha solicitada</span>
                                    <span className="font-medium">{order.requested_delivery_date}</span>
                                </div>
                            )}
                            <hr />
                            <div className="flex justify-between text-lg font-bold">
                                <span>Total</span>
                                <span>{formatCurrency(order.total_amount)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Invoice Number Input - Only for pending orders */}
                    {order.status === 'pending' && (
                        <Card className="border-blue-200 bg-blue-50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-blue-800">
                                    <FileText className="w-5 h-5" />
                                    Aprobación de Pedido
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="invoiceNumber" className="text-blue-700 block mb-2">
                                        Número de Factura / Ticket *
                                    </Label>
                                    <Input
                                        id="invoiceNumber"
                                        type="text"
                                        placeholder="Ej: FAC-001234"
                                        value={invoiceNumber}
                                        onChange={(e) => setInvoiceNumber(e.target.value)}
                                        className="bg-white"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleApprove}
                                        disabled={actionLoading || !invoiceNumber.trim()}
                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                    >
                                        {actionLoading ? (
                                            <span className="flex items-center gap-2">
                                                <span className="animate-spin">⏳</span>
                                                Aprobando...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <Check className="w-4 h-4" />
                                                Aprobar
                                            </span>
                                        )}
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleReject}
                                        disabled={actionLoading}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                                <p className="text-xs text-blue-600">
                                    * Ingrese el número de factura o ticket para aprobar el pedido
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Ready to Ship Badge - For approved orders */}
                    {order.status === 'approved' && (
                        <Card className="border-purple-200 bg-purple-50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-purple-800">
                                    <Package className="w-5 h-5" />
                                    Estado de Envío
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 p-4 bg-purple-100 rounded-lg">
                                    <Package className="w-6 h-6 text-purple-600" />
                                    <div>
                                        <p className="font-medium text-purple-800">Listo para Entregar</p>
                                        <p className="text-sm text-purple-600">El pedido ha sido aprobado y está listo para su entrega</p>
                                    </div>
                                </div>
                                {order.invoice_number && (
                                    <div className="mt-4 p-3 bg-white rounded-lg">
                                        <p className="text-sm text-gray-500">Factura / Ticket</p>
                                        <p className="font-medium">{order.invoice_number}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Ready Badge - For ready orders */}
                    {order.status === 'ready' && (
                        <Card className="border-green-200 bg-green-50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-green-800">
                                    <Check className="w-5 h-5" />
                                    Listo para Entrega
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 p-4 bg-green-100 rounded-lg">
                                    <Check className="w-6 h-6 text-green-600" />
                                    <div>
                                        <p className="font-medium text-green-800">Pedido Listo</p>
                                        <p className="text-sm text-green-600">El pedido está listo para ser entregado</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Delivered Badge */}
                    {order.status === 'delivered' && (
                        <Card className="border-green-200 bg-green-50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-green-800">
                                    <Check className="w-5 h-5" />
                                    Entregado
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 p-4 bg-green-100 rounded-lg">
                                    <Check className="w-6 h-6 text-green-600" />
                                    <div>
                                        <p className="font-medium text-green-800">Pedido Entregado</p>
                                        <p className="text-sm text-green-600">El pedido ha sido entregado exitosamente</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Cancelled Badge */}
                    {order.status === 'cancelled' && (
                        <Card className="border-red-200 bg-red-50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-red-800">
                                    <X className="w-5 h-5" />
                                    Cancelado
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 p-4 bg-red-100 rounded-lg">
                                    <X className="w-6 h-6 text-red-600" />
                                    <div>
                                        <p className="font-medium text-red-800">Pedido Cancelado</p>
                                        <p className="text-sm text-red-600">Este pedido ha sido cancelado</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
