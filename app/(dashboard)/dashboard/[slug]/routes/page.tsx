"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { MapPin, Truck, Plus, Check, AlertCircle, Calendar, Package } from 'lucide-react';
import dynamic from 'next/dynamic';

const RoutesMap = dynamic(
    () => import('./RoutesMap'),
    {
        ssr: false,
        loading: () => <div className="h-96 bg-gray-100 flex items-center justify-center rounded-lg">Cargando mapa...</div>
    }
);

import { createRouteAction } from '@/lib/actions/routes';

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

interface Driver {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
}

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default function RoutesPage({ params }: PageProps) {
    const [slug, setSlug] = useState<string>('');
    const [orders, setOrders] = useState<Order[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
    const [showCreateRouteDialog, setShowCreateRouteDialog] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<string>('');
    const [plannedDate, setPlannedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [routeNotes, setRouteNotes] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

    useEffect(() => {
        params.then(({ slug }) => {
            setSlug(slug);
            fetchData(slug);
        });
    }, [params]);

    const fetchData = async (distributorSlug: string) => {
        try {
            console.log('[RoutesPage] Fetching data for slug:', distributorSlug);
            setLoading(true);

            const [ordersRes, driversRes] = await Promise.all([
                fetch(`/api/dashboard/${distributorSlug}/routes/orders`),
                fetch(`/api/dashboard/${distributorSlug}/routes/drivers`),
            ]);

            console.log('[RoutesPage] Orders Response Status:', ordersRes.status);
            console.log('[RoutesPage] Drivers Response Status:', driversRes.status);

            const ordersData = await ordersRes.json();
            const driversData = await driversRes.json();

            console.log('[RoutesPage] Orders Data Received:', ordersData);
            console.log('[RoutesPage] Drivers Data Received:', driversData);

            if (ordersData.success) {
                setOrders(ordersData.orders);
                console.log('[RoutesPage] Set orders count:', ordersData.orders?.length);
            } else {
                console.error('[RoutesPage] Orders Error:', ordersData.error);
                showNotification('error', ordersData.error || 'Error al cargar pedidos');
            }

            if (driversData.success) {
                setDrivers(driversData.drivers);
                console.log('[RoutesPage] Set drivers count:', driversData.drivers?.length);
            } else {
                console.error('[RoutesPage] Drivers Error:', driversData.error);
                showNotification('error', driversData.error || 'Error al cargar choferes');
            }
        } catch (error) {
            console.error('[RoutesPage] Catch Error:', error);
            showNotification('error', 'Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    const handleOrderSelect = (orderId: string) => {
        setSelectedOrders((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(orderId)) {
                newSet.delete(orderId);
            } else {
                newSet.add(orderId);
                // Fly to order location when selected
                const order = orders.find(o => o.id === orderId);
                if (order) {
                    const pos = getMapPosition(order.delivery_location);
                    if (pos) setMapCenter(pos);
                }
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (selectedOrders.size === orders.length) {
            setSelectedOrders(new Set());
        } else {
            setSelectedOrders(new Set(orders.map((o) => o.id)));
        }
    };

    const handleCreateRoute = async () => {
        console.log('[handleCreateRoute] Iniciando creación de ruta...', {
            driverId: selectedDriver,
            orderIds: Array.from(selectedOrders),
            plannedDate
        });

        if (selectedOrders.size === 0) {
            showNotification('error', 'Selecciona al menos un pedido');
            return;
        }

        if (!selectedDriver) {
            showNotification('error', 'Selecciona un chofer');
            return;
        }

        try {
            setActionLoading(true);
            const result = await createRouteAction(
                slug,
                selectedDriver,
                Array.from(selectedOrders),
                plannedDate,
                routeNotes
            );

            console.log('Respuesta:', result);

            if (result.success) {
                console.log('[handleCreateRoute] Éxito: Cerrando modal y reseteando estado');
                showNotification('success', 'Ruta creada exitosamente');
                setShowCreateRouteDialog(false);
                setSelectedOrders(new Set());
                setSelectedDriver('');
                setRouteNotes('');
                fetchData(slug);
            } else {
                console.error('[handleCreateRoute] Error en respuesta:', result.error);
                alert(`Error al crear ruta: ${result.error || 'Error desconocido'}`);
                showNotification('error', result.error || 'Error al crear ruta');
            }
        } catch (error: any) {
            console.error('[handleCreateRoute] Catch Error:', error);
            alert(`Error inesperado: ${error.message || 'Error desconocido'}`);
            showNotification('error', 'Error al crear ruta');
        } finally {
            setActionLoading(false);
        }
    };

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
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

    const getMapCenter = (): [number, number] => {
        const validPositions = orders
            .map((o) => getMapPosition(o.delivery_location))
            .filter((p): p is [number, number] => p !== null);

        if (validPositions.length === 0) {
            return [4.711, -74.072]; // Default to Bogotá
        }

        const avgLat = validPositions.reduce((sum, p) => sum + p[0], 0) / validPositions.length;
        const avgLng = validPositions.reduce((sum, p) => sum + p[1], 0) / validPositions.length;

        return [avgLat, avgLng];
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Planificador de Rutas</h1>
                    <p className="text-gray-600 mt-1">
                        Crea y asigna rutas a los choferes
                    </p>
                </div>
                <Button
                    onClick={() => setShowCreateRouteDialog(true)}
                    disabled={selectedOrders.size === 0 || loading}
                    className="gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Crear Ruta ({selectedOrders.size})
                </Button>
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

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Map */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="w-5 h-5" />
                                Mapa de Pedidos Aprobados
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center h-96">
                                    <div className="text-gray-500">Cargando mapa...</div>
                                </div>
                            ) : orders.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                                    <MapPin className="w-16 h-16 mb-4 text-gray-300" />
                                    <p className="text-lg font-medium">No hay pedidos aprobados</p>
                                    <p className="text-sm mt-1">Los pedidos aprobados aparecerán en el mapa</p>
                                </div>
                            ) : (
                                <RoutesMap
                                    orders={orders}
                                    center={getMapCenter()}
                                    mapCenter={mapCenter}
                                    onOrderSelect={handleOrderSelect}
                                    getMapPosition={getMapPosition}
                                    formatCurrency={formatCurrency}
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Side Panel */}
                <div className="space-y-6">
                    {/* Drivers */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Truck className="w-5 h-5" />
                                Choferes Disponibles
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-gray-500 text-center py-4">Cargando...</div>
                            ) : drivers.length === 0 ? (
                                <div className="text-gray-500 text-center py-4">
                                    No hay choferes disponibles
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {drivers.map((driver) => (
                                        <div
                                            key={driver.id}
                                            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                                            onClick={() => setSelectedDriver(driver.id)}
                                        >
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                <span className="text-sm font-medium text-blue-600">
                                                    {driver.full_name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">{driver.full_name}</div>
                                                <div className="text-sm text-gray-500 truncate">{driver.email}</div>
                                            </div>
                                            {selectedDriver === driver.id && (
                                                <Check className="w-5 h-5 text-green-600" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Orders List */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="w-5 h-5" />
                                    Pedidos ({orders.length})
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleSelectAll}
                                    disabled={orders.length === 0}
                                >
                                    {selectedOrders.size === orders.length ? 'Deseleccionar' : 'Seleccionar'}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-gray-500 text-center py-4">Cargando...</div>
                            ) : orders.length === 0 ? (
                                <div className="text-gray-500 text-center py-4">
                                    No hay pedidos aprobados
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {orders.map((order) => (
                                        <div
                                            key={order.id}
                                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedOrders.has(order.id) ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                                                }`}
                                            onClick={() => handleOrderSelect(order.id)}
                                        >
                                            <Checkbox
                                                checked={selectedOrders.has(order.id)}
                                                onChange={() => handleOrderSelect(order.id)}
                                                className="mt-1"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{order.order_number}</span>
                                                    <Badge variant="outline" className="text-xs">
                                                        {formatCurrency(order.total_amount)}
                                                    </Badge>
                                                </div>
                                                <div className="text-sm text-gray-600 mt-1">{order.customer.full_name}</div>
                                                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {order.delivery_address_text}
                                                </div>
                                                {order.requested_delivery_date && (
                                                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(order.requested_delivery_date).toLocaleDateString('es-CO')}
                                                        {order.requested_delivery_time_slot && ` - ${order.requested_delivery_time_slot}`}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Create Route Dialog */}
            <Dialog open={showCreateRouteDialog} onOpenChange={setShowCreateRouteDialog}>
                <DialogContent className="max-w-md z-[9999] bg-white border shadow-2xl">
                    <DialogHeader>
                        <DialogTitle>Crear Nueva Ruta</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Chofer Asignado</Label>
                            <div className="text-sm font-medium">
                                {drivers.find((d) => d.id === selectedDriver)?.full_name || 'No seleccionado'}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Pedidos Seleccionados</Label>
                            <div className="text-sm font-medium">{selectedOrders.size} pedidos</div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="planned-date">Fecha Planificada</Label>
                            <Input
                                id="planned-date"
                                type="date"
                                value={plannedDate}
                                onChange={(e) => setPlannedDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="route-notes">Notas (opcional)</Label>
                            <Textarea
                                id="route-notes"
                                placeholder="Instrucciones especiales para el chofer..."
                                value={routeNotes}
                                onChange={(e) => setRouteNotes(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowCreateRouteDialog(false)}
                            disabled={actionLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCreateRoute}
                            disabled={actionLoading || !selectedDriver}
                        >
                            {actionLoading ? 'Creando...' : 'Crear Ruta'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
