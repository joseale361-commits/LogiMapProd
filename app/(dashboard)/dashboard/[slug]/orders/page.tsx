"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Check, X, MapPin, Clock, User, Package, AlertCircle, Store, MessageCircle, Eye } from 'lucide-react';
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
    delivery_type: 'delivery' | 'pickup';
    pickup_time: string | null;
    payment_method: string;
    invoice_number: string | null;
}

interface PageProps { }

export default function OrdersPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug as string;
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showMapDialog, setShowMapDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false);
    const [whatsAppLink, setWhatsAppLink] = useState('');
    const [rejectReason, setRejectReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [viewFilter, setViewFilter] = useState<'pending' | 'pickup'>('pending');
    const [invoiceNumbers, setInvoiceNumbers] = useState<Record<string, string>>({});

    useEffect(() => {
        if (slug) {
            fetchOrders(slug);
        }
    }, [slug]);

    const fetchOrders = async (distributorSlug: string) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/dashboard/${distributorSlug}/orders`);
            const data = await response.json();

            console.log('Orders Fetched:', data);

            if (data.success) {
                console.log('Orders Data:', data.orders);
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
        const invoiceNumber = invoiceNumbers[orderId]?.trim();

        // Validate invoice number is required
        if (!invoiceNumber) {
            showNotification('error', 'Por favor ingrese el número de factura/ticket antes de aprobar');
            return;
        }

        try {
            setActionLoading(true);
            const response = await fetch(`/api/dashboard/${slug}/orders/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, invoiceNumber }),
            });
            const data = await response.json();

            if (data.success) {
                // Clear the invoice number from state after approval
                setInvoiceNumbers(prev => {
                    const updated = { ...prev };
                    delete updated[orderId];
                    return updated;
                });

                // Find the approved order to show WhatsApp notification
                const approvedOrder = orders.find(o => o.id === orderId);
                if (approvedOrder && approvedOrder.customer.phone) {
                    const message = `Hola ${approvedOrder.customer.full_name}, tu pedido #${approvedOrder.order_number} ha sido aprobado y llegará pronto. Total: ${approvedOrder.total_amount.toLocaleString()}`;
                    const phone = approvedOrder.customer.phone.replace(/\D/g, '');
                    const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                    setWhatsAppLink(waLink);
                    setShowWhatsAppDialog(true);
                } else {
                    showNotification('success', 'Pedido aprobado exitosamente');
                }
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

    const handleMarkReady = async (orderId: string) => {
        try {
            setActionLoading(true);
            const response = await fetch(`/api/dashboard/${slug}/orders/ready`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId }),
            });
            const data = await response.json();

            if (data.success) {
                showNotification('success', 'Pedido marcado como listo para retirar');
                fetchOrders(slug);
            } else {
                showNotification('error', data.error || 'Error al marcar pedido como listo');
            }
        } catch (error) {
            console.error('Error marking as ready:', error);
            showNotification('error', 'Error al marcar pedido como listo');
        } finally {
            setActionLoading(false);
        }
    };

    const handleMarkDelivered = async (orderId: string) => {
        try {
            setActionLoading(true);
            const response = await fetch(`/api/dashboard/${slug}/orders/deliver`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId }),
            });
            const data = await response.json();

            if (data.success) {
                showNotification('success', 'Pedido marcado como entregado');
                fetchOrders(slug);
            } else {
                showNotification('error', data.error || 'Error al marcar pedido como entregado');
            }
        } catch (error) {
            console.error('Error marking as delivered:', error);
            showNotification('error', 'Error al marcar pedido como entregado');
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

    const filteredOrders = orders.filter(order => {
        console.log('Filtering order:', order.status, order.delivery_type);
        if (viewFilter === 'pending') {
            return order.status === 'pending'; // Fixed: was 'pending_approval'
        } else {
            return order.delivery_type === 'pickup' && order.status === 'approved';
        }
    });

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
                <div className="flex gap-2">
                    <Button
                        variant={viewFilter === 'pending' ? 'default' : 'outline'}
                        onClick={() => setViewFilter('pending')}
                        className="gap-2"
                    >
                        <AlertCircle className="w-4 h-4" />
                        Pendientes
                        <Badge variant="secondary" className="ml-1 bg-white/20">
                            {orders.filter(o => o.status === 'pending').length}
                        </Badge>
                    </Button>
                    <Button
                        variant={viewFilter === 'pickup' ? 'default' : 'outline'}
                        onClick={() => setViewFilter('pickup')}
                        className="gap-2"
                    >
                        <Store className="w-4 h-4" />
                        🏪 Retiro en Bodega
                        <Badge variant="secondary" className="ml-1 bg-white/20">
                            {orders.filter(o => o.delivery_type === 'pickup' && o.status === 'approved').length}
                        </Badge>
                    </Button>
                </div>
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

            {/* Orders Table - Desktop */}
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
                    ) : filteredOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <Package className="w-16 h-16 mb-4 text-gray-300" />
                            <p className="text-lg font-medium">No hay pedidos en esta sección</p>
                            <p className="text-sm mt-1">Los pedidos aparecerán aquí según su tipo y estado</p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-4">
                                {filteredOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        className={`bg-white border rounded-lg p-4 shadow-sm ${order.delivery_type === 'pickup' ? 'border-l-4 border-l-amber-400 bg-amber-50/30' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="font-bold text-gray-900">{order.order_number}</div>
                                                <div className="text-sm text-gray-500">{order.id.slice(0, 8)}...</div>
                                            </div>
                                            {order.delivery_type === 'pickup' && (
                                                <Badge className="bg-amber-100 text-amber-800 text-xs">
                                                    <Store className="w-3 h-3 mr-1" /> RETIRO
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="space-y-2 mb-3">
                                            <div className="flex items-center gap-2 text-sm">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <span className="font-medium text-gray-900">{order.customer.full_name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                <span>{formatDate(order.created_at)}</span>
                                            </div>
                                            <div className="text-sm font-bold text-gray-900">
                                                {formatCurrency(order.total_amount)}
                                            </div>
                                        </div>

                                        {/* Invoice Number Input - Only for pending orders */}
                                        {viewFilter === 'pending' && order.status === 'pending' && (
                                            <div className="mt-3">
                                                <Label htmlFor={`invoice-${order.id}`} className="text-xs text-gray-600 mb-1 block">
                                                    Número de Factura / POS
                                                </Label>
                                                <Input
                                                    id={`invoice-${order.id}`}
                                                    type="text"
                                                    placeholder="Ingrese número de factura"
                                                    value={invoiceNumbers[order.id] || ''}
                                                    onChange={(e) => setInvoiceNumbers(prev => ({ ...prev, [order.id]: e.target.value }))}
                                                    className="h-9 text-sm"
                                                />
                                            </div>
                                        )}

                                        {/* Mobile Action Buttons */}
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.push(`/dashboard/${slug}/orders/${order.id}`)}
                                                className="min-h-[44px] flex-1"
                                            >
                                                <Eye className="w-4 h-4 mr-1" />
                                                Ver
                                            </Button>
                                            {viewFilter === 'pending' ? (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedOrder(order);
                                                            setShowMapDialog(true);
                                                        }}
                                                        disabled={!order.delivery_location}
                                                        className="min-h-[44px] flex-1"
                                                    >
                                                        <MapPin className="w-4 h-4 mr-1" />
                                                        Mapa
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedOrder(order);
                                                            setShowRejectDialog(true);
                                                        }}
                                                        disabled={actionLoading}
                                                        className="min-h-[44px] flex-1"
                                                    >
                                                        <X className="w-4 h-4 mr-1" />
                                                        Rechazar
                                                    </Button>
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        onClick={() => {
                                                            if (order.delivery_type === 'pickup') {
                                                                handleMarkReady(order.id);
                                                            } else {
                                                                handleApprove(order.id);
                                                            }
                                                        }}
                                                        disabled={actionLoading}
                                                        className="min-h-[44px] flex-1 bg-blue-600 hover:bg-blue-700"
                                                    >
                                                        <Check className="w-4 h-4 mr-1" />
                                                        {order.delivery_type === 'pickup' ? 'Listo' : 'Aprobar'}
                                                    </Button>
                                                </>
                                            ) : (
                                                order.status === 'approved' && (
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        onClick={() => handleMarkDelivered(order.id)}
                                                        disabled={actionLoading}
                                                        className="min-h-[44px] w-full bg-green-600 hover:bg-green-700"
                                                    >
                                                        <Check className="w-4 h-4 mr-1" />
                                                        Entregado en Mostrador
                                                    </Button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Pedido</TableHead>
                                            <TableHead>Cliente</TableHead>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>{viewFilter === 'pickup' ? 'Hora de Retiro' : 'Entrega'}</TableHead>
                                            <TableHead>Total</TableHead>
                                            <TableHead>Factura</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredOrders.map((order) => (
                                            <TableRow
                                                key={order.id}
                                                className={order.delivery_type === 'pickup' ? 'bg-amber-50/30 border-l-4 border-l-amber-400' : ''}
                                            >
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
                                                        {order.delivery_type === 'pickup' ? (
                                                            <div className="flex flex-col">
                                                                <div className="font-bold text-amber-700 flex items-center gap-1">
                                                                    <Store className="w-3 h-3" /> RETIRO EN BODEGA
                                                                </div>
                                                                {order.pickup_time ? (
                                                                    <div className="font-medium">
                                                                        {new Date(order.pickup_time).toLocaleString('es-CO', {
                                                                            day: 'numeric',
                                                                            month: 'short',
                                                                            hour: '2-digit',
                                                                            minute: '2-digit'
                                                                        })}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-gray-500">Hora no definida</span>
                                                                )}
                                                            </div>
                                                        ) : order.requested_delivery_date ? (
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
                                                <TableCell>
                                                    {order.status === 'pending' ? (
                                                        <Input
                                                            id={`invoice-desktop-${order.id}`}
                                                            type="text"
                                                            placeholder="Factura #"
                                                            value={invoiceNumbers[order.id] || ''}
                                                            onChange={(e) => setInvoiceNumbers(prev => ({ ...prev, [order.id]: e.target.value }))}
                                                            className="h-8 w-28 text-sm"
                                                        />
                                                    ) : (
                                                        <span className="text-sm font-mono">
                                                            {order.invoice_number || '-'}
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => router.push(`/dashboard/${slug}/orders/${order.id}`)}
                                                            title="Ver detalles"
                                                            className="min-h-[44px]"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        {viewFilter === 'pending' ? (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setSelectedOrder(order);
                                                                        setShowMapDialog(true);
                                                                    }}
                                                                    disabled={!order.delivery_location}
                                                                    title="Ver en mapa"
                                                                    className="min-h-[44px]"
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
                                                                    title="Rechazar"
                                                                    className="min-h-[44px]"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="default"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        if (order.delivery_type === 'pickup') {
                                                                            handleMarkReady(order.id);
                                                                        } else {
                                                                            handleApprove(order.id);
                                                                        }
                                                                    }}
                                                                    disabled={actionLoading}
                                                                    title={order.delivery_type === 'pickup' ? "Marcar como Listo para Retirar" : "Aprobar"}
                                                                    className="min-h-[44px] bg-blue-600 hover:bg-blue-700"
                                                                >
                                                                    <Check className="w-4 h-4" />
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                {order.status === 'approved' && (
                                                                    <Button
                                                                        variant="default"
                                                                        size="sm"
                                                                        onClick={() => handleMarkDelivered(order.id)}
                                                                        disabled={actionLoading}
                                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                                    >
                                                                        Entregado en Mostrador
                                                                    </Button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </>
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

            {/* WhatsApp Notification Dialog */}
            <Dialog open={showWhatsAppDialog} onOpenChange={setShowWhatsAppDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageCircle className="w-5 h-5 text-green-600" />
                            Notificar al Cliente por WhatsApp
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            El pedido ha sido aprobado. ¿Deseas notificar al cliente ahora?
                        </p>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-sm text-green-800 font-medium">
                                Mensaje pre-llenado:
                            </p>
                            <p className="text-sm text-gray-700 mt-1">
                                {whatsAppLink ? decodeURIComponent(whatsAppLink.split('?text=')[1] || '') : ''}
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowWhatsAppDialog(false)}
                        >
                            Ahora no
                        </Button>
                        <Button
                            asChild
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <a
                                href={whatsAppLink}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Abrir WhatsApp
                            </a>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

