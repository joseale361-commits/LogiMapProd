import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Calendar, ArrowRight, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default async function CustomerOrdersPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get the user's profile to find their customer_id
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

    if (!profile) {
        redirect('/login');
    }

    // Fetch orders for this customer with order_items count
    const { data: orders, error } = await supabase
        .from('orders')
        .select(`
            id,
            created_at,
            total_amount,
            status,
            delivery_type,
            distributor_id,
            distributors(name),
            order_items(count)
        `)
        .eq('customer_id', profile.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching orders:', error);
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
        });
    };

    const getStatusConfig = (status: string, deliveryType?: string) => {
        const isPickup = deliveryType === 'pickup';

        const statusMap: Record<string, {
            label: string;
            variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'warning' | 'info' | 'success';
            bgColor: string;
            textColor: string;
            icon: any;
        }> = {
            pending_approval: {
                label: 'Pendiente',
                variant: 'warning',
                bgColor: 'bg-yellow-100',
                textColor: 'text-yellow-800',
                icon: Calendar
            },
            approved: {
                label: isPickup ? 'Listo para Retirar' : 'Aprobado',
                variant: 'info',
                bgColor: 'bg-blue-100',
                textColor: 'text-blue-800',
                icon: Package
            },
            shipped: {
                label: isPickup ? 'En Mostrador' : 'En Tránsito',
                variant: 'info',
                bgColor: 'bg-blue-100',
                textColor: 'text-blue-800',
                icon: Package
            },
            delivered: {
                label: 'Entregado',
                variant: 'success',
                bgColor: 'bg-green-100',
                textColor: 'text-green-800',
                icon: Package
            },
            cancelled: {
                label: 'Cancelado',
                variant: 'destructive',
                bgColor: 'bg-red-100',
                textColor: 'text-red-800',
                icon: Package
            },
        };

        return statusMap[status] || {
            label: status,
            variant: 'outline',
            bgColor: 'bg-gray-100',
            textColor: 'text-gray-800',
            icon: Package
        };
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/shop">
                            ← Volver
                        </Link>
                    </Button>
                    <h1 className="text-xl font-bold text-gray-900">Mis Pedidos</h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">
                {!orders || orders.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <ShoppingBag className="w-8 h-8 text-gray-400" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-2">
                                No tienes pedidos aún
                            </h2>
                            <p className="text-gray-500 text-center mb-6">
                                Cuando realices tu primer pedido, podrás verlo aquí.
                            </p>
                            <Button asChild>
                                <Link href="/shop">
                                    Explorar Tiendas
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order: any) => {
                            const statusConfig = getStatusConfig(order.status, order.delivery_type);
                            const StatusIcon = statusConfig.icon;
                            const itemsCount = order.order_items?.[0]?.count || 0;

                            return (
                                <Card key={order.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-0">
                                        <div className="p-4 md:p-6">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                {/* Left side: Order info */}
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 ${statusConfig.bgColor} rounded-full`}>
                                                            <StatusIcon className={`w-5 h-5 ${statusConfig.textColor}`} />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold text-gray-900">
                                                                Pedido #{order.id.slice(0, 8).toUpperCase()}
                                                            </h3>
                                                            <p className="text-sm text-gray-500">
                                                                {order.distributors?.name || 'Distribuidor'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-sm text-gray-500 ml-2">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-4 h-4" />
                                                            {formatDate(order.created_at)}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Package className="w-4 h-4" />
                                                            {itemsCount} {itemsCount === 1 ? 'producto' : 'productos'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Right side: Status & Actions */}
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold text-gray-900">
                                                            {formatPrice(Number(order.total_amount))}
                                                        </p>
                                                        <Badge
                                                            className={`${statusConfig.bgColor} ${statusConfig.textColor} border-0 mt-1`}
                                                        >
                                                            {statusConfig.label}
                                                        </Badge>
                                                    </div>

                                                    <Button asChild variant="outline" size="sm">
                                                        <Link href={`/shop/orders/${order.id}`}>
                                                            Ver Detalles
                                                            <ArrowRight className="w-4 h-4 ml-1" />
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
