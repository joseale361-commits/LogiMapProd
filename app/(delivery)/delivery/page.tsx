'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/supabase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Truck,
    MapPin,
    CheckCircle2,
    Clock,
    Package,
    ArrowRight
} from 'lucide-react';

type Route = Database['public']['Tables']['routes']['Row'];
type RouteStop = Database['public']['Tables']['route_stops']['Row'];

interface RouteWithStops extends Route {
    route_stops: RouteStop[];
}

export default function DeliveryHomePage() {
    const [routes, setRoutes] = useState<RouteWithStops[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<{ id: string; full_name: string } | null>(null);
    const [stats, setStats] = useState({
        activeRoutes: 0,
        pendingStops: 0,
        completedToday: 0,
        totalDistance: 0
    });
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        fetchUserAndData();
    }, []);

    async function fetchUserAndData() {
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) {
                router.push('/login');
                return;
            }

            setUser({ id: authUser.id, full_name: authUser.user_metadata?.full_name || 'Chofer' });

            const { data: routesData, error } = await supabase
                .from('routes')
                .select(`
                    *,
                    route_stops (*)
                `)
                .eq('driver_id', authUser.id)
                .in('status', ['planned', 'in_progress'])
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRoutes(routesData || []);

            // Calculate stats
            if (routesData) {
                const activeRoutes = routesData.filter(r => r.status === 'in_progress').length;
                const pendingStops = routesData.reduce((acc, r) =>
                    acc + r.route_stops.filter(s => s.status === 'pending').length, 0);
                const completedToday = routesData.reduce((acc, r) =>
                    acc + r.route_stops.filter(s =>
                        s.status === 'delivered' &&
                        s.delivered_at &&
                        new Date(s.delivered_at).toDateString() === new Date().toDateString()
                    ).length, 0);
                const totalDistance = routesData.reduce((acc, r) =>
                    acc + (r.total_distance_km || 0), 0);

                setStats({
                    activeRoutes,
                    pendingStops,
                    completedToday,
                    totalDistance
                });
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }

    function getStatusBadge(status: string) {
        switch (status) {
            case 'planned':
                return <Badge variant="secondary">Planificada</Badge>;
            case 'in_progress':
                return <Badge className="bg-green-500">En Progreso</Badge>;
            case 'completed':
                return <Badge className="bg-blue-500">Completada</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    }

    function getCompletedStops(route: RouteWithStops) {
        return route.route_stops.filter(stop => stop.status === 'delivered').length;
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Cargando...</p>
                </div>
            </div>
        );
    }

    const activeRoute = routes.find(r => r.status === 'in_progress');

    return (
        <div className="min-h-screen bg-gray-900 pb-20">
            {/* Header */}
            <div className="px-4 py-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                    ¡Hola, {user?.full_name}! 👋
                </h2>
                <p className="text-gray-400">
                    {activeRoute ? 'Tienes una ruta en progreso' : 'Sin rutas activas'}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="px-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-gray-800 border-gray-700">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-900/30 rounded-lg">
                                    <Truck className="h-5 w-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{stats.activeRoutes}</p>
                                    <p className="text-xs text-gray-400">Rutas Activas</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-800 border-gray-700">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-900/30 rounded-lg">
                                    <Clock className="h-5 w-5 text-yellow-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{stats.pendingStops}</p>
                                    <p className="text-xs text-gray-400">Pendientes</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-800 border-gray-700">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-900/30 rounded-lg">
                                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{stats.completedToday}</p>
                                    <p className="text-xs text-gray-400">Hoy</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-800 border-gray-700">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-900/30 rounded-lg">
                                    <MapPin className="h-5 w-5 text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">
                                        {stats.totalDistance.toFixed(0)}
                                    </p>
                                    <p className="text-xs text-gray-400">km Recorridos</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Active Route Card */}
            {activeRoute && (
                <div className="px-4 mb-6">
                    <Card className="bg-gradient-to-br from-green-900/40 to-gray-800 border-green-700 overflow-hidden">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg text-white">
                                    Ruta en Progreso
                                </CardTitle>
                                <Badge className="bg-green-500">Activa</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Ruta #{activeRoute.route_number}</span>
                                <span className="text-white font-semibold">
                                    {getCompletedStops(activeRoute)}/{activeRoute.total_stops || activeRoute.route_stops.length} entregas
                                </span>
                            </div>

                            <div className="w-full bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                    style={{
                                        width: `${(getCompletedStops(activeRoute) / (activeRoute.total_stops || activeRoute.route_stops.length)) * 100}%`
                                    }}
                                />
                            </div>

                            <Button
                                onClick={() => router.push(`/delivery/routes/${activeRoute.id}`)}
                                className="w-full h-12 bg-green-600 hover:bg-green-700"
                            >
                                <Package className="h-5 w-5 mr-2" />
                                Ver Paradas
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Planned Routes */}
            {routes.some(r => r.status === 'planned') && (
                <div className="px-4 mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-gray-400" />
                        Próximas Rutas
                    </h3>
                    <div className="space-y-3">
                        {routes.filter(r => r.status === 'planned').map((route) => (
                            <Card key={route.id} className="bg-gray-800 border-gray-700">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <p className="font-semibold text-white">Ruta #{route.route_number}</p>
                                            {route.planned_date && (
                                                <p className="text-sm text-gray-400">
                                                    {new Date(route.planned_date).toLocaleDateString('es-ES', {
                                                        weekday: 'short',
                                                        day: 'numeric',
                                                        month: 'short'
                                                    })}
                                                </p>
                                            )}
                                        </div>
                                        {getStatusBadge(route.status)}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-400">
                                            {route.total_stops || route.route_stops.length} entregas
                                        </span>
                                        <Button
                                            onClick={() => router.push(`/delivery/routes/${route.id}`)}
                                            size="sm"
                                            variant="outline"
                                            className="border-gray-600 text-white hover:bg-gray-700"
                                        >
                                            Ver
                                            <ArrowRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="px-4">
                <h3 className="text-lg font-semibold text-white mb-3">Acciones Rápidas</h3>
                <div className="grid grid-cols-1 gap-3">
                    <Button
                        onClick={() => router.push('/delivery/routes')}
                        className="h-14 bg-blue-600 hover:bg-blue-700"
                    >
                        <MapPin className="h-5 w-5 mr-3" />
                        Ver Todas las Rutas
                    </Button>
                </div>
            </div>

            {/* Empty State */}
            {routes.length === 0 && (
                <div className="px-4 py-12">
                    <Card className="bg-gray-800 border-gray-700">
                        <CardContent className="py-12 text-center">
                            <Truck className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-300 mb-2">
                                Sin rutas asignadas
                            </h3>
                            <p className="text-gray-500">
                                Cuando el administrador te asigne una ruta, aparecerá aquí.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}