import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getCustomerProfile, getCustomerAddresses, getCustomerOrders } from '@/lib/queries/customer-profile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, MapPin, Package, Mail, Phone, Edit } from 'lucide-react';
import Link from 'next/link';

import { ProfileAddresses } from '@/components/customer/ProfileAddresses';
import { EditProfileDialog } from '@/components/customer/EditProfileDialog';

export default async function CustomerProfilePage() {
    console.log('--- INICIO CARGA PERFIL ---');
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        console.error('[Profile] Auth error or no user:', authError);
        redirect('/login');
    }

    // Fetch customer data
    const [profile, addresses, orders] = await Promise.all([
        getCustomerProfile(user.id),
        getCustomerAddresses(user.id),
        getCustomerOrders(user.id, 10),
    ]);

    if (!profile) {
        console.error('[Profile] User found but profile is missing for id:', user.id);
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6 text-center">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
                    <User className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold">Error cargando perfil</h2>
                <p className="text-gray-500 max-w-md">
                    No pudimos encontrar tu perfil en nuestra base de datos. Por favor, intenta cerrar sesión y volver a ingresar.
                </p>
                <div className="flex gap-4">
                    <Button asChild variant="outline">
                        <Link href="/shop">Volver al inicio</Link>
                    </Button>
                    <form action="/api/auth/logout" method="POST">
                        <Button type="submit" variant="destructive">Cerrar Sesión</Button>
                    </form>
                </div>
            </div>
        );
    }

    console.log('Datos cargados:', {
        userId: user.id,
        profileFound: !!profile,
        addressesCount: addresses.length,
        ordersCount: orders.length
    });

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
            pending: { label: 'Pendiente', variant: 'secondary' },
            confirmed: { label: 'Confirmado', variant: 'default' },
            delivered: { label: 'Entregado', variant: 'outline' },
            cancelled: { label: 'Cancelado', variant: 'destructive' },
        };

        const config = statusMap[status] || { label: status, variant: 'outline' };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
                        <p className="text-sm text-gray-500">Gestiona tu información personal</p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href="/shop">← Volver al Inicio</Link>
                    </Button>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Personal Information */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-blue-600" />
                            Datos Personales
                        </CardTitle>
                        <EditProfileDialog
                            initialData={{
                                ...profile,
                                email: user.email || ''
                            }}
                        />
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Nombre Completo</label>
                                <p className="text-base text-gray-900 mt-1">{profile.full_name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                                    <Mail className="w-4 h-4" />
                                    Email
                                </label>
                                <p className="text-base text-gray-900 mt-1">{user.email || 'No disponible'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                                    <Phone className="w-4 h-4" />
                                    Teléfono
                                </label>
                                <p className="text-base text-gray-900 mt-1">{profile.phone || 'No especificado'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Addresses */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-green-600" />
                            Mis Direcciones
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ProfileAddresses addresses={addresses} userId={user.id} />
                    </CardContent>
                </Card>

                {/* Order History */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-purple-600" />
                            Historial de Pedidos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {orders.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Fecha</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Distribuidora</th>
                                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total</th>
                                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map((order) => (
                                            <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 group">
                                                <td className="py-3 px-4 text-sm text-gray-900">
                                                    <Link href={`/shop/orders/${order.id}`} className="text-blue-600 hover:underline font-medium">
                                                        {formatDate(order.created_at)}
                                                    </Link>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-gray-900">{order.distributor_name}</td>
                                                <td className="py-3 px-4 text-sm text-gray-900 text-right font-medium">
                                                    {formatPrice(order.total_amount)}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {getStatusBadge(order.status)}
                                                        <Button asChild variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0">
                                                            <Link href={`/shop/orders/${order.id}`}>
                                                                <Edit className="w-4 h-4" />
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No tienes pedidos aún</p>
                                <Button asChild variant="outline" className="mt-4">
                                    <Link href="/shop">Explorar Proveedores</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
