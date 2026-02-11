"use client"

import { useState, useEffect, useRef, useCallback, FormEvent } from 'react';
import { MapPin, Loader2, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import dynamic from 'next/dynamic';
import { useLoadScript, Libraries, Autocomplete } from '@react-google-maps/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// FIX for broken marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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

// Google Maps libraries
const libraries: Libraries = ['places'];

// Default coordinates for Bogotá, Colombia
const DEFAULT_LAT = 4.7110;
const DEFAULT_LNG = -74.0721;

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
    const [isClient, setIsClient] = useState(false);
    const [map, setMap] = useState<L.Map | null>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    // Load Google Maps script
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY as string,
        libraries,
    });

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                ...initialData,
                lat: initialData.lat || prev.lat,
                lng: initialData.lng || prev.lng,
            }));
            if (initialData.lat && initialData.lng) {
                const newPosition: [number, number] = [initialData.lat, initialData.lng];
                setMapPosition(newPosition);
            }
        }
    }, [initialData]);

    // Fly to new position when initial coordinates change
    useEffect(() => {
        if (map && formData.lat && formData.lng) {
            const newPosition: [number, number] = [formData.lat, formData.lng];
            setMapPosition(newPosition);
            // Add a small timeout to ensure map is fully rendered
            setTimeout(() => {
                try {
                    if (map && map.flyTo) {
                        map.flyTo(newPosition, 15, {
                            duration: 1.5
                        });
                    }
                } catch (e) {
                    console.log('Map not ready yet');
                }
            }, 100);
        }
    }, [formData.lat, formData.lng, map]);

    const onPlaceChanged = useCallback(() => {
        if (!autocompleteRef.current) return;

        const place = autocompleteRef.current.getPlace();

        // CRITICAL SAFETY CHECK
        if (!place || !place.geometry || !place.geometry.location) {
            console.log('No details available for input: ' + (place?.name || 'unknown'));
            return; // Stop execution, do not crash
        }

        // Safe to proceed
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        // Update map position and fly to location
        const newPosition: [number, number] = [lat, lng];
        setMapPosition(newPosition);
        // Add a small timeout to ensure map is fully rendered
        setTimeout(() => {
            try {
                if (map && map.flyTo) {
                    map.flyTo(newPosition, 15, { duration: 1.5 });
                }
            } catch (e) {
                console.log('Map not ready yet');
            }
        }, 100);

        // Update form data with coordinates and address
        setFormData(prev => ({
            ...prev,
            lat,
            lng,
            street_address: place.formatted_address || prev.street_address,
        }));

        // Parse address components to extract city, state, postal code, country
        // These are filled as HIDDEN fields for backend
        let city = '';
        let state = 'CI';
        let postalCode = '';
        let country = 'CO';

        if (place.address_components) {
            for (const component of place.address_components) {
                const types = component.types;
                if (types.includes('locality')) {
                    city = component.long_name;
                }
                if (types.includes('administrative_area_level_1')) {
                    // Map to Colombian department code
                    state = component.short_name;
                }
                if (types.includes('postal_code')) {
                    postalCode = component.long_name;
                }
                if (types.includes('country')) {
                    country = component.short_name;
                }
            }
        }

        // Update hidden fields (only if not already set or empty)
        setFormData(prev => ({
            ...prev,
            ...(city && { city }),
            ...(state && { state }),
            ...(postalCode && { postal_code: postalCode }),
            ...(country && { country }),
        }));
    }, [map]);

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocalización no soportada por tu navegador');
            return;
        }

        setIsLocating(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const newPosition: [number, number] = [latitude, longitude];
                setMapPosition(newPosition);
                setFormData(prev => ({ ...prev, lat: latitude, lng: longitude }));
                // Add a small timeout to ensure map is fully rendered
                setTimeout(() => {
                    try {
                        if (map && map.flyTo) {
                            map.flyTo(newPosition, 15, { duration: 1.5 });
                        }
                    } catch (e) {
                        console.log('Map not ready yet');
                    }
                }, 100);
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
        console.log('Form Submitted!');
        e.preventDefault();
        onSave(formData);
    };

    if (!isClient) {
        return (
            <div className="space-y-4 p-4">
                <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* TOP: Label Input */}
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
                <p className="text-xs text-gray-500 mt-1">Ej: Casa, Trabajo, Casa de mi mamá</p>
            </div>

            {/* MIDDLE: Google Address Search + Map */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="street_address">Buscar Dirección *</Label>
                    {!isLoaded ? (
                        <div className="flex items-center gap-2 p-3 border rounded-md bg-gray-50 text-gray-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Cargando buscador...</span>
                        </div>
                    ) : (
                        <div onKeyDown={(e) => e.stopPropagation()}>
                            <Autocomplete
                                onLoad={ref => {
                                    autocompleteRef.current = ref;
                                }}
                                onPlaceChanged={onPlaceChanged}
                                options={{ fields: ["geometry", "formatted_address", "address_components"] }}
                            >
                                <div className="relative">
                                    <Input
                                        id="street_address"
                                        type="text"
                                        placeholder="Escribe para buscar (ej: Calle 123 # 45-67, Bogotá)"
                                        value={formData.street_address}
                                        onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }
                                        }}
                                        required
                                    />
                                </div>
                            </Autocomplete>
                        </div>
                    )};
                    <p className="text-xs text-gray-500">
                        Escribe una dirección y selecciónala de la lista. Luego arrastra el pin a la ubicación exacta.
                    </p>
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
                                    <Navigation className="w-4 h-4 mr-2" />
                                    Usar mi ubicación
                                </>
                            )}
                        </Button>
                    </div>
                    <div className="h-64 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 relative z-0">
                        <MapContainer
                            ref={setMap as any}
                            key={`${mapPosition[0]}-${mapPosition[1]}`}
                            center={mapPosition}
                            zoom={15}
                            style={{ height: '100%', width: '100%' }}
                            scrollWheelZoom={true}
                        >
                            <TileLayer
                                attribution={process.env.NEXT_PUBLIC_MAPBOX_TOKEN
                                    ? '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>'
                                    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}
                                url={process.env.NEXT_PUBLIC_MAPBOX_TOKEN
                                    ? `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
                                    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
                            />
                            <DraggableMarker
                                key={`marker-${mapPosition[0]}-${mapPosition[1]}`}
                                position={mapPosition}
                                onPositionChange={handlePositionChange}
                            />
                        </MapContainer>
                    </div>
                    <p className="text-xs text-gray-400">
                        Arrastra el pin o haz clic en el mapa para refinar la ubicación exacta.
                    </p>
                </div>
            </div>

            {/* BOTTOM: Additional Info + Instructions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="additional_info">Número/Apartamento/Interior</Label>
                    <Input
                        id="additional_info"
                        type="text"
                        placeholder="Apt 202, Casa 5, Interior 3"
                        value={formData.additional_info}
                        onChange={(e) => setFormData({ ...formData, additional_info: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Número de casa, apartamento o interior</p>
                </div>
                <div>
                    <Label htmlFor="delivery_instructions">Instrucciones de Entrega</Label>
                    <Textarea
                        id="delivery_instructions"
                        placeholder="Frente al parque, al lado de la panadería..."
                        value={formData.delivery_instructions}
                        onChange={(e) => setFormData({ ...formData, delivery_instructions: e.target.value })}
                        rows={2}
                    />
                </div>
            </div>

            {/* HIDDEN INPUTS: Auto-filled by Google for backend */}
            <input type="hidden" name="city" value={formData.city} />
            <input type="hidden" name="state" value={formData.state} />
            <input type="hidden" name="postal_code" value={formData.postal_code} />
            <input type="hidden" name="country" value={formData.country} />
            <input type="hidden" name="lat" value={formData.lat} />
            <input type="hidden" name="lng" value={formData.lng} />

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
