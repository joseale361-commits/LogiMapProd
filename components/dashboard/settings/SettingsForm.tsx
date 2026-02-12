"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/ui/image-upload';
import { useToast } from '@/hooks/use-toast';
import { Settings, Save, Palette, Image, Map, Warehouse, Truck, Loader2 } from 'lucide-react';
import nextDynamic from 'next/dynamic';
import { useLoadScript, Libraries } from '@react-google-maps/api';
import { updateSettings } from '@/app/(dashboard)/dashboard/[slug]/settings/actions';

const WarehouseLocationMap = nextDynamic(
    () => import('@/components/dashboard/WarehouseLocationMap').then(mod => mod.WarehouseLocationMap),
    {
        ssr: false,
        loading: () => <div className="h-[400px] w-full bg-gray-100 animate-pulse rounded">Cargando mapa...</div>
    }
);

interface Colors {
    primary: string;
    secondary: string;
    accent: string;
}

interface DeliverySettings {
    free_radius_km: number;
    max_radius_km: number;
    delivery_fee: number;
    min_order_amount: number;
}

interface SettingsFormProps {
    initialLat: number;
    initialLng: number;
    slug: string;
    name: string;
    phone: string;
    logo_url: string;
    colors: Colors;
    delivery_zones: any;
    delivery_settings: DeliverySettings;
    warehouse_address: string;
}

const libraries: Libraries = ['places'];

// Submit button component that uses useFormStatus for pending state
function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <Button type="submit" disabled={pending} className="gap-2">
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {pending ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
    );
}

