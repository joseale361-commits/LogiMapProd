'use client';

import { useEffect, useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/supabase';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
    ArrowLeft,
    MapPin,
    Navigation,
    CheckCircle2,
    XCircle,
    Phone,
    Package,
    DollarSign,
    CreditCard,
    MessageCircle,
    ExternalLink,
    Map as MapIcon
} from 'lucide-react';

// Dynamic import for RouteMap to avoid Leaflet SSR issues
const RouteMap = dynamic(() => import('@/components/dashboard/routes/RouteMap'), {
    ssr: false,
    loading: () => <div className="h-64 bg-muted animate-pulse rounded-lg" />
});

type Route = Database['public']['Tables']['routes']['Row'];
type RouteStop = Database['public']['Tables']['route_stops']['Row'];

interface StopWithGeo extends RouteStop {
    location_json?: {
        coordinates?: [number, number];
    } | null;
    orders?: {
        payment_status: string;
        payment_method: string;
        total_amount: number;
        balance_due: number;
        order_number: string;
        customer?: {
            full_name: string;
        } | null;
    } | null;
}

interface RouteWithStops extends Route {
    route_stops: StopWithGeo[];
}

export default function RouteDetailPage() {
    const [route, setRoute] = useState<RouteWithStops | null>(null);
    const [loading, setLoading] = useState(true);
    const [warehouseLocation, setWarehouseLocation] = useState<[number, number] | undefined>(undefined);
    const [selectedStop, setSelectedStop] = useState<StopWithGeo | null>(null);
    const [failureReason, setFailureReason] = useState('');
    const [showFailureDialog, setShowFailureDialog] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false);
    const [whatsAppLink, setWhatsAppLink] = useState('');
    const [currentStopId, setCurrentStopId] = useState<string | undefined>();

    const router = useRouter();
    const params = useParams();
    const supabase = createClient();
    const { toast } = useToast();

    const fetchRoute = useCallback(async () => {
        try {
            const { data: routeData, error: routeError } = await supabase
                .from('routes')
                .select('*')
                .eq('id', params.id as string)
                .single();

            if (routeError) throw routeError;

            let { data: stopsData, error: stopsError } = await supabase
                .from('route_stops')
                .select('*')
                .eq('route_id', params.id as string);

            if (stopsError) stopsData = [];

            let stopsWithOrders = stopsData || [];

            if (stopsData && stopsData.length > 0) {
                const orderIds = stopsData
                    .map((stop: any) => stop.order_id)
                    .filter((id: string | undefined) => id);

                if (orderIds.length > 0) {
                    const { data: ordersData } = await supabase
                        .from('orders')
                        .select('id, order_number, payment_status, payment_method, total_amount, balance_due')
                        .in('id', orderIds);

                    if (ordersData) {
                        const ordersDict: Record<string, any> = {};
                        ordersData.forEach((o: any) => {
                            ordersDict[o.id] = o;
                        });
                        stopsWithOrders = stopsData.map((stop: any) => ({
                            ...stop,
                            orders: ordersDict[stop.order_id] || null
                        }));
                    }
                }
            }

            const orderIdsWithGeo = stopsWithOrders
                .map((stop: any) => stop.order_id)
                .filter((id: string | undefined) => id);

            let geoDataMap: Record<string, any> = {};

            if (orderIdsWithGeo.length > 0) {
                const { data: geoData } = await supabase
                    .from('v_orders_with_geojson' as any)
                    .select('id, location_json')
                    .in('id', orderIdsWithGeo);

                if (geoData) {
                    geoDataMap = geoData.reduce((acc: Record<string, any>, item: any) => {
                        acc[item.id] = item;
                        return acc;
                    }, {});
                }
            }

            if (routeData) {
                const typedRoute = routeData as unknown as RouteWithStops;
                typedRoute.route_stops = stopsWithOrders.map((stop: any) => ({
                    ...stop,
                    location_json: geoDataMap[stop.order_id]?.location_json || null,
                }));
                typedRoute.route_stops.sort((a, b) => a.sequence_order - b.sequence_order);
                setRoute(typedRoute);

                if (routeData.distributor_id) {
                    const { data: distributor } = await supabase
                        .from('v_distributor_settings' as any)
                        .select('location_json')
                        .eq('id', routeData.distributor_id)
                        .single();

                    if ((distributor as any)?.location_json?.coordinates) {
                        const coords = (distributor as any).location_json.coordinates;
                        setWarehouseLocation([coords[0], coords[1]]);
                    }
                }
            }
        } catch (error: any) {
            console.error('Error in fetchRoute:', error);
            router.push('/delivery/routes');
        } finally {
            setLoading(false);
        }
    }, [params.id, router, supabase]);

    useEffect(() => {
        if (params.id) {
            fetchRoute();
        }
    }, [params.id, fetchRoute]);

    const getStopCoordinates = (stop: StopWithGeo): [number, number] | null => {
        if (stop.location_json?.coordinates) {
            return stop.location_json.coordinates;
        }
        const rawLocation = stop.delivery_location as any;
        if (rawLocation?.coordinates) {
            return rawLocation.coordinates;
        }
        return null;
    };

    const focusStopOnMap = (stop: StopWithGeo) => {
        const coordinates = getStopCoordinates(stop);
        if (coordinates) {
            setCurrentStopId(stop.id);
            const mapElement = document.querySelector('.sticky.top-\\[88px\\]');
            if (mapElement) {
                mapElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };

    const openExternalNavigation = (stop: StopWithGeo) => {
        const coordinates = getStopCoordinates(stop);
        if (coordinates) {
            const [lng, lat] = coordinates;
            const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
            window.open(googleMapsUrl, '_blank');
        }
    };

    const notifyNearby = (stop: StopWithGeo) => {
        if (!stop.customer_phone) return;
        const message = 'Hola, soy tu repartidor de LogiMap. Estoy a 10 minutos.';
        const phone = stop.customer_phone.replace(/\D/g, '');
        const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        setWhatsAppLink(waLink);
        setSelectedStop(stop);
        setShowWhatsAppDialog(true);
    };

    const handleDeliveryClick = (stop: StopWithGeo) => {
        setSelectedStop(stop);
        setCurrentStopId(stop.id);
        const order = stop.orders;

        // Show payment dialog if order has balance pending
        if (order && order.payment_status !== 'paid') {
            setPaymentAmount(order.total_amount.toString());
            setShowPaymentDialog(true);
        } else {
            setShowSuccessDialog(true);
        }
    };

    const confirmDeliveryWithPayment = async () => {
        if (!selectedStop) return;
        try {
            const response = await fetch('/api/delivery/stops/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    stopId: selectedStop.id,
                    amountCollected: parseFloat(paymentAmount) || 0,
                    notes: 'Entregado con cobro'
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.error || 'Error al completar entrega';
                const errorDetails = errorData.details || '';
                const errorHint = errorData.hint || '';
                const fullErrorMessage = errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage;
                throw new Error(errorHint ? `${fullErrorMessage} (Sugerencia: ${errorHint})` : fullErrorMessage);
            }

            toast({
                title: 'Entrega completada',
                description: 'El cobro se registro exitosamente',
                variant: 'default',
            });
            setShowPaymentDialog(false);
            setPaymentAmount('');
            await fetchRoute();
        } catch (error) {
            console.error(error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Error al completar entrega',
                variant: 'destructive',
            });
        }
    };

    const markAsDelivered = async (stop: StopWithGeo) => {
        try {
            const response = await fetch('/api/delivery/stops/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    stopId: stop.id,
                    amountCollected: 0
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al marcar como entregado');
            }

            toast({
                title: 'Entrega completada',
                description: 'El pedido fue marcado como entregado',
                variant: 'default',
            });
            setShowSuccessDialog(false);
            await fetchRoute();
        } catch (error) {
            console.error(error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Error al marcar como entregado',
                variant: 'destructive',
            });
        }
    };

    const markAsFailed = async (stop: StopWithGeo) => {
        if (!failureReason.trim()) return;
        try {
            const response = await fetch(`/api/delivery/stops/${stop.id}/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'failed',
                    failureReason: failureReason,
                }),
            });

            if (!response.ok) throw new Error('Error al marcar como fallido');

            setShowFailureDialog(false);
            setFailureReason('');
            await fetchRoute();
        } catch (error) {
            console.error(error);
        }
    };

    const stopsWithCoords = useMemo(() => {
        if (!route?.route_stops) return [];
        return route.route_stops.map(stop => ({
            ...stop,
            delivery_location: getStopCoordinates(stop) ? { coordinates: getStopCoordinates(stop) } : undefined
        }));
    }, [route]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Cargando ruta...</p>
                </div>
            </div>
        );
    }

    if (!route) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-500">Ruta no encontrada</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="px-4 py-4 flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push('/delivery/routes')}
                        className="shrink-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-gray-900">Ruta {route.route_number}</h1>
                        <p className="text-sm text-gray-500">
                            {route.route_stops.filter(s => s.status === 'delivered').length}/{route.route_stops.length} entregas
                        </p>
                    </div>
                </div>
            </header>

            <div className="bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Progreso</span>
                    <span className="font-semibold text-gray-900">
                        {Math.round((route.route_stops.filter(s => s.status === 'delivered').length / route.route_stops.length) * 100)}%
                    </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(route.route_stops.filter(s => s.status === 'delivered').length / route.route_stops.length) * 100}%` }}
                    />
                </div>
            </div>

            <div className="sticky top-[88px] z-10 bg-gray-100 border-b border-gray-200 h-[40vh]">
                <RouteMap
                    warehouseLocation={warehouseLocation}
                    stops={stopsWithCoords as any}
                    currentStopId={currentStopId}
                    mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
                    onStopClick={(stop) => setCurrentStopId(stop.id)}
                    onNavigate={(stop) => openExternalNavigation(stop as StopWithGeo)}
                />
            </div>

            <main className="px-4 py-6 space-y-4">
                {route.route_stops.map((stop, index) => {
                    const isSelected = currentStopId === stop.id;
                    const statusClass = stop.status === 'delivered' ? 'bg-green-50 border-green-200' :
                        stop.status === 'failed' ? 'bg-red-50 border-red-200' :
                            'bg-white border-gray-200';

                    return (
                        <Card
                            key={stop.id}
                            className={`overflow-hidden transition-all shadow-sm ${statusClass} ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start gap-3">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm shrink-0">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-base text-gray-900">{stop.customer_name}</CardTitle>
                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                            {stop.status === 'pending' && <Badge variant="secondary">Pendiente</Badge>}
                                            {stop.status === 'in_progress' && <Badge className="bg-blue-500 text-white">En Progreso</Badge>}
                                            {stop.status === 'delivered' && <Badge className="bg-green-500 text-white">Entregado</Badge>}
                                            {stop.status === 'failed' && <Badge className="bg-red-500 text-white">Fallido</Badge>}
                                            {stop.orders && stop.orders.balance_due > 0 && stop.status !== 'delivered' && (
                                                <Badge variant="destructive" className="animate-pulse">
                                                    COBRAR: ${stop.orders.balance_due.toLocaleString()}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-start gap-2 text-sm text-gray-600">
                                    <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" />
                                    <span className="break-words">{stop.delivery_address_text}</span>
                                </div>

                                {stop.customer_phone && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Phone className="h-4 w-4 shrink-0 text-gray-400" />
                                        <a href={`tel:${stop.customer_phone}`} className="text-blue-600 hover:underline">
                                            {stop.customer_phone}
                                        </a>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 ml-auto text-green-600 hover:text-green-700 hover:bg-green-50"
                                            onClick={() => notifyNearby(stop)}
                                        >
                                            <MessageCircle className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}

                                {stop.notes && (
                                    <div className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                        <Package className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" />
                                        <span className="break-words italic">{stop.notes}</span>
                                    </div>
                                )}

                                {(stop.status === 'pending' || stop.status === 'in_progress') && (
                                    <div className="pt-3 space-y-2">
                                        <div className="flex gap-2">
                                            <Link
                                                href={`/delivery/navigate/${stop.id}`}
                                                className="flex-1 h-12 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                                            >
                                                <Navigation className="h-5 w-5" />
                                                Navegar
                                            </Link>
                                            <Button onClick={() => openExternalNavigation(stop)} variant="outline" className="h-12 border-gray-200 text-gray-700 bg-white hover:bg-gray-50">
                                                <ExternalLink className="h-5 w-5 text-orange-500" />
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button onClick={() => handleDeliveryClick(stop)} className="h-12 bg-green-600 hover:bg-green-700 text-white">
                                                <CheckCircle2 className="h-5 w-5 mr-1" /> Entregado
                                            </Button>
                                            <Button onClick={() => { setSelectedStop(stop); setShowFailureDialog(true); }} variant="destructive" className="h-12">
                                                <XCircle className="h-5 w-5 mr-1" /> Fallido
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </main>

            <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                <DialogContent className="bg-white border-gray-200 text-gray-900">
                    <DialogHeader>
                        <DialogTitle>Confirmar Entrega</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 text-gray-600">
                        ¿Estás seguro de que quieres marcar esta entrega como completada?
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowSuccessDialog(false)}>Cancelar</Button>
                        <Button onClick={() => selectedStop && markAsDelivered(selectedStop)} className="bg-green-600 hover:bg-green-700 text-white">Confirmar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                <DialogContent className="bg-white border-gray-200 text-gray-900">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-green-600" /> Cobrar al Cliente
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <p className="text-gray-600">Ingrese el monto recibido:</p>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-400">$</span>
                            <input
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-300 rounded-md py-2 pl-8 pr-4 text-gray-900"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>Cancelar</Button>
                        <Button onClick={confirmDeliveryWithPayment} className="bg-green-600 hover:bg-green-700 text-white">Confirmar Pago</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showFailureDialog} onOpenChange={setShowFailureDialog}>
                <DialogContent className="bg-white border-gray-200 text-gray-900">
                    <DialogHeader>
                        <DialogTitle>Reportar Falla</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <p className="text-gray-600">¿Por qué no se pudo completar la entrega?</p>
                        <Textarea
                            placeholder="Ej: No estaba el cliente..."
                            value={failureReason}
                            onChange={(e) => setFailureReason(e.target.value)}
                            rows={4}
                            className="bg-gray-50 border-gray-300"
                        />
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => { setShowFailureDialog(false); setFailureReason(''); }}>Cancelar</Button>
                        <Button variant="destructive" onClick={() => selectedStop && markAsFailed(selectedStop)}>Reportar Falla</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showWhatsAppDialog} onOpenChange={setShowWhatsAppDialog}>
                <DialogContent className="bg-white border-gray-200 text-gray-900">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageCircle className="w-5 h-5 text-green-600" /> Avisar al Cliente
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-gray-600 mb-4">¿Deseas notificar al cliente que estás cerca?</p>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowWhatsAppDialog(false)}>Cancelar</Button>
                        <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
                            <a href={whatsAppLink} target="_blank" rel="noopener noreferrer">
                                <MessageCircle className="h-4 w-4 mr-2" /> Enviar
                            </a>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
