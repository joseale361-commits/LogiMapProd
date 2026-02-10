"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Save, Check, AlertCircle, Palette, Phone, Image, Map } from 'lucide-react';

interface Distributor {
    id: string;
    name: string;
    slug: string;
    phone: string | null;
    logo_url: string | null;
    settings: {
        theme_color?: string;
    } | null;
    delivery_zones: any;
    created_at: string;
    updated_at: string;
}

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default function SettingsPage({ params }: PageProps) {
    const [slug, setSlug] = useState<string>('');
    const [distributor, setDistributor] = useState<Distributor | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        logo_url: '',
        theme_color: '#3b82f6',
        delivery_zones: '',
    });

    useEffect(() => {
        params.then(({ slug }) => {
            setSlug(slug);
            fetchSettings(slug);
        });
    }, [params]);

    const fetchSettings = async (distributorSlug: string) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/dashboard/${distributorSlug}/settings`);
            const data = await response.json();

            if (data.success) {
                setDistributor(data.distributor);
                setFormData({
                    name: data.distributor.name || '',
                    phone: data.distributor.phone || '',
                    logo_url: data.distributor.logo_url || '',
                    theme_color: (data.distributor.settings as any)?.theme_color || '#3b82f6',
                    delivery_zones: data.distributor.delivery_zones
                        ? JSON.stringify(data.distributor.delivery_zones, null, 2)
                        : '',
                });
            } else {
                showNotification('error', data.error || 'Error al cargar la configuración');
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            showNotification('error', 'Error al cargar la configuración');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            // Parse delivery zones JSON
            let deliveryZones = null;
            if (formData.delivery_zones.trim()) {
                try {
                    deliveryZones = JSON.parse(formData.delivery_zones);
                } catch (e) {
                    showNotification('error', 'El formato de las zonas de entrega no es válido JSON');
                    setSaving(false);
                    return;
                }
            }

            const response = await fetch(`/api/dashboard/${slug}/settings`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    phone: formData.phone,
                    logo_url: formData.logo_url || null,
                    theme_color: formData.theme_color,
                    delivery_zones: deliveryZones,
                }),
            });
            const data = await response.json();

            if (data.success) {
                showNotification('success', 'Configuración guardada exitosamente');
                setDistributor(data.distributor);
            } else {
                showNotification('error', data.error || 'Error al guardar la configuración');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            showNotification('error', 'Error al guardar la configuración');
        } finally {
            setSaving(false);
        }
    };

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleLogoUpload = () => {
        // TODO: Implement logo upload functionality
        // For now, just show a placeholder
        showNotification('error', 'La función de subir logo aún no está implementada. Por favor usa una URL.');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Configuración de Tienda</h1>
                <p className="text-gray-600 mt-1">
                    Personaliza la información y apariencia de tu tienda
                </p>
            </div>

            {/* Notification */}
            {notification && (
                <div className={`p-4 rounded-lg ${notification.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                    <div className="flex items-center gap-2">
                        {notification.type === 'success' ? (
                            <Check className="w-5 h-5" />
                        ) : (
                            <AlertCircle className="w-5 h-5" />
                        )}
                        <span>{notification.message}</span>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="text-gray-500">Cargando configuración...</div>
                </div>
            ) : (
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
                                    placeholder="Ej: Mi Tienda"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Teléfono WhatsApp</Label>
                                <Input
                                    id="phone"
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
                            <div className="space-y-2">
                                <Label htmlFor="logo_url">URL del Logo</Label>
                                <Input
                                    id="logo_url"
                                    type="url"
                                    placeholder="https://ejemplo.com/logo.png"
                                    value={formData.logo_url}
                                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                                />
                            </div>
                            {formData.logo_url && (
                                <div className="flex items-center justify-center p-4 border rounded-lg bg-gray-50">
                                    <img
                                        src={formData.logo_url}
                                        alt="Logo preview"
                                        className="max-h-24 object-contain"
                                        onError={() => showNotification('error', 'No se pudo cargar la imagen del logo')}
                                    />
                                </div>
                            )}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleLogoUpload}
                                className="w-full"
                            >
                                Subir Logo (Próximamente)
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Theme Color */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="w-5 h-5" />
                                Color de Tema
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="theme_color">Color Principal</Label>
                                <div className="flex items-center gap-3">
                                    <Input
                                        id="theme_color"
                                        type="color"
                                        value={formData.theme_color}
                                        onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                                        className="w-20 h-10 p-1 cursor-pointer"
                                    />
                                    <Input
                                        type="text"
                                        value={formData.theme_color}
                                        onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                                        placeholder="#3b82f6"
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                            <div className="p-4 rounded-lg border" style={{ backgroundColor: `${formData.theme_color}20` }}>
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: formData.theme_color }}
                                    />
                                    <span className="text-sm font-medium" style={{ color: formData.theme_color }}>
                                        Vista previa del color
                                    </span>
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
                                    placeholder={`{\n  "zones": [\n    {\n      "name": "Zona Centro",\n      "base_fee": 5000,\n      "min_order": 20000\n    }\n  ]\n}`}
                                    value={formData.delivery_zones}
                                    onChange={(e) => setFormData({ ...formData, delivery_zones: e.target.value })}
                                    rows={10}
                                    className="font-mono text-sm"
                                />
                                <p className="text-xs text-gray-500">
                                    Define las zonas de entrega en formato JSON. Deja vacío para desactivar.
                                </p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                                <p className="font-medium mb-1">Ejemplo de estructura:</p>
                                <pre className="text-xs text-blue-700 overflow-x-auto">
                                    {`{
  "zones": [
    {
      "name": "Zona Centro",
      "base_fee": 5000,
      "min_order": 20000,
      "polygon": [[...]]
    }
  ]
}`}
                                </pre>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Save Button */}
            {!loading && (
                <div className="flex justify-end">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </div>
            )}
        </div>
    );
}
