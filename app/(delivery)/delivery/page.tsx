'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/supabase';
import { useRouter } from 'next/navigation';
import {
    Truck,
    User,
    History,
    ChevronRight
} from 'lucide-react';

type Route = Database['public']['Tables']['routes']['Row'];
type RouteStop = Database['public']['Tables']['route_stops']['Row'];

interface RouteWithStops extends Route {
    route_stops: RouteStop[];
}

interface ActionCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    href: string;
    variant?: 'primary' | 'secondary';
}

function ActionCard({ title, description, icon, href, variant = 'primary' }: ActionCardProps) {
    const router = useRouter();

    return (
        <button
            onClick={() => router.push(href)}
            className={`w-full text-left p-6 rounded-xl border transition-all duration-200 hover:scale-[1.02] ${variant === 'primary'
                ? 'bg-blue-600 border-blue-500 text-white hover:bg-blue-700 shadow-sm'
                : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50 shadow-sm'
                }`}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className={`p-3 rounded-lg w-fit mb-4 ${variant === 'primary' ? 'bg-blue-500' : 'bg-gray-100'
                        }`}>
                        {icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{title}</h3>
                    <p className={`text-sm ${variant === 'primary' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                        {description}
                    </p>
                </div>
                <ChevronRight className={`h-6 w-6 ${variant === 'primary' ? 'text-blue-200' : 'text-gray-400'
                    }`} />
            </div>
        </button>
    );
}

export default function DeliveryHomePage() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<{ id: string; full_name: string } | null>(null);
    const [stats, setStats] = useState({
        activeRoutes: 0,
        pendingStops: 0,
        completedToday: 0
    });
    const router = useRouter();
    const supabase = createClient();

    const fetchUserAndData = useCallback(async () => {
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) {
                router.push('/login');
                return;
            }

            setUser({ id: authUser.id, full_name: authUser.user_metadata?.full_name || 'Chofer' });

            // Fetch routes for this driver
            const { data: routesData } = await supabase
                .from('routes')
                .select('*')
                .order('created_at', { ascending: false });

            // Fetch route stops
            const routeIds = routesData?.map(r => r.id) || [];
            let routeStopsData: RouteStop[] = [];
            if (routeIds.length > 0) {
                const { data: stops } = await supabase
                    .from('route_stops')
                    .select('*')
                    .in('route_id', routeIds);
                routeStopsData = stops || [];
            }

            // Combine routes with stops
            const routesWithStops: RouteWithStops[] = (routesData || []).map(route => ({
                ...route,
                route_stops: routeStopsData.filter(stop => stop.route_id === route.id)
            }));

            // Calculate stats
            const activeRoutes = routesWithStops.filter(r => ['in_progress', 'active'].includes(r.status)).length;
            const pendingStops = routesWithStops.reduce((acc, r) =>
                acc + r.route_stops.filter(s => s.status === 'pending').length, 0);
            const completedToday = routesWithStops.reduce((acc, r) =>
                acc + r.route_stops.filter(s =>
                    s.status === 'delivered' &&
                    s.delivered_at &&
                    new Date(s.delivered_at).toDateString() === new Date().toDateString()
                ).length, 0);

            setStats({
                activeRoutes,
                pendingStops,
                completedToday
            });
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, [router, supabase]);

    useEffect(() => {
        fetchUserAndData();
    }, [fetchUserAndData]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="px-6 py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    Panel de Reparto
                </h1>
                <p className="text-gray-500 text-base">
                    Bienvenido, {user?.full_name || 'Conductor'}
                </p>
            </div>

            {/* Quick Stats */}
            <div className="px-6 mb-8">
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl p-4 text-center border border-gray-100 shadow-sm">
                        <p className="text-3xl font-bold text-blue-600">{stats.activeRoutes}</p>
                        <p className="text-sm text-gray-500">Activas</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 text-center border border-gray-100 shadow-sm">
                        <p className="text-3xl font-bold text-amber-600">{stats.pendingStops}</p>
                        <p className="text-sm text-gray-500">Pendientes</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 text-center border border-gray-100 shadow-sm">
                        <p className="text-3xl font-bold text-green-600">{stats.completedToday}</p>
                        <p className="text-sm text-gray-500">Hoy</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="px-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
                <div className="grid grid-cols-1 gap-4">
                    <ActionCard
                        title="Mis Rutas Asignadas"
                        description="Ver y gestionar mis entregas"
                        icon={<Truck className="h-7 w-7 text-white" />}
                        href="/delivery/routes"
                        variant="primary"
                    />
                    <ActionCard
                        title="Historial"
                        description="Ver entregas completadas"
                        icon={<History className="h-7 w-7 text-gray-600" />}
                        href="#"
                        variant="secondary"
                    />
                    <ActionCard
                        title="Mi Perfil"
                        description="Gestionar información personal"
                        icon={<User className="h-7 w-7 text-gray-600" />}
                        href="#"
                        variant="secondary"
                    />
                </div>
            </div>
        </div>
    );
}
