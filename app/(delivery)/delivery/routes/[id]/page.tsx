'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/supabase';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, MapPin, Navigation, CheckCircle2, XCircle, Phone, Package } from 'lucide-react';

type Route = Database['public']['Tables']['routes']['Row'];
type RouteStop = Database['public']['Tables']['route_stops']['Row'];

interface RouteWithStops extends Route {
    route_stops: RouteStop[];
}

export default function RouteDetailPage() {
    const [route, setRoute] = useState<RouteWithStops | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedStop, setSelectedStop] = useState<RouteStop | null>(null);
    const [failureReason, setFailureReason] = useState('');
    const [showFailureDialog, setShowFailureDialog] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const router = useRouter();
    const params = useParams();
    const supabase = createClient();

    useEffect(() => {
        fetchRoute();
    }, [params.id]);

    async function fetchRoute() {
        try {
            const { data: routeData, error } = await supabase
                .from('routes')
                .select(`
          *,
          route_stops (*)
        `)
                .eq('id', params.id as string)
                .single();

            if (error) throw error;

            // Sort stops by sequence_order
            if (routeData) {
                routeData.route_stops.sort((a, b) => a.sequence_order - b.sequence_order);
                setRoute(routeData);
            }
        } catch (error) {
            console.error('Error fetching route:', error);
            alert('Error al cargar la ruta');
            router.push('/delivery/routes');
        } finally {
            setLoading(false);
        }
    }

    function openNavigation(stop: RouteStop) {
        const location = stop.delivery_location as any;
        if (location && location.coordinates) {
            const [lng, lat] = location.coordinates;
            // Try Waze first, then Google Maps
            const wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
            const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

            // Open Waze in a new tab
            window.open(wazeUrl, '_blank');
        } else {
            alert('No hay coordenadas disponibles para esta parada');
        }
    }

    async function markAsDelivered(stop: RouteStop) {
        try {
            const response = await fetch(`/api/delivery/stops/${stop.id}/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: 'delivered',
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al marcar como entregado');
            }

            setShowSuccessDialog(false);
            await fetchRoute();
        } catch (error) {
            console.error('Error marking as delivered:', error);
            alert(error instanceof Error ? error.message : 'Error al marcar como entregado');
        }
    }

    async function markAsFailed(stop: RouteStop) {
        if (!failureReason.trim()) {
            alert('Por favor ingresa un motivo');
            return;
        }

        try {
            const response = await fetch(`/api/delivery/stops/${stop.id}/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: 'failed',
                    failureReason: failureReason,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al marcar como fallido');
            }

            setShowFailureDialog(false);
            setFailureReason('');
            await fetchRoute();
        } catch (error) {
            console.error('Error marking as failed:', error);
            alert(error instanceof Error ? error.message : 'Error al marcar como fallido');
        }
    }

    function getStopStatusBadge(status: string) {
        switch (status) {
            case 'pending':
                return <Badge variant="secondary">Pendiente</Badge>;
            case 'in_progress':
                return <Badge className="bg-blue-500">En Progreso</Badge>;
            case 'delivered':
                return <Badge className="bg-green-500">Entregado</Badge>;
            case 'failed':
                return <Badge className="bg-red-500">Fallido</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    }

    function getCompletedStops() {
        return route?.route_stops.filter(stop => stop.status === 'delivered').length || 0;
    }

    function getFailedStops() {
        return route?.route_stops.filter(stop => stop.status === 'failed').length || 0;
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Cargando ruta...</p>
                </div>
            </div>
        );
    }

    if (!route) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <p className="text-gray-400">Ruta no encontrada</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 pb-20">
            {/* Header */}
            <header className="bg-gray-950 border-b border-gray-800 sticky top-0 z-10">
                <div className="px-4 py-4">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push('/delivery/routes')}
                            className="shrink-0 text-gray-400 hover:text-white hover:bg-gray-800"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold text-white">
                                Ruta {route.route_number}
                            </h1>
                            <p className="text-sm text-gray-400">
                                {getCompletedStops()}/{route.total_stops || route.route_stops.length} entregas
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Progress Bar */}
            <div className="bg-gray-950 border-b border-gray-800">
                <div className="px-4 py-3">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-400">Progreso</span>
                        <span className="font-semibold text-white">
                            {Math.round((getCompletedStops() / (route.total_stops || route.route_stops.length)) * 100)}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{
                                width: `${(getCompletedStops() / (route.total_stops || route.route_stops.length)) * 100}%`
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="px-4 py-6 space-y-4">
                {route.route_stops.map((stop, index) => (
                    <Card key={stop.id} className={`overflow-hidden ${stop.status === 'delivered' ? 'bg-green-900/30 border-green-800' : stop.status === 'failed' ? 'bg-red-900/30 border-red-800' : 'bg-gray-800 border-gray-700'}`}>
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-900 text-blue-400 font-bold text-sm shrink-0">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-base text-white">
                                            {stop.customer_name}
                                        </CardTitle>
                                        <div className="flex items-center gap-2 mt-1">
                                            {getStopStatusBadge(stop.status)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {/* Address */}
                            <div className="flex items-start gap-2 text-sm text-gray-400">
                                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                                <span className="break-words">{stop.delivery_address_text}</span>
                            </div>

                            {/* Phone */}
                            {stop.customer_phone && (
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <Phone className="h-4 w-4 shrink-0" />
                                    <a
                                        href={`tel:${stop.customer_phone}`}
                                        className="text-blue-400 hover:underline"
                                    >
                                        {stop.customer_phone}
                                    </a>
                                </div>
                            )}

                            {/* Notes */}
                            {stop.notes && (
                                <div className="flex items-start gap-2 text-sm text-gray-400">
                                    <Package className="h-4 w-4 mt-0.5 shrink-0" />
                                    <span className="break-words">{stop.notes}</span>
                                </div>
                            )}

                            {/* Action Buttons */}
                            {stop.status === 'pending' || stop.status === 'in_progress' ? (
                                <div className="pt-3 space-y-2">
                                    <Button
                                        onClick={() => openNavigation(stop)}
                                        className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Navigation className="h-5 w-5 mr-2" />
                                        Navegar
                                    </Button>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            onClick={() => {
                                                setSelectedStop(stop);
                                                setShowSuccessDialog(true);
                                            }}
                                            className="h-12 text-base font-semibold bg-green-600 hover:bg-green-700"
                                        >
                                            <CheckCircle2 className="h-5 w-5 mr-1" />
                                            Entregado
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setSelectedStop(stop);
                                                setShowFailureDialog(true);
                                            }}
                                            variant="destructive"
                                            className="h-12 text-base font-semibold"
                                        >
                                            <XCircle className="h-5 w-5 mr-1" />
                                            Fallido
                                        </Button>
                                    </div>
                                </div>
                            ) : stop.status === 'delivered' ? (
                                <div className="pt-3">
                                    <div className="flex items-center gap-2 text-green-400 font-medium">
                                        <CheckCircle2 className="h-5 w-5" />
                                        <span>Entregado el {new Date(stop.delivered_at!).toLocaleDateString('es-ES')}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="pt-3">
                                    <div className="flex items-center gap-2 text-red-400 font-medium">
                                        <XCircle className="h-5 w-5" />
                                        <span>Fallido: {stop.failure_reason}</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </main>

            {/* Success Dialog */}
            <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                <DialogContent className="bg-gray-800 border-gray-700 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-white">Confirmar Entrega</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-gray-300">
                            ¿Estás seguro de que quieres marcar esta entrega como completada?
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSuccessDialog(false)} className="border-gray-600 text-white hover:bg-gray-700">
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => selectedStop && markAsDelivered(selectedStop)}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            Confirmar Entrega
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Failure Dialog */}
            <Dialog open={showFailureDialog} onOpenChange={setShowFailureDialog}>
                <DialogContent className="bg-gray-800 border-gray-700 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-white">Reportar Falla</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <p className="text-gray-300">
                            ¿Por qué no se pudo completar la entrega?
                        </p>
                        <Textarea
                            placeholder="Ej: No estaba el cliente, dirección errónea, etc."
                            value={failureReason}
                            onChange={(e) => setFailureReason(e.target.value)}
                            rows={4}
                            className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setShowFailureDialog(false);
                            setFailureReason('');
                        }} className="border-gray-600 text-white hover:bg-gray-700">
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => selectedStop && markAsFailed(selectedStop)}
                        >
                            Reportar Falla
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
