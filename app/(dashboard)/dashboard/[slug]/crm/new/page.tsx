"use client";

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, MapPin, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

export default function NewCustomerPage() {
    const router = useRouter();
    const params = useParams();
    const slug = params?.slug as string;

    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        latitude: '',
        longitude: '',
        credit_limit: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(`/api/dashboard/${slug}/crm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                    longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                    credit_limit: formData.credit_limit || null
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Cliente creado correctamente');
                router.push(`/dashboard/${slug}/crm/${data.customer.id}`);
            } else {
                toast.error(data.error || 'Error al crear el cliente');
            }
        } catch (error) {
            toast.error('Error inesperado');
            console.error('Error creating customer:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-6 max-w-2xl">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link
                    href={`/dashboard/${slug}/customers`}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Nuevo Cliente</h1>
                    <p className="text-gray-500 text-sm">Agrega un nuevo cliente manualmente</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Información del Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <Label htmlFor="full_name">Nombre Completo *</Label>
                                <Input
                                    id="full_name"
                                    placeholder="Juan Pérez García"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="phone">Teléfono *</Label>
                                <Input
                                    id="phone"
                                    placeholder="+57 300 123 4567"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="juan@email.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Address Section */}
                        <div className="space-y-4">
                            <h3 className="font-medium flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                Dirección
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <Label htmlFor="address">Dirección</Label>
                                    <Input
                                        id="address"
                                        placeholder="Calle 123 # 45-67, Bogotá"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="city">Ciudad</Label>
                                    <Input
                                        id="city"
                                        placeholder="Bogotá"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label htmlFor="latitude">Latitud</Label>
                                        <Input
                                            id="latitude"
                                            placeholder="4.7110"
                                            value={formData.latitude}
                                            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="longitude">Longitud</Label>
                                        <Input
                                            id="longitude"
                                            placeholder="-74.0721"
                                            value={formData.longitude}
                                            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-gray-500">
                                💡 Para obtener coordenadas precisas, busca la dirección en Google Maps y copia las coordenadas.
                            </p>
                        </div>

                        {/* Credit Section */}
                        <div className="space-y-4">
                            <h3 className="font-medium flex items-center gap-2">
                                <CreditCard className="w-4 h-4" />
                                Límite de Crédito (Opcional)
                            </h3>

                            <div>
                                <Label htmlFor="credit_limit">Límite de Crédito ($)</Label>
                                <Input
                                    id="credit_limit"
                                    type="number"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    value={formData.credit_limit}
                                    onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Dejar en 0 para cliente de contado. Ingresa un valor para habilitar crédito.
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    'Crear Cliente'
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
