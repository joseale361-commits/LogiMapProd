"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Truck, MapPin, Check, X, Clock, ArrowLeft } from 'lucide-react';

interface RouteStop {
    id: string;
    status: 'pending' | 'in_transit' | 'completed' | 'failed';
    order_id: string;
    stop_number: number;
    orders: {
        id: string;
        order_number: string;
        status: string;
        address: string;
        customer: {
            full_name: string;
            phone: string | null;
        };
    } | null;
}

interface Driver {
    id: string;
    full_name: string;
    phone: string | null;
}

interface Route {
    id: string;
    route_number: string;
    status: string;
    planned_date: string;
    created_at: string;
    driver: Driver | null;
    stops: RouteStop[];
    completed_stops: number;
    total_stops: number;
}

export default function ActiveRoutesPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug as string;

    const [routes, setRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(true);
    const [finishingRoute, setFinishingRoute] = useState<Route | null>(null);
    const [finishingLoading, setFinishingLoading] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        if (slug) {
            fetchActiveRoutes(slug);
        }
    }, [slug]);

    const fetchActiveRoutes = async (distributorSlug: string) => {
        try {
            setLoading(true);
            const supabase = createBrowserClient();

            // 1. Get distributor ID from slug
            const { data: distributor, error: distError } = await supabase
                .from('distributors')
                .select('id')
                .eq('slug', distributorSlug)
                .single();

            if (distError || !distributor) {
                console.error('Error fetching distributor:', distError);
                setNotification({ type: 'error', message: 'Error al cargar distribuidor' });
                return;
            }

            // 2. Fetch active routes with simplified query
            const { data: routesData, error: routesError } = await supabase
                .from('routes')
                .select(`
                    id, route_number, status, planned_date, created_at, driver_id,
                    stops:route_stops(count)
                `)
                .eq('distributor_id', distributor.id)
                .not('status', 'eq', 'completed')
                .not('status', 'eq', 'finished')
                .order('created_at', { ascending: false });

            if (routesError) {
                console.error('Error fetching routes:', routesError);
                setNotification({ type: 'error', message: 'Error al cargar rutas' });
                return;
            }

            // 3. Fetch driver names separately (simpler query)
            const routeIds = (routesData || []).map((r: any) => r.id);
            const driverIds = [...new Set((routesData || []).map((r: any) => r.driver_id).filter(Boolean))];

            let driverMap: Record<string, { full_name: string }> = {};
            if (driverIds.length > 0) {
                const { data: driversData } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .in('id', driverIds);

                if (driversData) {
                    driversData.forEach((d: any) => {
                        driverMap[d.id] = { full_name: d.full_name };
                    });
                }
            }

            // 4. Fetch route stops (simple query without nested orders)
            let stopsMap: Record<string, any[]> = {};
            if (routeIds.length > 0) {
                const { data: stopsData } = await supabase
                    .from('route_stops')
                    .select('id, status, order_id, stop_number, route_id')
                    .in('route_id', routeIds)
                    .order('stop_number');

                if (stopsData) {
                    stopsData.forEach((s: any) => {
                        if (!stopsMap[s.route_id]) {
                            stopsMap[s.route_id] = [];
                        }
                        stopsMap[s.route_id].push(s);
                    });
                }
            }

            // 5. Fetch order details for stops (batch query)
            const allOrderIds = Object.values(stopsMap)
                .flat()
                .map((s: any) => s.order_id)
                .filter(Boolean);

            let ordersMap: Record<string, any> = {};
            if (allOrderIds.length > 0) {
                const { data: ordersData } = await supabase
                    .from('orders')
                    .select('id, order_number, status, address, customer_id')
                    .in('id', allOrderIds);

                if (ordersData) {
                    // Fetch customer names
                    const customerIds = [...new Set(ordersData.map((o: any) => o.customer_id).filter(Boolean))];
                    let customerMap: Record<string, any> = {};
                    if (customerIds.length > 0) {
                        const { data: customersData } = await supabase
                            .from('profiles')
                            .select('id, full_name, phone')
                            .in('id', customerIds);

                        if (customersData) {
                            customersData.forEach((c: any) => {
                                customerMap[c.id] = c;
                            });
                        }
                    }

                    // Build orders map with customer info
                    ordersData.forEach((o: any) => {
                        ordersMap[o.id] = {
                            ...o,
                            customer: customerMap[o.customer_id] || null
                        };
                    });
                }
            }

            // Process routes to combine all data
            const processedRoutes = (routesData || []).map((r: any) => {
                const routeStops = stopsMap[r.id] || [];
                const stopsWithOrders = routeStops.map((s: any) => ({
                    ...s,
                    orders: ordersMap[s.order_id] || null
                }));
                return {
                    ...r,
                    driver: driverMap[r.driver_id] || null,
                    stops: stopsWithOrders,
                    completed_stops: routeStops.filter((s: any) => s.status === 'completed').length || 0,
                    total_stops: routeStops.length || 0
                };
            });

            setRoutes(processedRoutes);
        } catch (error) {
            console.error('Error:', error);
            setNotification({ type: 'error', message: 'Error al cargar rutas' });
        } finally {
            setLoading(false);
        }
    };

    const handleFinishRoute = async (route: Route) => {
        setFinishingRoute(route);
    };

    const confirmFinishRoute = async () => {
        if (!finishingRoute) return;

        try {
            setFinishingLoading(true);

            const response = await fetch(
                `/api/dashboard/${slug}/routes/${finishingRoute.id}/finish`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                }
            );

            const result = await response.json();

            if (result.success) {
                setNotification({
                    type: 'success',
                    message: `Ruta "${finishingRoute.route_number}" finalizada correctamente`
                });
                // Remove the finished route from the list
                setRoutes(prev => prev.filter(r => r.id !== finishingRoute.id));
            } else {
                setNotification({ type: 'error', message: result.error || 'Error al finalizar ruta' });
            }
        } catch (error) {
            console.error('Error finishing route:', error);
            setNotification({ type: 'error', message: 'Error al finalizar ruta' });
        } finally {
            setFinishingLoading(false);
            setFinishingRoute(null);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
            in_transit: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'En Tránsito' },
            completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completado' },
            failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Fallido' },
            active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Activa' }
        };

        const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    const getStopStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <Check className="h-4 w-4 text-green-600" />;
            case 'failed':
                return <X className="h-4 w-4 text-red-600" />;
            case 'in_transit':
                return <Clock className="h-4 w-4 text-blue-600" />;
            default:
                return <Clock className="h-4 w-4 text-gray-400" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Cargando rutas activas...</span>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/${slug}/routes`)}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Monitor de Rutas</h1>
                        <p className="text-sm text-gray-600">
                            Rutas activas en tiempo real
                        </p>
                    </div>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-2">
                    {routes.length} ruta{routes.length !== 1 ? 's' : ''} activa{routes.length !== 1 ? 's' : ''}
                </Badge>
            </div>

            {/* Notification */}
            {notification && (
                <div className={`mb-4 p-4 rounded-lg ${notification.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                    {notification.message}
                </div>
            )}

            {/* Routes List */}
            {routes.length === 0 ? (
                <Card className="p-12 text-center">
                    <Truck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No hay rutas activas
                    </h3>
                    <p className="text-gray-600">
                        Actualmente no hay rutas en ejecución.
                        Crea una nueva ruta desde la página de Rutas.
                    </p>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    {routes.map((route) => (
                        <Card key={route.id} className="overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 pb-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Truck className="h-5 w-5 text-green-600" />
                                            {route.route_number}
                                        </CardTitle>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Fecha: {new Date(route.planned_date).toLocaleDateString('es-CO', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        {getStatusBadge(route.status)}
                                        {route.driver && (
                                            <p className="text-sm text-gray-600 mt-2">
                                                Conductor: <span className="font-medium">{route.driver.full_name}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {/* Progress */}
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600">Progreso</span>
                                        <span className="font-medium">
                                            {route.completed_stops} / {route.total_stops} paradas
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                            style={{
                                                width: `${route.total_stops > 0 ? (route.completed_stops / route.total_stops) * 100 : 0}%`
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Stops List */}
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        Paradas ({route.stops?.length || 0})
                                    </h4>
                                    {route.stops?.slice(0, 5).map((stop) => (
                                        <div
                                            key={stop.id}
                                            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                {getStopStatusIcon(stop.status)}
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        #{stop.stop_number} - {stop.orders?.order_number || 'Sin orden'}
                                                    </p>
                                                    <p className="text-xs text-gray-600">
                                                        {stop.orders?.customer?.full_name || 'Sin cliente'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate max-w-[200px]">
                                                        {stop.orders?.address || 'Sin dirección'}
                                                    </p>
                                                </div>
                                            </div>
                                            {getStatusBadge(stop.status)}
                                        </div>
                                    ))}
                                    {route.stops?.length > 5 && (
                                        <p className="text-xs text-gray-500 text-center py-2">
                                            +{route.stops.length - 5} paradas más...
                                        </p>
                                    )}
                                </div>

                                {/* Action Button */}
                                <div className="mt-4 pt-4 border-t">
                                    <Button
                                        variant="destructive"
                                        className="w-full"
                                        onClick={() => handleFinishRoute(route)}
                                    >
                                        Finalizar Ruta
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Finish Route Dialog */}
            <Dialog open={!!finishingRoute} onOpenChange={() => setFinishingRoute(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Finalizar Ruta</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-gray-700">
                            ¿Estás seguro de que deseas finalizar la ruta <strong>{finishingRoute?.route_number}</strong>?
                        </p>
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                                <strong>Nota:</strong> Las paradas completadas marcarán los pedidos como entregados.
                                Las paradas pendientes o fallidas devolverán los pedidos al pool.
                            </p>
                        </div>
                        {finishingRoute && (
                            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-600">Paradas completadas:</p>
                                    <p className="font-medium text-green-600">{finishingRoute.completed_stops}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Paradas restantes:</p>
                                    <p className="font-medium text-orange-600">
                                        {finishingRoute.total_stops - finishingRoute.completed_stops}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setFinishingRoute(null)}
                            disabled={finishingLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmFinishRoute}
                            disabled={finishingLoading}
                        >
                            {finishingLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Finalizando...
                                </>
                            ) : (
                                'Confirmar Finalización'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
