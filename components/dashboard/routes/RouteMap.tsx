"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import for Leaflet to avoid SSR issues
const L = require('leaflet');

// Dynamic imports for Leaflet components to avoid SSR issues
const MapContainer = dynamic(
    () => import('react-leaflet').then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import('react-leaflet').then((mod) => mod.TileLayer),
    { ssr: false }
);
const Marker = dynamic(
    () => import('react-leaflet').then((mod) => mod.Marker),
    { ssr: false }
);
const Popup = dynamic(
    () => import('react-leaflet').then((mod) => mod.Popup),
    { ssr: false }
);
const Polyline = dynamic(
    () => import('react-leaflet').then((mod) => mod.Polyline),
    { ssr: false }
);

// Default center (Bogotá, Colombia)
const DEFAULT_CENTER: [number, number] = [4.711, -74.072];

interface RouteStop {
    id: string;
    customer_name: string;
    delivery_address_text: string;
    status: string;
    delivery_location?: {
        coordinates?: [number, number];
    };
    location_json?: {
        coordinates?: [number, number];
    } | null;
    customer_phone?: string;
    sequence_order: number;
}

interface RouteMapProps {
    stops: RouteStop[];
    currentStopId?: string;
    mapboxToken?: string;
    onStopClick?: (stop: RouteStop) => void;
    onNavigate?: (stop: RouteStop) => void;
    warehouseLocation?: [number, number]; // [lng, lat]
}

