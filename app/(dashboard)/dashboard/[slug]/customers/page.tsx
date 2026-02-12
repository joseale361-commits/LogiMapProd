"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Map, LayoutList, AlertCircle, CheckCircle, Clock, TrendingDown, Plus, MapPin } from 'lucide-react';
import CustomersTable from './CustomersTable';

const CustomersMap = dynamic(
    () => import('./CustomersMap'),
    {
        ssr: false,
        loading: () => <div className="h-96 bg-gray-100 flex items-center justify-center rounded-lg">Cargando mapa...</div>
    }
);

const ZoneMap = dynamic(
    () => import('./ZoneMap'),
    {
        ssr: false,
        loading: () => <div className="h-[600px] bg-gray-100 flex items-center justify-center rounded-lg">Cargando mapa de zonas...</div>
    }
);

interface Customer {
    id: string;
    full_name: string;
    phone: string | null;
    email: string | null;
    pin_status: 'active-7' | 'active-15' | 'inactive-30' | 'inactive';
    days_since_last_order: number | null;
    last_order_date: string | null;
    last_order_amount: number | null;
    purchase_frequency: number | null;
    total_orders: number;
    address: {
        street_address: string;
        city: string | null;
        location: { lat: number; lng: number } | null;
        zone_name: string | null;
    } | null;
}

interface ZoneCustomer {
    id: string;
    full_name: string;
    phone: string | null;
    email: string | null;
    address: {
        street_address: string;
        city: string | null;
        zone_name: string | null;
        location?: { lat: number; lng: number } | null;
    };
}

interface CustomersResponse {
    success: boolean;
    customers: Customer[];
    customersWithLocation: Customer[];
    customersWithoutLocation: Customer[];
    summary: {
        total: number;
        active7: number;
        active15: number;
        inactive30: number;
        inactive: number;
        withoutLocation: number;
    };
}

interface PageProps { }

