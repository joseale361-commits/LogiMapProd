'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Navigation, CheckCircle, XCircle, ArrowLeft, DollarSign } from 'lucide-react';

// Dynamic import without SSR
const NavigationMap = dynamic(() =>
    import('@/components/dashboard/routes/NavigationMap').then(mod => mod.default),
    {
        ssr: false,
        loading: () => <div className="h-full w-full bg-gray-100 animate-pulse" />
    }
);

interface GeoData {
    location_json?: {
        coordinates: [number, number];
    };
}

export default function NavigatePage() {
    const params = useParams();
    const stopId = params?.stopId as string;
    const supabase = createClient();

    const [stop, setStop] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [showFailureDialog, setShowFailureDialog] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [failureReason, setFailureReason] = useState('');

    useEffect(() => {
        async function fetchStop() {
            if (!stopId) return;

            try {
                const [routeStopResult, orderResult] = await Promise.all([
                    supabase
                        .from('route_stops')
                        .select('*, route_id, order_id')
                        .eq('id', stopId)
                        .single(),
                    supabase
                        .from('orders')
                        .select('*, customer_id')
                        .eq('id', stopId)
                        .single()
                ]);

                if (routeStopResult.error || !routeStopResult.data) {
                    throw routeStopResult.error || new Error('Route stop not found');
                }

                const routeStop = routeStopResult.data;

                const { data: order, error: orderError } = await supabase
                    .from('orders')
                    .select('*, customer_id')
                    .eq('id', routeStop.order_id)
                    .single();

                if (orderError || !order) throw orderError || new Error('Order not found');

                const [customerResult, geoResult] = await Promise.all([
                    supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', order.customer_id)
                        .single(),
                    supabase
                        .from('v_orders_with_geojson' as any)
                        .select('location_json')
                        .eq('id', order.id)
                        .single()
                ]);

                const customer = customerResult.data;
                if (customerResult.error) {
                    console.warn('Customer not found, continuing without profile');
                }

                const geoData = geoResult.data;
                if (geoResult.error) {
                    console.warn('Geo data not found, continuing without coordinates');
                }

                setStop({
                    ...routeStop,
                    order: {
                        ...order,
                        customer: customer || null
                    },
                    location_json: (geoData as any)?.location_json || null
                });
            } catch (e) {
                console.error('Error fetching stop:', e);
            } finally {
                setLoading(false);
            }
        }
        fetchStop();
    }, [stopId]);

    const handleDeliveryClick = () => {
        const order = stop?.order;
        if (order?.balance_due > 0) {
            setPaymentAmount(order.balance_due.toString());
            setShowPaymentDialog(true);
        } else {
            setShowSuccessDialog(true);
        }
    };

    const confirmDelivery = async () => {
        if (!stop) return;
        setSubmitting(true);

        try {
            const paymentData = {
                stopId: stop.id,
                paymentMethod: 'cash' as const,
                amountCollected: parseFloat(paymentAmount) || 0,
                notes: ''
            };

            const response = await fetch('/api/delivery/stops/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Error al completar la entrega');
            }

            setShowPaymentDialog(false);
            setShowSuccessDialog(false);
            setPaymentAmount('');

            setTimeout(() => {
                window.location.href = `/delivery/routes/${stop.route_id}`;
            }, 100);
        } catch (e: any) {
            console.error('Error completing delivery:', e);
            alert(e.message || 'Error al completar la entrega');
        } finally {
            setSubmitting(false);
        }
    };

    const handleFailureClick = () => {
        setFailureReason('');
        setShowFailureDialog(true);
    };

    const confirmFailure = async () => {
        if (!stop) return;
        setSubmitting(true);

        try {
            const response = await fetch(`/api/delivery/stops/${stop.id}/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'failed',
                    failureReason: failureReason || 'Entrega cancelada por el repartidor'
                })
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Error al marcar como cancelado');
            }

            setShowFailureDialog(false);
            setFailureReason('');

            setTimeout(() => {
                window.location.href = `/delivery/routes/${stop.route_id}`;
            }, 100);
        } catch (e: any) {
            console.error('Error marking delivery as failed:', e);
            alert(e.message || 'Error al marcar como cancelado');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (!stop) return <div className="p-4">Parada no encontrada</div>;

    const coords: [number, number] | null = stop.location_json?.coordinates
        ? [stop.location_json.coordinates[1], stop.location_json.coordinates[0]]
        : null;

    const hasBalance = stop?.order?.balance_due > 0;

    return (
        <div className="flex flex-col h-[100dvh] overflow-hidden">
            <div className="flex-1 relative z-0">
                {coords ? (
                    <NavigationMap targetLocation={coords} />
                ) : (
                    <div className="p-10 text-center">Sin mapa</div>
                )}
            </div>

            <div className="bg-white p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 rounded-t-xl border-t shrink-0">
                <div className="flex items-center justify-between mb-3">
                    <Link
                        href={`/delivery/routes/${stop.route_id}`}
                        className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft size={18} />
                        <span className="text-sm">Volver</span>
                    </Link>
                    {hasBalance && (
                        <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                            COBRAR: ${stop.order.balance_due.toLocaleString()}
                        </span>
                    )}
                </div>

                <h2 className="font-bold text-lg truncate">{stop.order?.customer?.full_name || 'Cliente'}</h2>
                <p className="text-sm text-gray-500 truncate mb-4">{stop.order?.address_line1 || 'Sin dirección'}</p>

                <div className="grid grid-cols-4 gap-2">
                    <a
                        href={coords ? `https://waze.com/ul?ll=${coords[0]},${coords[1]}&navigate=yes` : '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="col-span-1 flex flex-col items-center justify-center bg-blue-50 text-blue-600 rounded-lg p-2 hover:bg-blue-100"
                    >
                        <Navigation size={20} />
                        <span className="text-xs font-bold mt-1">Waze</span>
                    </a>

                    <button
                        onClick={handleFailureClick}
                        disabled={submitting}
                        className="col-span-1 flex flex-col items-center justify-center bg-red-50 text-red-600 rounded-lg p-2 hover:bg-red-100 disabled:opacity-50"
                    >
                        <XCircle size={20} />
                        <span className="text-xs font-bold mt-1">Cancelado</span>
                    </button>

                    <button
                        onClick={handleDeliveryClick}
                        disabled={submitting}
                        className="col-span-2 flex flex-col items-center justify-center bg-green-600 text-white rounded-lg p-2 hover:bg-green-700 shadow-md disabled:opacity-50"
                    >
                        <CheckCircle size={24} />
                        <span className="text-sm font-bold mt-1">ENTREGADO</span>
                    </button>
                </div>
            </div>

            {/* Dialogo confirmar entrega sin pago */}
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
                        <Button onClick={confirmDelivery} className="bg-green-600 hover:bg-green-700 text-white">Confirmar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialogo cobrar al cliente */}
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
                        <p className="text-sm text-gray-500">
                            Saldo pendiente: ${(stop?.order?.balance_due || 0).toLocaleString()}
                        </p>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>Cancelar</Button>
                        <Button onClick={confirmDelivery} className="bg-green-600 hover:bg-green-700 text-white">Confirmar Pago</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialogo reporte de falla */}
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
                        <Button variant="outline" onClick={() => setShowFailureDialog(false)}>Cancelar</Button>
                        <Button onClick={confirmFailure} className="bg-red-600 hover:bg-red-700 text-white">Confirmar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
