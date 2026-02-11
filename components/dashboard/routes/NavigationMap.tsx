"use client";

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet icon fix for Next.js - Create default icon manually
const iconDefault = L.icon({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});

// Apply the icon fix
L.Marker.prototype.options.icon = iconDefault;

// Custom destination icon (Green pin)
const destinationIcon = L.divIcon({
    className: 'destination-marker',
    html: `<div style="
        width: 40px;
        height: 40px;
        background-color: #22c55e;
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 3px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
    ">
        <div style="
            width: 12px;
            height: 12px;
            background-color: white;
            border-radius: 50%;
            transform: rotate(45deg);
        "></div>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
});

// User location icon (Blue dot with pulsing effect)
const userLocationIcon = L.divIcon({
    className: 'user-location-marker',
    html: `<div style="
        position: relative;
        width: 24px;
        height: 24px;
    ">
        <div style="
            position: absolute;
            width: 100%;
            height: 100%;
            background-color: #3b82f6;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
});

// Default center fallback (Bogotá, Colombia)
const DEFAULT_CENTER: [number, number] = [4.711, -74.072];

interface NavigationMapProps {
    targetLocation: [number, number];
}

// Component to handle location updates and auto-tracking
function LocationUpdater({
    targetLocation,
    userLocation
}: {
    targetLocation: [number, number] | null;
    userLocation: [number, number] | null;
}) {
    const map = useMap();
    const hasInitiallyFitBounds = useRef(false);

    useEffect(() => {
        if (!map) return;

        // Start location tracking with watch mode
        map.locate({ enableHighAccuracy: true, watch: true, maximumAge: 10000 });

        return () => {
            map.stopLocate();
        };
    }, [map]);

    useEffect(() => {
        if (!map) return;

        if (targetLocation && userLocation && !hasInitiallyFitBounds.current) {
            // Initial fit: show both user and target
            const bounds = L.latLngBounds([userLocation, targetLocation]);
            map.fitBounds(bounds, {
                padding: [50, 50],
                animate: true,
                duration: 1,
            });
            hasInitiallyFitBounds.current = true;
        } else if (userLocation && hasInitiallyFitBounds.current) {
            // Auto-track: keep map centered on driver
            map.flyTo(userLocation, map.getZoom(), { animate: true, duration: 0.5 });
        } else if (targetLocation && !hasInitiallyFitBounds.current) {
            // Just show target if user location not available yet
            map.flyTo(targetLocation, 15, { animate: true, duration: 1.5 });
        } else if (userLocation && !hasInitiallyFitBounds.current) {
            // Just show user if target not available
            map.flyTo(userLocation, 15, { animate: true, duration: 1.5 });
        }
    }, [map, targetLocation, userLocation]);

    return null;
}

// Component to handle location found events
function LocationHandler({
    onLocationFound
}: {
    onLocationFound: (location: [number, number]) => void
}) {
    const map = useMap();

    useEffect(() => {
        const handleLocationFound = (e: L.LocationEvent) => {
            onLocationFound([e.latlng.lat, e.latlng.lng]);
        };

        map.on('locationfound', handleLocationFound);

        return () => {
            map.off('locationfound', handleLocationFound);
        };
    }, [map, onLocationFound]);

    return null;
}

export default function NavigationMap({ targetLocation }: NavigationMapProps) {
    const [isClient, setIsClient] = useState(false);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [routeCoordinates, setRouteCoordinates] = useState<[number, number][] | null>(null);
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Fetch road-following route from Mapbox Directions API
    useEffect(() => {
        if (!userLocation || !targetLocation || !mapboxToken) return;

        const [userLat, userLng] = userLocation;
        const [targetLat, targetLng] = targetLocation;

        // Validate coordinates
        if (isNaN(userLat) || isNaN(userLng) || isNaN(targetLat) || isNaN(targetLng)) return;
        if (targetLat === 0 && targetLng === 0) return;

        const controller = new AbortController();

        const fetchRoute = async () => {
            try {
                const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${userLng},${userLat};${targetLng},${targetLat}?geometries=geojson&access_token=${mapboxToken}`;
                const response = await fetch(url, { signal: controller.signal });

                if (!response.ok) return;

                const data = await response.json();
                const route = data.routes?.[0];

                if (route?.geometry?.coordinates) {
                    // Mapbox returns [lng, lat], Leaflet needs [lat, lng]
                    const coords: [number, number][] = route.geometry.coordinates.map(
                        (coord: [number, number]) => [coord[1], coord[0]]
                    );
                    setRouteCoordinates(coords);
                }
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    console.error('Failed to fetch route:', err);
                }
            }
        };

        fetchRoute();

        return () => controller.abort();
    }, [userLocation, targetLocation, mapboxToken]);

    const handleLocationFound = (location: [number, number]) => {
        setUserLocation(location);
    };

    // Validate target location
    const isValidTarget = targetLocation &&
        Array.isArray(targetLocation) &&
        targetLocation.length === 2 &&
        !isNaN(targetLocation[0]) &&
        !isNaN(targetLocation[1]) &&
        targetLocation[0] !== 0 &&
        targetLocation[1] !== 0;

    // Calculate center between user and target, or use target as fallback
    const center: [number, number] = isValidTarget
        ? targetLocation
        : (userLocation ? userLocation : DEFAULT_CENTER);

    if (!isClient) {
        return (
            <div className="h-full w-full bg-gray-100 flex items-center justify-center rounded-lg">
                <div className="text-gray-500">Cargando mapa...</div>
            </div>
        );
    }

    return (
        <div className="h-full w-full rounded-lg overflow-hidden">
            <MapContainer
                center={center}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution={mapboxToken
                        ? '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>'
                        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}
                    url={mapboxToken
                        ? `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`
                        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
                />

                <LocationHandler onLocationFound={handleLocationFound} />
                <LocationUpdater targetLocation={isValidTarget ? targetLocation : null} userLocation={userLocation} />

                {/* User location marker */}
                {userLocation && (
                    <Marker
                        position={userLocation}
                        icon={userLocationIcon}
                    >
                        <div className="text-sm">
                            <div className="font-medium text-blue-600">📍 Tu ubicación</div>
                        </div>
                    </Marker>
                )}

                {/* Destination marker */}
                {isValidTarget && (
                    <Marker
                        position={targetLocation}
                        icon={destinationIcon}
                    >
                        <div className="text-sm">
                            <div className="font-medium text-green-600">🎯 Destino</div>
                        </div>
                    </Marker>
                )}

                {/* Road-following polyline from Mapbox Directions */}
                {routeCoordinates && routeCoordinates.length > 0 && (
                    <Polyline
                        positions={routeCoordinates}
                        pathOptions={{
                            color: '#3b82f6',
                            weight: 5,
                            opacity: 0.85,
                        }}
                    />
                )}

                {/* Fallback straight line if no route available */}
                {!routeCoordinates && userLocation && isValidTarget && (
                    <Polyline
                        positions={[userLocation, targetLocation]}
                        pathOptions={{
                            color: '#3b82f6',
                            weight: 4,
                            opacity: 0.6,
                            dashArray: '10, 10'
                        }}
                    />
                )}
            </MapContainer>
        </div>
    );
}
