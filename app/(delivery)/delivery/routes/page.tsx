'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/supabase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Truck, Clock, CheckCircle2, XCircle } from 'lucide-react';

type Route = Database['public']['Tables']['routes']['Row'];
type RouteStop = Database['public']['Tables']['route_stops']['Row'];

interface RouteWithStops extends Route {
    route_stops: RouteStop[];
}

export default function DeliveryRoutesPage() {
    const [routes, setRoutes] = useState<RouteWithStops[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<{ id: string; full_name: string } | null>(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        fetchUserAndRoutes();
    }, []);

    async function fetchUserAndRoutes() {
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
                .in('status', ['planning', 'active'])
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRoutes(routesData || []);
        } catch (error) {
            console.error('Error fetching routes:', error);
        } finally {
            setLoading(false);
        }
    }

    async function startRoute(routeId: string) {
        try {
            const response = await fetch(`/api/delivery/routes/${routeId}/start`, {
                method: 'POST',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al iniciar la ruta');
            }

            // Refresh routes
            await fetchUserAndRoutes();
        } catch (error) {
            console.error('Error starting route:', error);
            alert(error instanceof Error ? error.message : 'Error al iniciar la ruta');
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
                    <p className="text-gray-400">Cargando rutas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 pb-20">
            {/* Content */}
            <main className="px-4 py-6 space-y-4">
                {routes.length === 0 ? (
                    <Card className="bg-gray-800 border-gray-700">
                        <CardContent className="py-12 text-center">
                            <Truck className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-300 mb-2">
                                No tienes rutas asignadas
                            </h3>
                            <p className="text-gray-500">
                                Cuando el administrador te asigne una ruta, aparecerá aquí.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    routes.map((route) => (
                        <Card key={route.id} className="overflow-hidden bg-gray-800 border-gray-700">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg text-white">
                                            Ruta {route.route_number}
                                        </CardTitle>
                                        <div className="flex items-center gap-2 mt-2">
                                            {getStatusBadge(route.status)}
                                            <span className="text-sm text-gray-400">
                                                {getCompletedStops(route)}/{route.total_stops || route.route_stops.length} entregas
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* Route Info */}
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <Clock className="h-4 w-4" />
                                    <span>
                                        {route.planned_date ? new Date(route.planned_date).toLocaleDateString('es-ES', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        }) : 'Sin fecha'}
                                    </span>
                                </div>

                                {route.total_distance_km && (
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <MapPin className="h-4 w-4" />
                                        <span>{route.total_distance_km.toFixed(1)} km</span>
                                    </div>
                                )}

                                {route.vehicle_plate && (
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <Truck className="h-4 w-4" />
                                        <span>{route.vehicle_plate}</span>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="pt-3 space-y-2">
                                    {route.status === 'planned' ? (
                                        <Button
                                            onClick={() => startRoute(route.id)}
                                            className="w-full h-14 text-lg font-semibold bg-green-600 hover:bg-green-700"
                                        >
                                            <Truck className="h-5 w-5 mr-2" />
                                            Iniciar Ruta
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => router.push(`/delivery/routes/${route.id}`)}
                                            className="w-full h-14 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
                                        >
                                            <MapPin className="h-5 w-5 mr-2" />
                                            Ver Paradas
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </main>
        </div>
    );
}
