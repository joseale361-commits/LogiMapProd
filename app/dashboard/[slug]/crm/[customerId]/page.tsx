"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    ArrowLeft,
    Phone,
    Mail,
    MapPin,
    CreditCard,
    ShoppingCart,
    User,
    Loader2,
    MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';

interface CustomerDetail {
    id: string;
    full_name: string;
    phone: string | null;
    email: string | null;
    relationship_id: string;
    credit_limit: number | null;
    current_debt: number;
    status: string | null;
    last_order_date: string | null;
    last_order_amount: number | null;
    total_orders: number;
    purchase_frequency: number | null;
    address: {
        street_address: string;
        city: string | null;
        location: { lat: number; lng: number } | null;
    } | null;
}

export default function CustomerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug as string;
    const customerId = params?.customerId as string;

    const [customer, setCustomer] = useState<CustomerDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (customerId) {
            fetchCustomer();
        }
    }, [customerId]);

    const fetchCustomer = async () => {
        try {
            const response = await fetch(`/api/dashboard/${slug}/customers`);
            const data = await response.json();

            if (data.success) {
                const found = data.customers.find((c: CustomerDetail) => c.id === customerId);
                if (found) {
                    setCustomer(found);
                }
            }
        } catch (error) {
            console.error('Error fetching customer:', error);
            toast.error('Error al cargar los datos del cliente');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="container mx-auto py-6">
                <div className="text-center py-12">
                    <h2 className="text-xl font-semibold">Cliente no encontrado</h2>
                    <p className="text-gray-500 mt-2">El cliente que buscas no existe o ha sido eliminado.</p>
                    <Link href={`/dashboard/${slug}/customers`}>
                        <Button className="mt-4">Volver a Clientes</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const formatDate = (date: string | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('es-CO', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP'
        }).format(amount);
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href={`/dashboard/${slug}/customers`}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">{customer.full_name}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        {customer.phone && (
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {customer.phone}
                            </span>
                        )}
                        {customer.email && (
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {customer.email}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                        {customer.status || 'Sin estado'}
                    </Badge>
                    {customer.email && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const message = `Hola! Regístrate en LogiMap para hacernos pedidos: ${window.location.origin}/register?distributor=${slug}&email=${encodeURIComponent(customer.email || '')}`;
                                window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                            }}
                            className="flex items-center gap-2"
                        >
                            <MessageSquare className="w-4 h-4" />
                            Invitar por WhatsApp
                        </Button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Resumen
                    </TabsTrigger>
                    <TabsTrigger value="credit" className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Crédito
                    </TabsTrigger>
                    <TabsTrigger value="orders" className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4" />
                        Pedidos ({customer.total_orders})
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Contact Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Información de Contacto</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span>{customer.phone || 'Sin teléfono'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span>{customer.email || 'Sin email'}</span>
                                </div>
                                {customer.address && (
                                    <div className="flex items-start gap-2">
                                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                        <div>
                                            <p>{customer.address.street_address}</p>
                                            {customer.address.city && (
                                                <p className="text-sm text-gray-500">{customer.address.city}</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Purchase Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Estadísticas de Compra</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Total Pedidos</span>
                                    <span className="font-medium">{customer.total_orders}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Última Compra</span>
                                    <span className="font-medium">{formatDate(customer.last_order_date)}</span>
                                </div>
                                {customer.last_order_amount && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Monto Último</span>
                                        <span className="font-medium">{formatCurrency(customer.last_order_amount)}</span>
                                    </div>
                                )}
                                {customer.purchase_frequency && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Frecuencia</span>
                                        <span className="font-medium">Cada {customer.purchase_frequency} días</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Credit Overview */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <CreditCard className="w-4 h-4" />
                                    Resumen Crédito
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Límite de Crédito</span>
                                    <span className="font-medium">
                                        {customer.credit_limit ? formatCurrency(customer.credit_limit) : 'Sin crédito'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Deuda Actual</span>
                                    <span className={`font-medium ${customer.current_debt > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        {formatCurrency(customer.current_debt)}
                                    </span>
                                </div>
                                {customer.credit_limit && (
                                    <div className="mt-2">
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span>Utilizado</span>
                                            <span>{Math.round((customer.current_debt / customer.credit_limit) * 100)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${customer.current_debt > customer.credit_limit ? 'bg-red-500' : 'bg-blue-500'}`}
                                                style={{ width: `${Math.min((customer.current_debt / customer.credit_limit) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Credit Tab */}
                <TabsContent value="credit">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <CreditCard className="w-4 h-4" />
                                Configuración de Crédito
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CreditSettingsForm
                                customer={customer}
                                slug={slug}
                                onUpdate={fetchCustomer}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Orders Tab */}
                <TabsContent value="orders">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <ShoppingCart className="w-4 h-4" />
                                Historial de Pedidos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8 text-gray-500">
                                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>El historial de pedidos se implementará pronto.</p>
                                <p className="text-sm mt-1">Total de pedidos: {customer.total_orders}</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Credit Settings Form Component
function CreditSettingsForm({ customer, slug, onUpdate }: { customer: CustomerDetail; slug: string; onUpdate: () => void }) {
    const [creditLimit, setCreditLimit] = useState(customer.credit_limit?.toString() || '');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(`/api/dashboard/${slug}/crm/${customer.id}/credit`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    credit_limit: creditLimit ? parseFloat(creditLimit) : null
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Límite de crédito actualizado');
                onUpdate();
            } else {
                toast.error(data.error || 'Error al actualizar');
            }
        } catch (error) {
            toast.error('Error inesperado');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
                <Label htmlFor="credit_limit">Límite de Crédito ($)</Label>
                <Input
                    id="credit_limit"
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={creditLimit}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreditLimit(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                    Ingresa 0 o déjalo vacío para cliente de contado.
                </p>
            </div>

            <div className="flex gap-3">
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        'Actualizar Crédito'
                    )}
                </Button>
            </div>
        </form>
    );
}