// Inner map component that uses hooks
function RouteMapInner({
    stops,
    currentStopId,
    mapboxToken,
    onStopClick,
    warehouseLocation,
}: RouteMapProps & { L: any }) {
    const [routeGeometry, setRouteGeometry] = useState<[number, number][] | null>(null);
    const [routeError, setRouteError] = useState(false);
    const mapRef = useRef<any>(null);

    // Get valid center from stops
    const validStops = useMemo(() => stops.filter(stop => {
        const location = stop.location_json?.coordinates || stop.delivery_location?.coordinates;
        return location && location[0] !== 0 && location[1] !== 0;
    }), [stops]);

    const defaultCenter: [number, number] = validStops.length > 0 && (validStops[0].location_json?.coordinates || validStops[0].delivery_location?.coordinates)
        ? [(validStops[0].location_json?.coordinates || validStops[0].delivery_location?.coordinates)![1], (validStops[0].location_json?.coordinates || validStops[0].delivery_location?.coordinates)![0]]
        : DEFAULT_CENTER;

    const currentStop = useMemo(() =>
        currentStopId
            ? stops.find(s => s.id === currentStopId)
            : stops.find(s => s.status === 'pending' || s.status === 'in_progress'),
        [currentStopId, stops]
    );

    useEffect(() => {
        const coords = currentStop?.location_json?.coordinates || currentStop?.delivery_location?.coordinates;
        if (mapRef.current && coords) {
            const [lng, lat] = coords;
            mapRef.current.flyTo([lat, lng], 15, { animate: true, duration: 1.5 });
        }
    }, [currentStop]);

    useEffect(() => {
        if (!mapboxToken || validStops.length < 2) {
            setRouteGeometry(null);
            setRouteError(false);
            return;
        }

        const fetchRoute = async () => {
            try {
                const coordinates: string[] = [];

                if (warehouseLocation && warehouseLocation[0] !== 0 && warehouseLocation[1] !== 0) {
                    coordinates.push(`${warehouseLocation[0]},${warehouseLocation[1]}`);
                }

                for (const stop of validStops) {
                    const coords = stop.location_json?.coordinates || stop.delivery_location?.coordinates;
                    if (coords && coords[0] !== 0 && coords[1] !== 0) {
                        coordinates.push(`${coords[0]},${coords[1]}`);
                    }
                }

                if (coordinates.length < 2) {
                    setRouteGeometry(null);
                    setRouteError(false);
                    return;
                }

                const coordinatesString = coordinates.join(';');
                const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinatesString}?geometries=geojson&access_token=${mapboxToken}`;

                const response = await fetch(url);
                if (!response.ok) throw new Error('Mapbox API request failed');

                const data = await response.json();

                if (data.routes && data.routes.length > 0 && data.routes[0].geometry) {
                    const coords: [number, number][] = data.routes[0].geometry.coordinates.map(
                        (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
                    );
                    setRouteGeometry(coords);
                    setRouteError(false);
                } else {
                    throw new Error('No route found');
                }
            } catch (error) {
                console.warn('[RouteMap] Error fetching route geometry:', error);
                setRouteError(true);
            }
        };

        fetchRoute();
    }, [warehouseLocation, validStops, mapboxToken]);

    useEffect(() => {
        if (!mapRef.current || !warehouseLocation) return;

        const hasStops = validStops.length > 0;
        const hasWarehouse = warehouseLocation && warehouseLocation[0] !== 0 && warehouseLocation[1] !== 0;

        if (!hasStops && !hasWarehouse) return;

        const { L: Leaflet } = window as any;
        if (!Leaflet) return;

        const bounds = Leaflet.latLngBounds([]);

        if (hasWarehouse) {
            bounds.extend([warehouseLocation[1], warehouseLocation[0]]);
        }

        validStops.forEach(stop => {
            const coords = stop.location_json?.coordinates || stop.delivery_location?.coordinates!;
            if (coords && coords[0] !== 0 && coords[1] !== 0) {
                const [lng, lat] = coords;
                bounds.extend([lat, lng]);
            }
        });

        if (bounds.isValid() && bounds.getNorthEast()) {
            mapRef.current.fitBounds(bounds, {
                padding: [50, 50],
                maxZoom: 16,
                animate: true,
                duration: 1,
            });
        }
    }, [validStops, warehouseLocation]);

    const completedPositions = useMemo(() => {
        const positions: [number, number][] = [];

        if (warehouseLocation && warehouseLocation[0] !== 0 && warehouseLocation[1] !== 0) {
            positions.push([warehouseLocation[1], warehouseLocation[0]]);
        }

        for (const stop of validStops) {
            const coords = stop.location_json?.coordinates || stop.delivery_location?.coordinates;
            if (coords && coords[0] !== 0 && coords[1] !== 0) {
                positions.push([coords[1], coords[0]]);
            }
            if (stop.status === 'delivered' || stop.status === 'failed') continue;
            else break;
        }

        return positions;
    }, [warehouseLocation, validStops]);

    const pendingPositions = useMemo(() => {
        const positions: [number, number][] = [];

        const lastCompletedIndex = validStops.findIndex(stop =>
            stop.status !== 'delivered' && stop.status !== 'failed'
        );

        const startIndex = lastCompletedIndex === -1 ? validStops.length : lastCompletedIndex;

        if (warehouseLocation && warehouseLocation[0] !== 0 && warehouseLocation[1] !== 0) {
            positions.push([warehouseLocation[1], warehouseLocation[0]]);
        }

        for (let i = startIndex; i < validStops.length; i++) {
            const stop = validStops[i];
            const coords = stop.location_json?.coordinates || stop.delivery_location?.coordinates;
            if (coords && coords[0] !== 0 && coords[1] !== 0) {
                positions.push([coords[1], coords[0]]);
            }
        }

        return positions;
    }, [warehouseLocation, validStops]);

    const createCustomIcon = (color: string, size: number = 30) => {
        return L.divIcon({
            className: 'custom-marker',
            html: `<div style="width: ${size}px; height: ${size}px; background-color: ${color}; border: 3px solid white; border-radius: 50%; box-shadow: 0 3px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">●</div>`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
            popupAnchor: [0, -size / 2],
        });
    };

    const pendingIcon = createCustomIcon('#3b82f6', 32);
    const deliveredIcon = createCustomIcon('#22c55e', 32);
    const failedIcon = createCustomIcon('#ef4444', 32);
    const currentIcon = createCustomIcon('#f59e0b', 40);
    const warehouseIcon = createCustomIcon('#1f2937', 36);

    return (
        <MapContainer
            center={defaultCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
            ref={(ref: any) => {
                if (ref && ref.leafletElement) {
                    mapRef.current = ref.leafletElement;
                }
            }}
        >
            <TileLayer
                attribution={mapboxToken
                    ? '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}
                url={mapboxToken
                    ? `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`
                    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
            />

            {warehouseLocation && warehouseLocation[0] !== 0 && warehouseLocation[1] !== 0 && (
                <Marker position={[warehouseLocation[1], warehouseLocation[0]]} icon={warehouseIcon}>
                    <Popup>
                        <div className="text-sm">
                            <div className="font-medium">🏭 Bodega</div>
                            <div className="text-gray-600">Punto de inicio</div>
                        </div>
                    </Popup>
                </Marker>
            )}

            {routeGeometry && routeGeometry.length > 1 && !routeError ? (
                <Polyline positions={routeGeometry} color="#22c55e" weight={4} opacity={0.8} />
            ) : completedPositions.length > 1 ? (
                <Polyline positions={completedPositions} color="#22c55e" weight={4} opacity={0.8} />
            ) : null}

            {routeGeometry && routeGeometry.length > 1 && !routeError ? (
                <Polyline positions={routeGeometry} color="#3b82f6" weight={4} opacity={0.7} dashArray="10, 10" />
            ) : pendingPositions.length > 1 ? (
                <Polyline positions={pendingPositions} color="#3b82f6" weight={4} opacity={0.7} dashArray="10, 10" />
            ) : null}

            {validStops.map((stop, index) => {
                const coords = stop.location_json?.coordinates || stop.delivery_location?.coordinates;
                if (!coords || coords[0] === 0 || coords[1] === 0) return null;

                const [lng, lat] = coords;
                let icon;
                if (currentStopId === stop.id) icon = currentIcon;
                else if (stop.status === 'delivered') icon = deliveredIcon;
                else if (stop.status === 'failed') icon = failedIcon;
                else icon = pendingIcon;

                return (
                    <Marker
                        key={stop.id}
                        position={[lat, lng]}
                        icon={icon}
                        eventHandlers={{ click: () => onStopClick?.(stop) }}
                    >
                        <Popup>
                            <div className="text-sm">
                                <div className="font-medium">Parada #{index + 1}</div>
                                <div className="text-gray-600">{stop.customer_name}</div>
                                <div className="text-gray-500 text-xs">{stop.delivery_address_text}</div>
                                <div className={`mt-1 text-xs ${stop.status === 'delivered' ? 'text-green-600' : stop.status === 'failed' ? 'text-red-600' : 'text-blue-600'}`}>
                                    Estado: {stop.status}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}

// Main component with SSR protection
export default function RouteMap(props: RouteMapProps) {
    const [isClient, setIsClient] = useState(false);
    const [L, setL] = useState<any>(null);
    const containerId = useMemo(() => `route-map-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, []);

    useEffect(() => {
        setIsClient(true);

        import('leaflet').then((leaflet: any) => {
            const L_Instance = leaflet.default || leaflet;
            setL(L_Instance);

            // FIX for broken marker icons
            delete (L_Instance.Icon.Default.prototype as any)._getIconUrl;
            L_Instance.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
            });
        }).catch((err: Error) => {
            console.error('[RouteMap] Error loading Leaflet:', err);
        });
    }, []);

    if (!isClient) {
        return (
            <div id={containerId} className="h-64 bg-gray-100 flex items-center justify-center rounded-lg">
                <div className="text-gray-500">Cargando mapa...</div>
            </div>
        );
    }

    return (
        <div id={containerId} className="h-64 rounded-lg overflow-hidden border border-gray-200">
            {L ? <RouteMapInner {...props} L={L} /> : (
                <div className="h-full flex items-center justify-center bg-gray-100">
                    <div className="text-gray-500">Cargando mapa...</div>
                </div>
            )}
        </div>
    );
}

// Add Leaflet type to window
declare global {
    interface Window {
        L: any;
    }
}
