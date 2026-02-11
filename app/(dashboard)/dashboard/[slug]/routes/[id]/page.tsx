'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, DollarSign, Calendar, Truck, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PageProps {
    params: Promise<{
        slug: string;
        id: string;
    }>;
}

export default function RouteDetailPage({ params }: PageProps) {
    const [route, setRoute] = useState<any>(null);
    const [stops, setStops] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [slug, setSlug] = useState<string>('');
    const [processing, setProcessing] = useState(false);
    const router = useRouter();

    const fetchData = async (slug: string, id: string) => {
        try {
            const response = await fetch(`/api/dashboard/${slug}/routes/${id}`);
            const data = await response.json();

            if (data.success) {
                setRoute(data.route);
                setStops(data.stops || []);
                setPayments(data.payments || []);
            } else {
                console.error('Error fetching route:', data.error);
            }
        } catch (error) {
            console.error('Error fetching route:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        params.then(async ({ slug, id }) => {
            setSlug(slug);
            await fetchData(slug, id);
        });
    }, [params]);

    const handleFinishRoute = async () => {
        if (!confirm('¿Estás seguro de que deseas liquidar y finalizar esta ruta? Esta acción no se puede deshacer.')) return;

        setProcessing(true);
        try {
            const response = await fetch(`/api/dashboard/${slug}/routes/${route.id}/finish`, {
                method: 'POST',
            });
            const data = await response.json();

            if (data.success) {
                // Refresh data
                await fetchData(slug, route.id);
            } else {
                alert('Error al finalizar ruta: ' + data.error);
            }
        } catch (error) {
            console.error('Error finishing route:', error);
            alert('Error al procesar la solicitud');
        } finally {
            setProcessing(false);
        }
    };

    // Financial Calculations
    // 1. Total Collected: Sum of payments recorded by driver
    const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    // 2. Total Expected: 
    let totalExpected = 0;

    // Helper to find payment for an order
    const getPaymentForOrder = (orderId: string) => {
        return payments.filter(p => p.order_id === orderId).reduce((sum, p) => sum + Number(p.amount), 0);
    };

    stops.forEach(stop => {
        const order = stop.orders;
        if (!order) return;

        const collected = getPaymentForOrder(order.id);

        if (order.payment_method === 'credit') {
            // No collection expected
        } else {
            if (order.balance_due > 0 || collected > 0) {
                totalExpected += (order.balance_due + collected);
            }
        }
    });

    const difference = totalExpected - totalCollected;

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Cargando reporte...</div>;
    }

    if (!route) {
        return <div className="p-8 text-center text-red-500">Ruta no encontrada</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        Resumen de Ruta
                        <Badge variant="outline">{route.route_number || 'N/A'}</Badge>
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                            <Truck className="w-4 h-4" />
                            {route.driver?.full_name || 'Sin Chofer'}
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {route.planned_date}
                        </span>
                        <Badge className={`${route.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                            {route.status === 'completed' ? 'Completado' : route.status}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Financial Summary Card */}
            <Card className="bg-gradient-to-br from-white to-gray-50 border-blue-100">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                        <DollarSign className="w-5 h-5 text-blue-600" />
                        Liquidación Financiera
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                            <p className="text-sm font-medium text-gray-500">Total a Recaudar</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalExpected)}</p>
                            <p className="text-xs text-gray-400 mt-1">Pedidos en efectivo</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                            <p className="text-sm font-medium text-gray-500">Total Recaudado</p>
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalCollected)}</p>
                            <p className="text-xs text-gray-400 mt-1">Reportado por chofer</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Diferencia</p>
                                <p className={`text-2xl font-bold ${difference === 0 ? 'text-gray-900' : 'text-red-500'}`}>
                                    {formatCurrency(difference)}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">Pendiente de entregar</p>
                            </div>
                            {route.status !== 'finished' && (
                                <Button
                                    className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={handleFinishRoute}
                                    disabled={processing}
                                >
                                    {processing ? 'Procesando...' : 'Liquidar y Finalizar Ruta'}
                                </Button>
                            )}
                            {route.status === 'finished' && (
                                <div className="mt-4 w-full text-center text-sm text-green-600 font-medium py-2 bg-green-50 rounded">
                                    Ruta Liquidada el {formatDate(route.finished_at)}
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Detailed Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Desglose de Entregas</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-600 font-medium">
                                <tr>
                                    <th className="px-4 py-3 text-left">Pedido</th>
                                    <th className="px-4 py-3 text-left">Cliente</th>
                                    <th className="px-4 py-3 text-center">Método Pago</th>
                                    <th className="px-4 py-3 text-right">Monto Total</th>
                                    <th className="px-4 py-3 text-right">Cobrado</th>
                                    <th className="px-4 py-3 text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {stops.map((stop) => {
                                    const order = stop.orders;
                                    const collected = order ? getPaymentForOrder(order.id) : 0;
                                    const isCredit = order?.payment_method === 'credit';

                                    return (
                                        <tr key={stop.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium">
                                                {order?.order_number || '-'}
                                                <div className="text-xs text-gray-400">Stop #{stop.sequence_order}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {stop.customer_name}
                                                <div className="text-xs text-gray-400">{stop.customer_phone}</div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {isCredit ? (
                                                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">Crédito</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="border-green-200 text-green-700">Efectivo</Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-600">
                                                {order ? formatCurrency(order.total_amount) : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">
                                                {collected > 0 ? (
                                                    <span className="text-green-600">+{formatCurrency(collected)}</span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge variant={
                                                    stop.status === 'delivered' ? 'default' :
                                                        stop.status === 'failed' ? 'destructive' : 'secondary'
                                                }>
                                                    {stop.status === 'delivered' ? 'Entregado' :
                                                        stop.status === 'failed' ? 'Fallido' : stop.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