export default function SettingsForm({
    initialLat,
    initialLng,
    slug,
    name,
    phone,
    logo_url,
    colors,
    delivery_zones,
    delivery_settings,
    warehouse_address
}: SettingsFormProps) {
    const { toast } = useToast();
    const [formState, formAction] = useFormState(updateSettings, null);

    // Location state - use explicit props
    const [location, setLocation] = useState<{ lat: number | null; lng: number | null }>({
        lat: initialLat,
        lng: initialLng
    });

    // Form state - initialized with explicit props
    const [formData, setFormData] = useState({
        name: name || '',
        phone: phone || '',
        logo_url: logo_url || '',
        colors: colors || {
            primary: '#3b82f6',
            secondary: '#64748b',
            accent: '#f59e0b',
        },
        delivery_zones: delivery_zones
            ? JSON.stringify(delivery_zones, null, 2)
            : '',
        delivery_settings: delivery_settings || {
            free_radius_km: 0,
            max_radius_km: 0,
            delivery_fee: 0,
            min_order_amount: 0,
        },
        warehouse_address: warehouse_address || '',
    });

    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY as string,
        libraries,
    });

    const onPlaceChanged = useCallback(() => {
        if (autocompleteRef.current !== null) {
            const place = autocompleteRef.current.getPlace();
            if (place.geometry && place.geometry.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                setLocation({ lat, lng });
                setFormData(prev => ({
                    ...prev,
                    warehouse_address: place.formatted_address || ''
                }));
            }
        }
    }, []);

    useEffect(() => {
        if (formState) {
            if (formState.success) {
                toast({
                    variant: 'default',
                    title: 'Éxito',
                    description: 'Configuración actualizada exitosamente',
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: formState.error || 'Error al guardar la configuración',
                });
            }
        }
    }, [formState, toast]);

    const handleColorChange = (key: keyof Colors, value: string) => {
        setFormData(prev => ({
            ...prev,
            colors: {
                ...prev.colors,
                [key]: value,
            },
        }));
    };

    return (
        <form action={formAction}>
            {/* Hidden inputs for form submission */}
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="logo_url" value={formData.logo_url} />
            <input type="hidden" name="colors" value={JSON.stringify(formData.colors)} />
            <input type="hidden" name="delivery_zones" value={formData.delivery_zones} />
            <input type="hidden" name="delivery_settings" value={JSON.stringify(formData.delivery_settings)} />
            <input type="hidden" name="warehouse_address" value={formData.warehouse_address} />
            <input type="hidden" name="lat" value={location.lat ?? ''} readOnly />
            <input type="hidden" name="lng" value={location.lng ?? ''} readOnly />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            Información Básica
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre de la Tienda *</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="Ej: Mi Tienda"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Teléfono WhatsApp</Label>
                            <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                placeholder="Ej: +57 300 123 4567"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                            <p className="text-xs text-gray-500">
                                Este número se usará para contactar a los clientes
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Logo */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Image className="w-5 h-5" />
                            Logo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ImageUpload
                            value={formData.logo_url}
                            onChange={(value) => setFormData({ ...formData, logo_url: value })}
                            onRemove={() => setFormData({ ...formData, logo_url: '' })}
                            label="Logo de la Tienda"
                            placeholder="https://ejemplo.com/logo.png"
                        />
                    </CardContent>
                </Card>

                {/* Theme Colors */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Palette className="w-5 h-5" />
                            Colores de Tema
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="color_primary">Color Primario (Botones, Header)</Label>
                            <div className="flex items-center gap-3">
                                <Input
                                    id="color_primary"
                                    type="color"
                                    value={formData.colors.primary}
                                    onChange={(e) => handleColorChange('primary', e.target.value)}
                                    className="w-20 h-10 p-1 cursor-pointer"
                                />
                                <Input
                                    type="text"
                                    value={formData.colors.primary}
                                    onChange={(e) => handleColorChange('primary', e.target.value)}
                                    placeholder="#3b82f6"
                                    className="flex-1"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="color_secondary">Color Secundario</Label>
                            <div className="flex items-center gap-3">
                                <Input
                                    id="color_secondary"
                                    type="color"
                                    value={formData.colors.secondary}
                                    onChange={(e) => handleColorChange('secondary', e.target.value)}
                                    className="w-20 h-10 p-1 cursor-pointer"
                                />
                                <Input
                                    type="text"
                                    value={formData.colors.secondary}
                                    onChange={(e) => handleColorChange('secondary', e.target.value)}
                                    placeholder="#64748b"
                                    className="flex-1"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="color_accent">Color Acento</Label>
                            <div className="flex items-center gap-3">
                                <Input
                                    id="color_accent"
                                    type="color"
                                    value={formData.colors.accent}
                                    onChange={(e) => handleColorChange('accent', e.target.value)}
                                    className="w-20 h-10 p-1 cursor-pointer"
                                />
                                <Input
                                    type="text"
                                    value={formData.colors.accent}
                                    onChange={(e) => handleColorChange('accent', e.target.value)}
                                    placeholder="#f59e0b"
                                    className="flex-1"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Delivery Zones */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Map className="w-5 h-5" />
                            Zonas de Entrega
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="delivery_zones">Configuración de Zonas (JSON)</Label>
                            <Textarea
                                id="delivery_zones"
                                name="delivery_zones"
                                value={formData.delivery_zones}
                                onChange={(e) => setFormData({ ...formData, delivery_zones: e.target.value })}
                                rows={10}
                                className="font-mono text-sm"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Delivery Settings - Domicilios */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Truck className="w-5 h-5" />
                            Configuración de Domicilios
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Free Radius */}
                            <div className="space-y-2">
                                <Label htmlFor="free_radius_km">Radio Envío Gratis (km)</Label>
                                <Input
                                    id="free_radius_km"
                                    name="free_radius_km"
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={formData.delivery_settings.free_radius_km}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        delivery_settings: {
                                            ...formData.delivery_settings,
                                            free_radius_km: parseFloat(e.target.value) || 0
                                        }
                                    })}
                                />
                                <p className="text-xs text-gray-500">
                                    Distancia máxima para envío gratis
                                </p>
                            </div>

                            {/* Max Radius */}
                            <div className="space-y-2">
                                <Label htmlFor="max_radius_km">Radio Máximo Envío (km)</Label>
                                <Input
                                    id="max_radius_km"
                                    name="max_radius_km"
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={formData.delivery_settings.max_radius_km}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        delivery_settings: {
                                            ...formData.delivery_settings,
                                            max_radius_km: parseFloat(e.target.value) || 0
                                        }
                                    })}
                                />
                                <p className="text-xs text-gray-500">
                                    Distancia máxima para realizar envíos
                                </p>
                            </div>

                            {/* Delivery Fee */}
                            <div className="space-y-2">
                                <Label htmlFor="delivery_fee">Costo Envío ($)</Label>
                                <Input
                                    id="delivery_fee"
                                    name="delivery_fee"
                                    type="number"
                                    min="0"
                                    step="100"
                                    value={formData.delivery_settings.delivery_fee}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        delivery_settings: {
                                            ...formData.delivery_settings,
                                            delivery_fee: parseFloat(e.target.value) || 0
                                        }
                                    })}
                                />
                                <p className="text-xs text-gray-500">
                                    Costo adicional por domicilio
                                </p>
                            </div>

                            {/* Min Order Amount */}
                            <div className="space-y-2">
                                <Label htmlFor="min_order_amount">Pedido Mínimo para Domicilio ($)</Label>
                                <Input
                                    id="min_order_amount"
                                    name="min_order_amount"
                                    type="number"
                                    min="0"
                                    step="100"
                                    value={formData.delivery_settings.min_order_amount}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        delivery_settings: {
                                            ...formData.delivery_settings,
                                            min_order_amount: parseFloat(e.target.value) || 0
                                        }
                                    })}
                                />
                                <p className="text-xs text-gray-500">
                                    Monto mínimo para realizar domicilio
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Warehouse Location */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Warehouse className="w-5 h-5" />
                            Ubicación de Bodega
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <WarehouseLocationMap
                            initialLat={location.lat}
                            initialLng={location.lng}
                            address={formData.warehouse_address}
                            onAddressChange={(address: string) => setFormData({ ...formData, warehouse_address: address })}
                            onLocationChange={(lat: number, lng: number) => setLocation({ lat, lng })}
                            mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
                            isLoaded={isLoaded}
                            autocompleteRef={autocompleteRef}
                            onPlaceChanged={onPlaceChanged}
                        />
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end mt-6">
                <SubmitButton />
            </div>
        </form>
    );
}
