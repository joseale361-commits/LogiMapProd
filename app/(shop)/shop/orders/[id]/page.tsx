import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getOrderById } from '@/lib/queries/orders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Calendar, MapPin, Truck, Phone, MessageSquare, ArrowLeft, XCircle, Store } from 'lucide-react';
import Link from 'next/link';
import { cancelOrderAction } from '@/lib/actions/orders';

interface OrderDetailPageProps {
    params: {
        id: string;
    }
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
    const { id } = params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const order = await getOrderById(id);

    if (!order) {
        notFound();
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Fecha no disponible';
        return new Date(dateString).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusConfig = (status: string, deliveryType?: string) => {
        const isPickup = deliveryType === 'pickup';
        const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
            pending_approval: { label: 'Pendiente de Aprobación', variant: 'secondary', icon: Calendar },
            approved: {
                label: isPickup ? 'Listo para Retirar' : 'Aprobado',
                variant: 'default',
                icon: isPickup ? Store : Truck
            },
            shipped: { label: isPickup ? 'En Mostrador' : 'En Camino', variant: 'default', icon: Truck },
            delivered: { label: 'Entregado', variant: 'outline', icon: Package },
            cancelled: { label: 'Cancelado', variant: 'destructive', icon: XCircle },
        };

        return statusMap[status] || { label: status, variant: 'outline', icon: Package };
    };

    const statusConfig = getStatusConfig(order.status, order.delivery_type);
    const StatusIcon = statusConfig.icon;

    // WhatsApp link for support
    const distributorPhone = order.distributor.phone?.replace(/\D/g, '') || '';
    const whatsappLink = `https://wa.me/${distributorPhone}?text=Hola, tengo una duda sobre mi pedido ${order.id}`;

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/shop/profile">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Volver
                        </Link>
                    </Button>
                    <h1 className="text-xl font-bold text-gray-900">Detalle del Pedido</h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
                {/* Order Status Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-full">
                                <StatusIcon className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Pedido #{order.id.slice(0, 8)}</CardTitle>
                                <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                            </div>
                        </div>
                        <Badge variant={statusConfig.variant} className="text-sm px-3 py-1">
                            {statusConfig.label}
                        </Badge>
                    </CardHeader>
                    <CardContent className="pt-4 border-t border-gray-100 flex flex-wrap gap-4">
                        {order.status === 'pending_approval' && (
                            <form action={async () => {
                                "use server"
                                await cancelOrderAction(order.id);
                            }}>
                                <Button variant="destructive" className="w-full sm:w-auto">
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Cancelar Pedido
                                </Button>
                            </form>
                        )}
                        {(['approved', 'shipped', 'delivered'].includes(order.status)) && order.distributor.phone && (
                            <Button asChild variant="outline" className="w-full sm:w-auto text-green-600 border-green-200 hover:bg-green-50">
                                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Contactar Soporte (WhatsApp)
                                </a>
                            </Button>
                        )}
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Items List */}
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Package className="w-5 h-5" />
                                    Productos
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <ul className="divide-y divide-gray-100">
                                    {order.items.map((item) => (
                                        <li key={item.id} className="p-4 flex justify-between items-center">
                                            <div>
                                                <p className="font-medium text-gray-900">{item.variant_name}</p>
                                                <p className="text-sm text-gray-500">
                                                    Cantidad: {item.quantity}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-gray-900">{formatPrice(item.subtotal)}</p>
                                                <p className="text-xs text-gray-500">{formatPrice(item.unit_price)} u.</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                <div className="p-4 bg-gray-50 rounded-b-lg border-t border-gray-100 flex justify-between items-center">
                                    <span className="font-bold text-gray-900">Total</span>
                                    <span className="font-bold text-xl text-blue-600">{formatPrice(order.total_amount)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Delivery & Distributor Info */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <MapPin className="w-5 h-5" />
                                    Entrega
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {order.delivery_address_snapshot ? (
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-semibold">{order.delivery_address_snapshot.label || 'Dirección'}</p>
                                        <p className="text-sm text-gray-900">{order.delivery_address_snapshot.street_address}</p>
                                        <p className="text-sm text-gray-600">{order.delivery_address_snapshot.city}</p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">No se especificó dirección</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Phone className="w-5 h-5" />
                                    Distribuidora
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{order.distributor.name}</p>
                                    {order.distributor.phone && (
                                        <p className="text-sm text-gray-600 font-mono mt-1">{order.distributor.phone}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