export default function CustomersPage() {
    const params = useParams();
    const slug = params?.slug as string;
    const router = useRouter();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [summary, setSummary] = useState<CustomersResponse['summary'] | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'inactive'>('all');
    const [activeTab, setActiveTab] = useState('table');
    const [centerOnCustomerId, setCenterOnCustomerId] = useState<string | null>(null);
    const [heatmapLoading, setHeatmapLoading] = useState(false);
    const [zoneCustomers, setZoneCustomers] = useState<ZoneCustomer[]>([]);

    useEffect(() => {
        if (slug) {
            fetchCustomers(slug, filter);
        }
    }, [slug, filter]);

    // Fetch heatmap data when zones tab is selected
    useEffect(() => {
        if (activeTab === 'zones' && slug && zoneCustomers.length === 0) {
            fetchHeatmapData(slug);
        }
    }, [activeTab, slug]);

    const fetchCustomers = async (distributorSlug: string, filterValue: string) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/dashboard/${distributorSlug}/customers?filter=${filterValue}`);
            const data: CustomersResponse = await response.json();

            if (data.success) {
                setCustomers(data.customers);
                setSummary(data.summary);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handler to center map on a specific customer
    const handleViewOnMap = (customerId: string) => {
        setCenterOnCustomerId(customerId);
        setActiveTab('map');
    };

    // Fetch heatmap data with zone information
    const fetchHeatmapData = async (distributorSlug: string) => {
        try {
            setHeatmapLoading(true);
            const response = await fetch(`/api/dashboard/${distributorSlug}/crm/heatmap`);
            const data = await response.json();

            if (data.success && data.heatmapPoints) {
                // Transform heatmap points to ZoneCustomer format
                const transformedCustomers: ZoneCustomer[] = data.heatmapPoints.map((point: any) => ({
                    id: point.id,
                    full_name: point.full_name,
                    phone: point.phone,
                    email: point.email,
                    address: {
                        street_address: point.address?.street_address || '',
                        city: point.address?.city || null,
                        zone_name: point.address?.zone_name || null,
                        location: point.location || null
                    }
                }));
                setZoneCustomers(transformedCustomers);
            }
        } catch (error) {
            console.error('Error fetching heatmap data:', error);
        } finally {
            setHeatmapLoading(false);
        }
    };

    // Handle zone update
    const handleZoneUpdate = async (customerId: string, newZone: string) => {
        try {
            const response = await fetch(`/api/dashboard/${slug}/customers/${customerId}/zone`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ zone_name: newZone })
            });

            if (response.ok) {
                // Refresh heatmap data after zone update
                await fetchHeatmapData(slug);
                // Also refresh customers list
                await fetchCustomers(slug, filter);
            } else {
                console.error('Failed to update zone');
            }
        } catch (error) {
            console.error('Error updating zone:', error);
        }
    };

    if (loading && customers.length === 0) {
        return (
            <div className="container mx-auto py-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Clientes CRM</h1>
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse"></div>
                    ))}
                </div>
                <div className="h-96 bg-gray-100 rounded-lg animate-pulse"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Clientes CRM</h1>
                    <p className="text-gray-500 text-sm">Gestiona y visualiza tus clientes en un mapa de calor</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => fetchCustomers(slug, filter)}>
                        Actualizar
                    </Button>
                    <Button
                        onClick={() => router.push(`/dashboard/${slug}/crm/new`)}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Cliente
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid gap-4 md:grid-cols-5">
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-500" />
                                <div>
                                    <p className="text-2xl font-bold">{summary.total}</p>
                                    <p className="text-xs text-gray-500">Total Clientes</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-green-200 bg-green-50">
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <div>
                                    <p className="text-2xl font-bold text-green-700">{summary.active7}</p>
                                    <p className="text-xs text-green-600">Compró (7 días)</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-yellow-200 bg-yellow-50">
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-yellow-500" />
                                <div>
                                    <p className="text-2xl font-bold text-yellow-700">{summary.active15}</p>
                                    <p className="text-xs text-yellow-600">Hace 15 días</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-red-500" />
                                <div>
                                    <p className="text-2xl font-bold text-red-700">{summary.inactive30 + summary.inactive}</p>
                                    <p className="text-xs text-red-600">En Riesgo (+30 días)</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2">
                                <Map className="w-5 h-5 text-gray-500" />
                                <div>
                                    <p className="text-2xl font-bold">{summary.total - summary.withoutLocation}</p>
                                    <p className="text-xs text-gray-500">Con Geolocalización</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Main Content Tabs */}
            <Tabs defaultValue="table" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="table" className="flex items-center gap-2">
                        <LayoutList className="w-4 h-4" />
                        Lista Inteligente
                    </TabsTrigger>
                    <TabsTrigger value="map" className="flex items-center gap-2">
                        <Map className="w-4 h-4" />
                        Mapa de Calor
                    </TabsTrigger>
                    <TabsTrigger value="zones" className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Mapa de Zonas
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="table">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Lista de Clientes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CustomersTable
                                customers={customers}
                                onFilterChange={setFilter}
                                currentFilter={filter}
                                onViewOnMap={handleViewOnMap}
                                slug={slug}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="map">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Map className="w-5 h-5" />
                                Mapa de Calor de Clientes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative">
                                <CustomersMap
                                    customers={customers}
                                    height="h-[600px]"
                                    centerOnCustomerId={centerOnCustomerId}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="zones">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MapPin className="w-5 h-5" />
                                Mapa de Zonas de Ventas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative">
                                {!heatmapLoading && zoneCustomers.length > 0 ? (
                                    <ZoneMap
                                        customers={zoneCustomers}
                                        height="h-[600px]"
                                        onZoneUpdate={handleZoneUpdate}
                                    />
                                ) : heatmapLoading ? (
                                    <div className="h-[600px] bg-gray-100 flex items-center justify-center rounded-lg">
                                        <div className="text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                                            <p className="mt-2 text-gray-500">Cargando datos de zonas...</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-[600px] bg-gray-100 flex items-center justify-center rounded-lg">
                                        <div className="text-center text-gray-500 p-4">
                                            <p className="text-lg font-medium">No hay clientes con ubicación.</p>
                                            <p className="text-sm mt-1">Los clientes necesitan una dirección con geolocalización.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Quick Actions Info */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                        <TrendingDown className="w-5 h-5 text-blue-500 mt-0.5" />
                        <div>
                            <h3 className="font-medium text-blue-900">💡 Acción Rápida</h3>
                            <p className="text-sm text-blue-700 mt-1">
                                Los clientes marcados en <span className="text-red-500 font-medium">rojo</span> están en riesgo de abandono.
                                Usa el botón de <span className="font-medium text-green-600">WhatsApp</span> para enviarles promociones personalizadas y reactivarlos.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
