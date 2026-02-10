"use client"

import { useState, useEffect, FormEvent } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import dynamic from 'next/dynamic';
import { getColombianDepartments, getCountries } from '@/lib/utils/location';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
    () => import('react-leaflet').then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import('react-leaflet').then((mod) => mod.TileLayer),
    { ssr: false }
);
const DraggableMarker = dynamic(
    () => import('@/components/shop/DraggableMarker').then((mod) => mod.DraggableMarker),
    { ssr: false }
);

// Get departments and countries from utility functions
const COLOMBIAN_DEPARTMENTS = getColombianDepartments();
const COUNTRIES = getCountries();

export interface AddressFormData {
    id?: string;
    label: string;
    street_address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    additional_info: string;
    delivery_instructions: string;
    lat: number;
    lng: number;
    is_default?: boolean;
}

// Default coordinates for Bogotá, Colombia
const DEFAULT_LAT = 4.7110;
const DEFAULT_LNG = -74.0721;

interface AddressFormProps {
    initialData?: Partial<AddressFormData>;
    onSave: (data: AddressFormData) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export function AddressForm({ initialData, onSave, onCancel, isLoading = false }: AddressFormProps) {
    const [formData, setFormData] = useState<AddressFormData>({
        label: '',
        street_address: '',
        city: '',
        state: 'CI', // Default to Cundinamarca (Bogotá)
        postal_code: '',
        country: 'CO', // Default to Colombia (2-letter code)
        additional_info: '',
        delivery_instructions: '',
        lat: DEFAULT_LAT,
        lng: DEFAULT_LNG,
        is_default: false,
    });
    const [isLocating, setIsLocating] = useState(false);
    const [mapPosition, setMapPosition] = useState<[number, number]>([DEFAULT_LAT, DEFAULT_LNG]);

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                ...initialData,
                lat: initialData.lat || prev.lat,
                lng: initialData.lng || prev.lng,
            }));
            if (initialData.lat && initialData.lng) {
                setMapPosition([initialData.lat, initialData.lng]);
            }
        }
    }, [initialData]);

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocalización no soportada por tu navegador');
            return;
        }

        setIsLocating(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setMapPosition([latitude, longitude]);
                setFormData(prev => ({ ...prev, lat: latitude, lng: longitude }));
                setIsLocating(false);
            },
            (error) => {
                console.error('Error getting location:', error);
                alert('No se pudo obtener tu ubicación.');
                setIsLocating(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    const handlePositionChange = (position: [number, number]) => {
        setMapPosition(position);
        setFormData(prev => ({ ...prev, lat: position[0], lng: position[1] }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="label">Etiqueta *</Label>
                    <Input
                        id="label"
                        type="text"
                        placeholder="Casa, Oficina, etc."
                        value={formData.label}
                        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <Label htmlFor="city">Ciudad *</Label>
                    <Input
                        id="city"
                        type="text"
                        placeholder="Bogotá"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        required
                    />
                </div>
            </div>

            <div>
                <Label htmlFor="street_address">Dirección *</Label>
                <Input
                    id="street_address"
                    type="text"
                    placeholder="Calle 123 # 45-67"
                    value={formData.street_address}
                    onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="state">Departamento *</Label>
                    <Select
                        value={formData.state}
                        onValueChange={(value) => setFormData({ ...formData, state: value })}
                        required
                    >
                        <SelectTrigger id="state">
                            <SelectValue placeholder="Departamento" />
                        </SelectTrigger>
                        <SelectContent>
                            {COLOMBIAN_DEPARTMENTS.map((dept) => (
                                <SelectItem key={dept.code} value={dept.code}>
                                    {dept.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="postal_code">Código Postal (Opcional)</Label>
                    <Input
                        id="postal_code"
                        type="text"
                        placeholder="110111"
                        value={formData.postal_code}
                        onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    />
                </div>
            </div>

            <div>
                <Label htmlFor="country">País *</Label>
                <Select
                    value={formData.country}
                    onValueChange={(value) => setFormData({ ...formData, country: value })}
                    required
                >
                    <SelectTrigger id="country">
                        <SelectValue placeholder="País" />
                    </SelectTrigger>
                    <SelectContent>
                        {COUNTRIES.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                                {country.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label htmlFor="additional_info">Información Adicional</Label>
                <Textarea
                    id="additional_info"
                    placeholder="Apartamento, torre, piso, etc."
                    value={formData.additional_info}
                    onChange={(e) => setFormData({ ...formData, additional_info: e.target.value })}
                    rows={2}
                />
            </div>

            <div>
                <Label htmlFor="delivery_instructions">Instrucciones de Entrega</Label>
                <Textarea
                    id="delivery_instructions"
                    placeholder="Dejar con portero, timbrar, llamar, etc."
                    value={formData.delivery_instructions}
                    onChange={(e) => setFormData({ ...formData, delivery_instructions: e.target.value })}
                    rows={2}
                />
            </div>

            {/* Map Section */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>Ubicación en el Mapa *</Label>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGetCurrentLocation}
                        disabled={isLocating}
                    >
                        {isLocating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Obteniendo...
                            </>
                        ) : (
                            <>
                                <MapPin className="w-4 h-4 mr-2" />
                                Usar mi ubicación
                            </>
                        )}
                    </Button>
                </div>
                <div className="h-64 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 relative z-0">
                    <MapContainer
                        key={`${mapPosition[0]}-${mapPosition[1]}`}
                        center={mapPosition}
                        zoom={15}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <DraggableMarker
                            position={mapPosition}
                            onPositionChange={handlePositionChange}
                        />
                    </MapContainer>
                </div>
                <div className="text-xs text-gray-500">
                    Coordenadas: {formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        'Guardar Dirección'
                    )}
                </Button>
            </div>
        </form>
    );
}
