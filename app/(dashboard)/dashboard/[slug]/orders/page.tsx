"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Check, X, MapPin, Clock, User, Package, AlertCircle } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
    () => import('react-leaflet').then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import('react-leaflet').then((mod) => mod.TileLayer),
    { ssr: false }
);
const Marker = dynamic(
    () => import('react-leaflet').then((mod) => mod.Marker),
    { ssr: false }
);
const Popup = dynamic(
    () => import('react-leaflet').then((mod) => mod.Popup),
    { ssr: false }
);

interface Order {
    id: string;
    order_number: string;
    status: string;
    total_amount: number;
    created_at: string;
    customer: {
        full_name: string;
        email: string;
        phone: string | null;
    };
    delivery_address_text: string;
    delivery_location: any;
    requested_delivery_date: string | null;
    requested_delivery_time_slot: string | null;
}

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default function OrdersPage({ params }: PageProps) {
    const [slug, setSlug] = useState<string>('');
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showMapDialog, setShowMapDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        params.then(({ slug }) => {
            setSlug(slug);
            fetchOrders(slug);
        });
    }, [params]);

    const fetchOrders = async (distributorSlug: string) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/dashboard/${distributorSlug}/orders`);
            const data = await response.json();

            if (data.success) {
                setOrders(data.orders);
            } else {
                showNotification('error', data.error || 'Error al cargar pedidos');
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            showNotification('error', 'Error al cargar pedidos');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (orderId: string) => {
        try {
            setActionLoading(true);
            const response = await fetch(`/api/dashboard/${slug}/orders/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId }),
            });
            const data = await response.json();

            if (data.success) {
                showNotification('success', 'Pedido aprobado exitosamente');
                fetchOrders(slug);
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
        if (!selectedOrder) return;

        try {
            setActionLoading(true);
            const response = await fetch(`/api/dashboard/${slug}/orders/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: selectedOrder.id,
                    cancellationReason: rejectReason
                }),
            });
            const data = await response.json();

            if (data.success) {
                showNotification('success', 'Pedido rechazado exitosamente');
                setShowRejectDialog(false);
                setRejectReason('');
                setSelectedOrder(null);
                fetchOrders(slug);
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
        setTimeout(() => setNotification(null), 3000);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
        }).format(amount);
    };

    const getMapPosition = (location: any): [number, number] | null => {
        if (!location) return null;

        // Handle PostGIS geometry format
        if (location.coordinates && Array.isArray(location.coordinates)) {
            return [location.coordinates[1], location.coordinates[0]]; // [lat, lng]
        }

        // Handle GeoJSON format
        if (location.type === 'Point' && location.coordinates) {
            return [location.coordinates[1], location.coordinates[0]];
        }

        return null;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Pedidos Pendientes</h1>
                    <p className="text-gray-600 mt-1">
                        Gestiona los pedidos que requieren aprobación
                    </p>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-2">
                    {orders.length} pedidos
                </Badge>
            </div>

            {/* Notification */}
            {notification && (
                <div className={`p-4 rounded-lg ${notification.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                    <div className="flex items-center gap-2">
                        {notification.type === 'success' ? (
                            <Check className="w-5 h-5" />
                        ) : (
                            <AlertCircle className="w-5 h-5" />
                        )}
                        <span>{notification.message}</span>
                    </div>
                </div>
            )}

            {/* Orders Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Lista de Pedidos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-gray-500">Cargando pedidos...</div>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <Package className="w-16 h-16 mb-4 text-gray-300" />
                            <p className="text-lg font-medium">No hay pedidos pendientes</p>
                            <p className="text-sm mt-1">Los pedidos nuevos aparecerán aquí</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Pedido</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Entrega</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell>
                                                <div className="font-medium">{order.order_number}</div>
                                                <div className="text-sm text-gray-500">{order.id.slice(0, 8)}...</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-gray-400" />
                                                    <div>
                                                        <div className="font-medium">{order.customer.full_name}</div>
                                                        <div className="text-sm text-gray-500">{order.customer.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    {formatDate(order.created_at)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    {order.requested_delivery_date ? (
                                                        <div>
                                                            <div className="font-medium">
                                                                {new Date(order.requested_delivery_date).toLocaleDateString('es-CO')}
                                                            </div>
                                                            {order.requested_delivery_time_slot && (
                                                                <div className="text-gray-500">{order.requested_delivery_time_slot}</div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500">No especificada</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{formatCurrency(order.total_amount)}</div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedOrder(order);
                                                            setShowMapDialog(true);
                                                        }}
                                                        disabled={!order.delivery_location}
                                                    >
                                                        <MapPin className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedOrder(order);
                                                            setShowRejectDialog(true);
                                                        }}
                                                        disabled={actionLoading}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        onClick={() => handleApprove(order.id)}
                                                        disabled={actionLoading}
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Map Dialog */}
            <Dialog open={showMapDialog} onOpenChange={setShowMapDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Ubicación de Entrega</DialogTitle>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span className="font-medium">{selectedOrder.customer.full_name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <MapPin className="w-4 h-4" />
                                    <span>{selectedOrder.delivery_address_text}</span>
                                </div>
                            </div>
                            <div className="h-80 rounded-lg overflow-hidden border">
                                {getMapPosition(selectedOrder.delivery_location) ? (
                                    <MapContainer
                                        center={getMapPosition(selectedOrder.delivery_location)!}
                                        zoom={15}
                                        style={{ height: '100%', width: '100%' }}
                                    >
                                        <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                        <Marker position={getMapPosition(selectedOrder.delivery_location)!}>
                                            <Popup>
                                                <div className="text-sm">
                                                    <div className="font-medium">{selectedOrder.customer.full_name}</div>
                                                    <div className="text-gray-600">{selectedOrder.delivery_address_text}</div>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    </MapContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full bg-gray-100 text-gray-500">
                                        Ubicación no disponible
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rechazar Pedido</DialogTitle>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="space-y-4">
                            <div className="text-sm text-gray-600">
                                ¿Estás seguro de que deseas rechazar el pedido <strong>{selectedOrder.order_number}</strong>?
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reject-reason">Motivo del rechazo (opcional)</Label>
                                <Textarea
                                    id="reject-reason"
                                    placeholder="Describe el motivo del rechazo..."
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowRejectDialog(false);
                                setRejectReason('');
                                setSelectedOrder(null);
                            }}
                            disabled={actionLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={actionLoading}
                        >
                            {actionLoading ? 'Rechazando...' : 'Rechazar Pedido'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

