import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MapPin, Truck, Calendar, ChevronRight } from 'lucide-react';

export default async function DriverRoutesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <div className="p-4">No autorizado</div>;

    // Fetch routes with the WORKING filter
    const { data: routes } = await supabase
        .from('routes')
        .select('*, route_stops(count)')
        .eq('driver_id', user.id)
        .in('status', ['active', 'activo', 'in_transit', 'en_ruta', 'assigned', 'asignado'])
        .order('created_at', { ascending: false });

    return (
        <div className="min-h-screen bg-gray-50 p-4 pb-20">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Mis Rutas Activas</h1>
                <p className="text-gray-500 text-sm">Hola, conductor</p>
            </header>

            {(!routes || routes.length === 0) ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <Truck className="w-12 h-12 mb-2 opacity-50" />
                    <p>No tienes rutas asignadas hoy.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {routes.map((route) => (
                        <Link
                            key={route.id}
                            href={`/delivery/routes/${route.id}`}
                            className="block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden active:scale-95 transition-transform"
                        >
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                                        {route.status}
                                    </span>
                                    <span className="text-xs text-gray-400 font-mono">
                                        {route.created_at ? format(new Date(route.created_at), 'HH:mm', { locale: es }) : '--:--'}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-gray-800 mb-1">
                                    Ruta {route.route_number || 'Sin Número'}
                                </h3>

                                <div className="flex items-center text-gray-600 text-sm mb-4">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    {route.created_at ? format(new Date(route.created_at), 'PPP', { locale: es }) : 'Sin fecha'}
                                </div>

                                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                                    <div className="flex items-center text-gray-700 font-medium">
                                        <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                                        {route.route_stops?.[0]?.count || 0} Paradas
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-300" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
