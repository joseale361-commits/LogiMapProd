"use client"

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Autocomplete } from '@react-google-maps/api';

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

// Default coordinates for Bogotá, Colombia
const DEFAULT_LAT = 4.7110;
const DEFAULT_LNG = -74.0721;

interface WarehouseLocationMapProps {
    initialLat?: number | null;
    initialLng?: number | null;
    onLocationChange: (lat: number, lng: number) => void;
    address?: string;
    onAddressChange?: (address: string) => void;
    mapboxToken?: string;
    isLoaded?: boolean;
    autocompleteRef?: React.MutableRefObject<google.maps.places.Autocomplete | null>;
    onPlaceChanged?: () => void;
}

export function WarehouseLocationMap({
    initialLat,
    initialLng,
    onLocationChange,
    address = '',
    onAddressChange,
    mapboxToken,
    isLoaded,
    autocompleteRef,
    onPlaceChanged
}: WarehouseLocationMapProps) {
    const [mapPosition, setMapPosition] = useState<[number, number]>([DEFAULT_LAT, DEFAULT_LNG]);
    const [isLocating, setIsLocating] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [map, setMap] = useState<L.Map | null>(null);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Initialize map position from props on mount
    useEffect(() => {
        if (initialLat && initialLng) {
            const newPosition: [number, number] = [initialLat, initialLng];
            setMapPosition(newPosition);
        } else if (initialLat === null || initialLng === null) {
            // Handle null/undefined - use default
            setMapPosition([DEFAULT_LAT, DEFAULT_LNG]);
        }
    }, [initialLat, initialLng]); // Run on mount and when props change

    // Fly to new position when initial coordinates change from the outside (server)
    useEffect(() => {
        if (map && initialLat && initialLng) {
            const newPosition: [number, number] = [initialLat, initialLng];
            setMapPosition(newPosition);
            map.flyTo(newPosition, 13, {
                duration: 1.5
            });
        }
    }, [initialLat, initialLng, map]);

    const handlePositionChange = (position: [number, number]) => {
        setMapPosition(position);
        onLocationChange(position[0], position[1]);
    };

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocalización no soportada por tu navegador');
            return;
        }

        setIsLocating(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                handlePositionChange([latitude, longitude]);
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

    if (!isClient) {
        return (
            <div className="h-[400px] w-full flex items-center justify-center bg-gray-100 rounded-lg">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {onAddressChange && (
                <div className="space-y-2 relative">
                    <Label htmlFor="warehouse_address">Dirección de la Bodega</Label>
                    {!isLoaded ? (
                        <div className="flex items-center gap-2 p-3 border rounded-md bg-gray-50 text-gray-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Cargando buscador...</span>
                        </div>
                    ) : (
                        <Autocomplete
                            onLoad={ref => {
                                if (autocompleteRef) autocompleteRef.current = ref;
                            }}
                            onPlaceChanged={() => {
                                if (onPlaceChanged) onPlaceChanged();
                            }}
                        >
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        id="warehouse_address"
                                        type="text"
                                        className="flex-1 pr-10"
                                        placeholder="Escribe para buscar (ej: Bello, Antioquia)"
                                        defaultValue={address}
                                        onChange={(e) => {
                                            if (onAddressChange) onAddressChange(e.target.value);
                                        }}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleGetCurrentLocation}
                                    disabled={isLocating}
                                    title="Usar mi ubicación actual"
                                >
                                    {isLocating ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Navigation className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                        </Autocomplete>
                    )}
                    <p className="text-xs text-gray-500">
                        Escribe una dirección y selecciona de la lista de Google. Luego arrastra el pin a la ubicación exacta si es necesario.
                    </p>
                </div>
            )}

            <div className="h-[400px] w-full rounded-lg overflow-hidden border border-gray-200">
                <MapContainer
                    ref={setMap as any}
                    center={mapPosition}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                >
                    <TileLayer
                        attribution={mapboxToken
                            ? '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>'
                            : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}
                        url={mapboxToken
                            ? `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`
                            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
                    />
                    <DraggableMarker
                        position={mapPosition}
                        onPositionChange={handlePositionChange}
                    />
                </MapContainer>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin className="w-4 h-4" />
                <span>
                    Lat: {mapPosition[0].toFixed(6)}, Lng: {mapPosition[1].toFixed(6)}
                </span>
            </div>

            <p className="text-xs text-gray-400">
                Arrastra el pin o haz clic en el mapa para ubicar la bodega. También puedes usar el botón de geolocalización.
            </p>
        </div>
    );
}
