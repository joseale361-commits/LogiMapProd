"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { MapPin, Truck, Plus, Check, AlertCircle, Calendar, Package, History, LayoutList } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import dynamic from 'next/dynamic';

// Use local RoutesMap component that properly renders order markers with location_json
const RoutesMap = dynamic(() => import('./RoutesMap'), {
    ssr: false,
    loading: () => <div className="h-96 bg-gray-100 animate-pulse">Cargando mapa...</div>
});

import { createRouteAction } from '@/lib/actions/routes';
import { getActiveRoutes } from '@/lib/queries/routes-client';

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
    address: string;
    location_json: {
        type: string;
        coordinates: [number, number];
    } | null;
    delivery_type: string;
    lat: number | null;
    lng: number | null;
    requested_delivery_date: string | null;
    requested_delivery_time_slot: string | null;
}

interface Driver {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    status: string;
}

interface PageProps { }

export default function RoutesPage() {
    const params = useParams();
    const slug = params?.slug as string;
    const router = useRouter();

    const [orders, setOrders] = useState<Order[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [routes, setRoutes] = useState<any[]>([]);
    const [activeRoutes, setActiveRoutes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
    const [showCreateRouteDialog, setShowCreateRouteDialog] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<string>('');
    const [plannedDate, setPlannedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [routeNotes, setRouteNotes] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [mapCenter] = useState<[number, number] | null>(null);
    const [historyDateFilter, setHistoryDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);
    const [showAllHistory, setShowAllHistory] = useState(false);
    const [warehouseLocation, setWarehouseLocation] = useState<[number, number] | null>(null);
    const [finishingRouteId, setFinishingRouteId] = useState<string | null>(null);

    useEffect(() => {
        if (slug) {
            fetchData(slug);
        }
    }, [slug]);

    const fetchData = async (distributorSlug: string) => {
        try {
            console.log('[RoutesPage] Fetching data directly from DB for slug:', distributorSlug);
            setLoading(true);

            // Use browser client for Client Component
            const supabase = createBrowserClient();

            // 1. FETCH DISTRIBUTOR
            console.log('[RoutesPage] Fetching distributor from DB...');
            const { data: distributor, error: distributorError } = await (supabase
                .from('distributors')
                .select('id, slug, location')
                .eq('slug', distributorSlug)
                .single() as any);

            if (distributorError) {
                console.error('[RoutesPage] Distributor Error:', distributorError);
                throw new Error('Error al cargar distribuidor');
            }
            console.log('[RoutesPage] Distributor DB:', distributor);

            if (!distributor) {
                console.error('[RoutesPage] No distributor found for slug:', distributorSlug);
                throw new Error('Distribuidor no encontrado');
            }

            // 2. FETCH ORDERS from VIEW v_orders_with_geojson (APPROVED ONLY)
            console.log('[RoutesPage] Fetching orders from v_orders_with_geojson view...');
            const { data: ordersData, error: ordersError } = await supabase
                .from('v_orders_with_geojson' as any)
                .select('*', { count: 'exact', head: false })
                .eq('distributor_id', distributor.id)
                .eq('status', 'approved');

            if (ordersError) {
                console.error('[RoutesPage] Orders Error:', ordersError);
                throw new Error('Error al cargar pedidos');
            }

            console.log('[RoutesPage] Orders View Count:', ordersData?.length);
            console.log('[RoutesPage] Orders Data Sample:', ordersData?.[0]);

            // Process orders data
            const processedOrders: Order[] = (ordersData || []).map((o: any) => ({
                id: o.id,
                order_number: o.order_number,
                status: o.status,
                total_amount: o.total_amount,
                created_at: o.created_at,
                customer: {
                    full_name: o.customer?.full_name || o.customer_name || 'Desconocido',
                    email: o.customer?.email || o.customer_email || '',
                    phone: o.customer?.phone || o.customer_phone || null
                },
                address: o.address || o.delivery_address_snapshot?.street_address || 'Sin dirección',
                location_json: o.location_json || null,
                delivery_type: o.delivery_type || 'delivery',
                lat: null,
                lng: null,
                requested_delivery_date: o.requested_delivery_date || null,
                requested_delivery_time_slot: o.requested_delivery_time_slot || null
            }));

            setOrders(processedOrders);

            // 3. FETCH DRIVERS (include both driver and staff roles)
            console.log('[RoutesPage] Fetching drivers...');
            const { data: userRoles, error: rolesError } = await supabase
                .from('distributor_users')
                .select('user_id, role')
                .eq('distributor_id', distributor.id)
                .in('role', ['driver', 'staff'])
                .eq('is_active', true);

            if (rolesError) {
                console.error('[RoutesPage] Drivers Error:', rolesError);
            }

            console.log('[RoutesPage] User roles found:', userRoles);

            let drivers: Driver[] = [];
            if (userRoles && userRoles.length > 0) {
                const userIds = userRoles.map(ur => ur.user_id);
                const { data: profiles, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, full_name, email, phone')
                    .in('id', userIds);

                if (!profilesError && profiles) {
                    console.log('[RoutesPage] Profiles fetched:', profiles);
                    drivers = profiles.map(p => ({
                        id: p.id,
                        full_name: p.full_name || p.email || 'Unknown',
                        email: p.email,
                        phone: p.phone,
                        status: 'active'
                    }));
                } else if (profilesError) {
                    console.error('[RoutesPage] Profiles Error:', profilesError);
                }
            }
            setDrivers(drivers);
            console.log('[RoutesPage] Set drivers count:', drivers.length);

            // 4. FETCH ROUTES
            console.log('[RoutesPage] Fetching routes...');
            const { data: routesData, error: routesError } = await supabase
                .from('routes')
                .select(`
                    *,
                    driver:profiles!routes_driver_id_fkey (full_name, phone),
                    stops:route_stops (id)
                `)
                .eq('distributor_id', distributor.id)
                .order('created_at', { ascending: false });

            if (routesError) {
                console.error('[RoutesPage] Routes Error:', routesError);
            }

            const processedRoutes = (routesData || []).map((r: any) => ({
                ...r,
                completed_stops: r.stops?.filter((s: any) => s.status === 'completed').length || 0,
                total_stops: r.stops?.length || 0
            }));
            setRoutes(processedRoutes);

            // 4b. FETCH ACTIVE ROUTES (for dedicated section)
            console.log('[RoutesPage] Fetching active routes...');
            const activeRoutesData = await getActiveRoutes(distributor.id);
            setActiveRoutes(activeRoutesData);

            // 5. SET WAREHOUSE LOCATION
            if (distributor.location) {
                let warehouseLat: number | null = null;
                let warehouseLng: number | null = null;

                const loc = distributor.location;
                // Handle WKT POINT format: POINT(lng lat)
                const coords = typeof loc === 'string' ? loc.match(/POINT\(([\d.-]+)\s+([\d.-]+)\)/) : null;
                if (coords) {
                    warehouseLng = parseFloat(coords[1]);
                    warehouseLat = parseFloat(coords[2]);
                }

                if (warehouseLat !== null && warehouseLng !== null &&
                    !isNaN(warehouseLat) && !isNaN(warehouseLng) &&
                    warehouseLat >= -90 && warehouseLat <= 90 &&
                    warehouseLng >= -180 && warehouseLng <= 180) {
                    setWarehouseLocation([warehouseLat, warehouseLng]);
                    console.log('[RoutesPage] Warehouse location set:', [warehouseLat, warehouseLng]);
                } else {
                    console.warn('[RoutesPage] Invalid warehouse location format');
                    setWarehouseLocation(null);
                }
            }

        } catch (error: any) {
            console.error('[RoutesPage] Catch Error:', error);
            showNotification('error', error.message || 'Error al cargar datos');
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

    const handleFinishRoute = async (routeId: string) => {
        if (!confirm('¿Estás seguro de que deseas finalizar esta ruta? Los pedidos no entregados volverá al pool.')) {
            return;
        }

        try {
            setFinishingRouteId(routeId);
            const response = await fetch(`/api/dashboard/${slug}/routes/${routeId}/finish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await response.json();

            if (result.success) {
                showNotification('success', 'Ruta finalizada exitosamente');
                fetchData(slug); // Refresh data
            } else {
                showNotification('error', result.error || 'Error al finalizar ruta');
            }
        } catch (error: any) {
            console.error('[handleFinishRoute] Error:', error);
            showNotification('error', 'Error al finalizar ruta');
        } finally {
            setFinishingRouteId(null);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
        }).format(amount);
    };

    const getMapPosition = (order: Order): [number, number] | null => {
        // Safety check: if order is null/undefined, return null
        if (!order) return null;

        // Try location_json first (from new v_orders_with_geojson view)
        if (order.location_json?.coordinates && Array.isArray(order.location_json.coordinates)) {
            const [lng, lat] = order.location_json.coordinates;
            if (!isNaN(lat) && !isNaN(lng)) {
                // SWAP: DB/GeoJSON provides [lng, lat], Leaflet needs [lat, lng]
                return [lat, lng];
            }
        }

        // Fallback: Use direct lat/lng if available (from generated columns)
        if (order.lat !== null && order.lat !== undefined && order.lng !== null && order.lng !== undefined) {
            if (!isNaN(order.lat) && !isNaN(order.lng)) {
                return [order.lat, order.lng];
            }
        }

        return null;
    };

    const getMapCenter = (): [number, number] => {
        const validPositions = orders
            .map((o) => getMapPosition(o))
            .filter((p): p is [number, number] => p !== null);

        if (validPositions.length === 0) {
            return [4.711, -74.072]; // Default to Bogotá
        }

        const avgLat = validPositions.reduce((sum, p) => sum + p[0], 0) / validPositions.length;
        const avgLng = validPositions.reduce((sum, p) => sum + p[1], 0) / validPositions.length;

        return [avgLat, avgLng];
    };

    const historyRoutes = routes.filter(r => r.status === 'completed');

    // Filter history by date (default: today)
    const filteredHistoryRoutes = showAllHistory
        ? historyRoutes
        : historyRoutes.filter(r => r.planned_date === historyDateFilter);

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Planificador de Rutas</h1>
                    <p className="text-gray-600 mt-1">
                        Crea y asigna rutas a los choferes
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/dashboard/${slug}/routes/active`)}
                        className="gap-2 min-h-[44px] w-full sm:w-auto"
                    >
                        <Truck className="w-4 h-4" />
                        Ver Rutas Activas -&gt;
                    </Button>
                    <Button
                        onClick={() => setShowCreateRouteDialog(true)}
                        disabled={selectedOrders.size === 0 || loading}
                        className="gap-2 min-h-[44px] bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                    >
                        <Plus className="w-4 h-4" />
                        Crear Ruta ({selectedOrders.size})
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

            {/* RUTAS EN CURSO - Active Routes Section */}
            {activeRoutes.length > 0 && (
                <Card className="border-blue-200 bg-blue-50/50">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-blue-800">
                            <Truck className="w-5 h-5" />
                            Rutas en Curso
                            <Badge variant="secondary" className="ml-2">{activeRoutes.length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeRoutes.map(route => (
                                <Card key={route.id} className="cursor-pointer hover:border-blue-400 transition-colors bg-white">
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="font-bold text-gray-900">{route.route_number}</div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(route.created_at).toLocaleDateString('es-CO')}
                                                </div>
                                            </div>
                                            <Badge className={
                                                route.status === 'active' ? 'bg-green-100 text-green-800' :
                                                    route.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-gray-100 text-gray-800'
                                            }>
                                                {route.status === 'active' ? 'En Curso' : route.status}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-gray-600 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">Chofer:</span>
                                                <span>{route.driver?.full_name || 'Sin Asignar'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">Paradas:</span>
                                                <span>{route.completed_stops} / {route.total_stops} completadas</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                <span>{route.planned_date}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 gap-2 min-h-[44px]"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/dashboard/${slug}/routes/${route.id}`);
                                                }}
                                            >
                                                Ver Detalles
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="flex-1 gap-2 min-h-[44px] bg-green-600 hover:bg-green-700"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleFinishRoute(route.id);
                                                }}
                                                disabled={finishingRouteId === route.id}
                                            >
                                                {finishingRouteId === route.id ? (
                                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <Check className="w-4 h-4" />
                                                )}
                                                Finalizar
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Main Content Tabs */}
            <Tabs defaultValue="active" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="active" className="flex items-center gap-2">
                        <LayoutList className="w-4 h-4" />
                        Tablero Activo
                        <Badge variant="secondary" className="ml-1 text-xs">{activeRoutes.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-2">
                        <History className="w-4 h-4" />
                        Historial
                        <Badge variant="secondary" className="ml-1 text-xs">{showAllHistory ? historyRoutes.length : filteredHistoryRoutes.length}</Badge>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-6">
                    {/* Active Routes Cards */}
                    {activeRoutes.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeRoutes.map(route => (
                                <Card key={route.id} className="cursor-pointer hover:border-blue-300 transition-colors" onClick={() => router.push(`/dashboard/${slug}/routes/${route.id}`)}>
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-bold text-gray-900">{route.route_number}</div>
                                            <Badge className={route.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                                                {route.status}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-gray-600 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Truck className="w-4 h-4" />
                                                <span>{route.driver?.full_name || 'Sin Chofer'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                <span>{route.planned_date}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Check className="w-4 h-4" />
                                                <span>{route.completed_stops} / {route.total_stops} Completados</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Map */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPin className="w-5 h-5" />
                                        Mapa de Pedidos Pendientes
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
                                            <p className="text-lg font-medium">No hay pedidos pendientes</p>
                                        </div>
                                    ) : (
                                        <RoutesMap
                                            orders={orders}
                                            center={getMapCenter()}
                                            mapCenter={mapCenter}
                                            selectedOrders={Array.from(selectedOrders)}
                                            warehouseLocation={warehouseLocation}
                                            onOrderSelect={handleOrderSelect}
                                            formatCurrency={formatCurrency}
                                            mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
                                            key={Array.from(selectedOrders).join(',')}
                                        />
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Side Panel (Drivers & Orders) */}
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
                                                    className={`flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer ${selectedDriver === driver.id ? 'border-blue-500 bg-blue-50' : ''}`}
                                                    onClick={() => setSelectedDriver(driver.id)}
                                                >
                                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <span className="text-sm font-medium text-blue-600">
                                                            {(driver.full_name || driver.email || '?').charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium truncate">{driver.full_name || driver.email || 'Unknown'}</div>
                                                        <div className="text-sm text-gray-500 truncate">{driver.status}</div>
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
                                            className="min-h-[44px]"
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
                                            No hay pedidos pendientes
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                                            {orders.map((order) => (
                                                <div
                                                    key={order.id}
                                                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedOrders.has(order.id) ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                                                        }`}
                                                    onClick={() => handleOrderSelect(order.id)}
                                                >
                                                    <Checkbox
                                                        checked={selectedOrders.has(order.id)}
                                                        onCheckedChange={() => handleOrderSelect(order.id)}
                                                        className="mt-1"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-sm">{order.order_number}</span>
                                                            <Badge variant="outline" className="text-xs">
                                                                {formatCurrency(order.total_amount)}
                                                            </Badge>
                                                        </div>
                                                        <div className="text-sm text-gray-600 mt-1 truncate">{order.customer.full_name}</div>
                                                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" />
                                                            <span className="truncate">{order.address}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <CardTitle>Historial de Rutas Finalizadas</CardTitle>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="history-date" className="text-sm">Filtrar por fecha:</Label>
                                        <Input
                                            id="history-date"
                                            type="date"
                                            value={historyDateFilter}
                                            onChange={(e) => {
                                                setHistoryDateFilter(e.target.value);
                                                setShowAllHistory(false);
                                            }}
                                            className="w-40"
                                        />
                                    </div>
                                    <Button
                                        variant={showAllHistory ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setShowAllHistory(!showAllHistory)}
                                    >
                                        {showAllHistory ? 'Ver fecha específica' : 'Ver todo'}
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="px-4 py-2">Ruta #</th>
                                            <th className="px-4 py-2">Fecha Planificada</th>
                                            <th className="px-4 py-2">Fecha Finalización</th>
                                            <th className="px-4 py-2">Chofer</th>
                                            <th className="px-4 py-2">Progreso</th>
                                            <th className="px-4 py-2 text-right">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredHistoryRoutes.map((route) => (
                                            <tr key={route.id} className="border-b hover:bg-gray-50">
                                                <td className="px-4 py-2 font-medium">{route.route_number}</td>
                                                <td className="px-4 py-2">{route.planned_date}</td>
                                                <td className="px-4 py-2 text-gray-500">
                                                    {route.finished_at ? new Date(route.finished_at).toLocaleString('es-CO') : '-'}
                                                </td>
                                                <td className="px-4 py-2">{route.driver?.full_name || 'N/A'}</td>
                                                <td className="px-4 py-2">
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                        {route.completed_stops}/{route.total_stops}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <a href={`/dashboard/${slug}/routes/${route.id}`}>
                                                            Ver Liquidación
                                                        </a>
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredHistoryRoutes.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="text-center py-8 text-gray-500">
                                                    {showAllHistory
                                                        ? 'No hay historial de rutas finalizadas.'
                                                        : `No hay rutas finalizadas para el ${new Date(historyDateFilter).toLocaleDateString('es-CO')}.`}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

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
                                {drivers.find((d) => d.id === selectedDriver)?.full_name || drivers.find((d) => d.id === selectedDriver)?.email || 'No seleccionado'}
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
                            className="min-h-[44px]"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCreateRoute}
                            disabled={actionLoading || !selectedDriver}
                            className="min-h-[44px] bg-blue-600 hover:bg-blue-700"
                        >
                            {actionLoading ? 'Creando...' : 'Crear Ruta'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
