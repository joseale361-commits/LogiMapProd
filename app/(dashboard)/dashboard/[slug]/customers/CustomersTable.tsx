"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    MessageCircle,
    MapPin,
    Mail,
    Phone,
    Clock,
    ShoppingCart,
    Filter,
    MoreVertical,
    Settings
} from 'lucide-react';

interface Customer {
    id: string;
    full_name: string;
    phone: string | null;
    email: string | null;
    pin_status: 'active-7' | 'active-15' | 'inactive-30' | 'inactive';
    days_since_last_order: number | null;
    last_order_date: string | null;
    purchase_frequency: number | null;
    total_orders: number;
    address: {
        street_address: string;
        city: string | null;
        location: { lat: number; lng: number } | null;
    } | null;
}

interface CustomersTableProps {
    customers: Customer[];
    onFilterChange: (filter: 'all' | 'inactive') => void;
    currentFilter: 'all' | 'inactive';
    onViewOnMap?: (customerId: string) => void;
    slug?: string;
}

export default function CustomersTable({ customers, onFilterChange, currentFilter, onViewOnMap, slug }: CustomersTableProps) {
    const router = useRouter();
    const formatDate = (date: string | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('es-CO', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatFrequency = (days: number | null) => {
        if (!days) return '-';
        if (days < 7) return `${days} días`;
        if (days < 30) return `${Math.floor(days / 7)} semanas`;
        return `${Math.floor(days / 30)} meses`;
    };

    const getStatusBadge = (status: Customer['pin_status']) => {
        switch (status) {
            case 'active-7':
                return <Badge className="bg-green-500 hover:bg-green-600">Activo</Badge>;
            case 'active-15':
                return <Badge className="bg-yellow-500 hover:bg-yellow-600">Hace 15 días</Badge>;
            case 'inactive-30':
                return <Badge className="bg-orange-500 hover:bg-orange-600">En riesgo</Badge>;
            case 'inactive':
                return <Badge className="bg-red-500 hover:bg-red-600">Inactivo</Badge>;
            default:
                return <Badge variant="secondary">Desconocido</Badge>;
        }
    };

    const getWhatsAppUrl = (phone: string | null, name: string) => {
        if (!phone) return '#';
        const cleanPhone = phone.replace(/\D/g, '');
        const message = `Hola ${encodeURIComponent(name)}, hace tiempo no pides. ¡Mira estas ofertas!`;
        return `https://wa.me/${cleanPhone}?text=${message}`;
    };

    const getDaysText = (days: number | null) => {
        if (days === null) return 'Sin pedidos';
        if (days === 0) return 'Hoy';
        if (days === 1) return 'Ayer';
        if (days < 7) return `${days} días`;
        if (days < 30) return `${Math.floor(days / 7)} sem`;
        return `${Math.floor(days / 30)} meses`;
    };

    const inactiveCount = customers.filter(c => c.pin_status === 'inactive-30' || c.pin_status === 'inactive').length;

    return (
        <div className="space-y-4">
            {/* Filter Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Filtrar:</span>
                    <div className="flex gap-1">
                        <Button
                            variant={currentFilter === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => onFilterChange('all')}
                            className="text-xs"
                        >
                            Todos ({customers.length})
                        </Button>
                        <Button
                            variant={currentFilter === 'inactive' ? 'destructive' : 'outline'}
                            size="sm"
                            onClick={() => onFilterChange('inactive')}
                            className="text-xs"
                        >
                            🛑 Inactivos ({inactiveCount})
                        </Button>
                    </div>
                </div>
                <div className="text-sm text-gray-500">
                    {customers.length} cliente{customers.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">Cliente</TableHead>
                            <TableHead>Zona</TableHead>
                            <TableHead>Frecuencia</TableHead>
                            <TableHead>Última Compra</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    No se encontraron clientes
                                </TableCell>
                            </TableRow>
                        ) : (
                            customers.map((customer) => (
                                <TableRow key={customer.id}>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className="font-medium">{customer.full_name}</div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                {customer.phone && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="w-3 h-3" />
                                                        {customer.phone}
                                                    </span>
                                                )}
                                                {customer.email && (
                                                    <span className="flex items-center gap-1">
                                                        <Mail className="w-3 h-3" />
                                                        {customer.email}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3 text-gray-400" />
                                            <span className="text-sm">
                                                {customer.address?.city || customer.address?.street_address || '-'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <ShoppingCart className="w-3 h-3 text-gray-400" />
                                            <span className="text-sm">
                                                {customer.total_orders} pedidos
                                            </span>
                                        </div>
                                        {customer.purchase_frequency && (
                                            <div className="text-xs text-gray-500">
                                                Cada {formatFrequency(customer.purchase_frequency)}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3 text-gray-400" />
                                            <span className="text-sm">
                                                {formatDate(customer.last_order_date)}
                                            </span>
                                        </div>
                                        <div className={`text-xs font-medium ${customer.days_since_last_order !== null && customer.days_since_last_order > 30
                                            ? 'text-red-500'
                                            : customer.days_since_last_order !== null && customer.days_since_last_order > 15
                                                ? 'text-yellow-600'
                                                : 'text-green-600'
                                            }`}>
                                            {getDaysText(customer.days_since_last_order)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(customer.pin_status)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* WhatsApp Button */}
                                            {customer.phone ? (
                                                <a
                                                    href={getWhatsAppUrl(customer.phone, customer.full_name)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                                                >
                                                    <MessageCircle className="w-3 h-3" />
                                                    WhatsApp
                                                </a>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Sin teléfono</span>
                                            )}

                                            {/* Quick Actions */}
                                            {customer.email && (
                                                <a
                                                    href={`mailto:${customer.email}`}
                                                    className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                                                    title="Enviar Email"
                                                >
                                                    <Mail className="w-4 h-4" />
                                                </a>
                                            )}
                                            {/* Ver en Mapa - Centers the internal map on this customer */}
                                            {customer.address?.location && onViewOnMap && (
                                                <button
                                                    onClick={() => onViewOnMap(customer.id)}
                                                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                    title="Ver en Mapa (Interno)"
                                                >
                                                    <MapPin className="w-4 h-4" />
                                                </button>
                                            )}
                                            {/* External Google Maps link */}
                                            {customer.address?.location && (
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${customer.address.location.lat},${customer.address.location.lng}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                                                    title="Abrir en Google Maps"
                                                >
                                                    <MapPin className="w-4 h-4" />
                                                </a>
                                            )}

                                            {/* Manage/Edit Button */}
                                            {slug && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => router.push(`/dashboard/${slug}/crm/${customer.id}`)}
                                                    className="text-xs"
                                                >
                                                    <Settings className="w-3 h-3 mr-1" />
                                                    Gestionar
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
