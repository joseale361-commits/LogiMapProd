"use client"

import { useState, useEffect, useRef, useCallback, FormEvent } from 'react';
import { MapPin, Loader2, Navigation, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import dynamic from 'next/dynamic';
import { useLoadScript, Libraries, Autocomplete } from '@react-google-maps/api';
import L from 'leaflet';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { saveAddressAction } from '@/lib/actions/address';

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

export interface AddressPageFormData {
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

interface AddressPageFormProps {
    initialData?: Partial<AddressPageFormData>;
    customerId?: string;
}

export function AddressPageForm({ initialData, customerId }: AddressPageFormProps) {
    const [formData, setFormData] = useState<AddressPageFormData>({
        label: '',
        street_address: '',
        city: '',
        state: 'CI',
        postal_code: '',
        country: 'CO',
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
    const [isLoading, setIsLoading] = useState(false);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const router = useRouter();

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

        if (!place || !place.geometry || !place.geometry.location) {
            console.log('No details available for input: ' + (place?.name || 'unknown'));
            return;
        }

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        const newPosition: [number, number] = [lat, lng];
        setMapPosition(newPosition);
        setTimeout(() => {
            try {
                if (map && map.flyTo) {
                    map.flyTo(newPosition, 15, { duration: 1.5 });
                }
            } catch (e) {
                console.log('Map not ready yet');
            }
        }, 100);

        setFormData(prev => ({
            ...prev,
            lat,
            lng,
            street_address: place.formatted_address || prev.street_address,
        }));

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
            toast.error('Geolocalización no soportada por tu navegador');
            return;
        }

        setIsLocating(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const newPosition: [number, number] = [latitude, longitude];
                setMapPosition(newPosition);
                setFormData(prev => ({ ...prev, lat: latitude, lng: longitude }));
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
                toast.error('No se pudo obtener tu ubicación.');
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

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await saveAddressAction(formData, customerId);

            if (result.success) {
                toast.success('Dirección guardada correctamente');
                router.back();
            } else {
                toast.error(result.error || 'Error al guardar la dirección');
            }
        } catch (error) {
            toast.error('Error inesperado');
            console.error('Error submitting address:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isClient) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            {/* Sticky Header with Back and Save buttons */}
            <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link
                        href="javascript:history.back()"
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-lg font-semibold">
                        {initialData?.id ? 'Editar Dirección' : 'Nueva Dirección'}
                    </h1>
                </div>
                <Button type="submit" disabled={isLoading} size="sm">
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        <>
                            <Check className="w-4 h-4 mr-2" />
                            Guardar
                        </>
                    )}
                </Button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-6 pb-24">
                    {/* Google Address Search */}
                    <div className="space-y-3">
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
                        )}
                        <p className="text-xs text-gray-500">
                            Escribe una dirección y selecciónala de la lista.
                        </p>
                    </div>

                    {/* Map Section - Takes most of the screen */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Ubicación en el Mapa</Label>
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
                                        Mi ubicación
                                    </>
                                )}
                            </Button>
                        </div>
                        <div className="h-[45vh] rounded-lg overflow-hidden border border-gray-200 bg-gray-100 relative z-0">
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
                            Arrastra el pin para refinar la ubicación exacta.
                        </p>
                    </div>

                    {/* Label Input */}
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
                        <p className="text-xs text-gray-500 mt-1">Ej: Casa, Trabajo, Casa de mamá</p>
                    </div>

                    {/* Additional Info + Instructions */}
                    <div className="space-y-4">
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
                </div>
            </div>
        </form>
    );
}
