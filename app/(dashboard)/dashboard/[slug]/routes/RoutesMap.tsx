"use client";

import { useEffect, useMemo, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
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

// Custom icons
const createCustomIcon = (color: string, size: number = 30) => {
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="
            width: ${size}px;
            height: ${size}px;
            background-color: ${color};
            border: 3px solid white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 3px 6px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size],
    });
};

const grayIcon = createCustomIcon('#6b7280', 28); // Gray for normal orders
const blueIcon = createCustomIcon('#3b82f6', 36); // Blue for selected orders
const redIcon = createCustomIcon('#ef4444', 40);  // Red for warehouse

// Default center fallback (Bogotá, Colombia)
const DEFAULT_CENTER: [number, number] = [4.711, -74.072];

// Type definitions
type SelectedOrdersType = Set<string> | string[];

// Helper to check if an order is selected (works with both Set and Array)
const isOrderSelected = (orderId: string, selectedOrders: SelectedOrdersType): boolean => {
    if (selectedOrders instanceof Set) {
        return selectedOrders.has(orderId);
    }
    return (selectedOrders as string[]).includes(orderId);
};

// Helper to get array from Set or Array
const toArray = (selectedOrders: SelectedOrdersType): string[] => {
    if (selectedOrders instanceof Set) {
        return Array.from(selectedOrders);
    }
    return selectedOrders;
};

// Helper to get count from Set or Array
const getCount = (selectedOrders: SelectedOrdersType): number => {
    if (selectedOrders instanceof Set) {
        return selectedOrders.size;
    }
    return selectedOrders.length;
};

interface RoutesMapProps {
    orders: any[];
    center: [number, number];
    mapCenter: [number, number] | null;
    selectedOrders: SelectedOrdersType;
    warehouseLocation: [number, number] | null;
    onOrderSelect: (id: string) => void;
    getMapPosition: (order: any) => [number, number] | null;
    formatCurrency: (amount: number) => string;
    mapboxToken?: string;
}

// Component to handle map center updates
function MapUpdater({ center }: { center: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 15, { animate: true, duration: 1.5 });
        }
    }, [center, map]);
    return null;
}

// Component to handle auto-fit bounds when selection changes
function BoundsUpdater({
    positions,
    warehouseLocation,
    selectionVersion
}: {
    positions: [number, number][];
    warehouseLocation: [number, number] | null;
    selectionVersion: number;
}) {
    const map = useMap();

    useEffect(() => {
        if (positions.length === 0 && !warehouseLocation) return;

        const bounds = L.latLngBounds([]);

        if (warehouseLocation) {
            bounds.extend(warehouseLocation);
        }

        positions.forEach(pos => bounds.extend(pos));

        if (bounds.isValid()) {
            // Add some padding
            map.fitBounds(bounds, {
                padding: [50, 50],
                animate: true,
                duration: 1,
            });
        }
    }, [positions, warehouseLocation, selectionVersion, map]);

    return null;
}

export default function RoutesMap({
    orders,
    center,
    mapCenter,
    selectedOrders,
    warehouseLocation,
    onOrderSelect,
    getMapPosition,
    formatCurrency,
    mapboxToken
}: RoutesMapProps) {
    // Hydration guard
    const [isClient, setIsClient] = useState(false);
    const [selectionVersion, setSelectionVersion] = useState(0);
    const prevSelectedRef = useRef<string>('');

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Increment version when selection changes to trigger bounds update
    useEffect(() => {
        setSelectionVersion(prev => prev + 1);
    }, [selectedOrders]);

    // Convert selectedOrders to array for consistent handling
    const selectedOrdersArray = useMemo(() => toArray(selectedOrders), [selectedOrders]);

    // Track selection changes for reactivity
    const selectedOrdersKey = useMemo(() => JSON.stringify(selectedOrdersArray), [selectedOrdersArray]);

    // Get positions for selected orders
    const selectedPositions = useMemo(() => {
        const validOrders = selectedOrdersArray
            .map((id: string) => orders.find((o: any) => o.id === id))
            .filter((o: any) => o);

        return validOrders
            .map((o: any) => getMapPosition(o))
            .filter((p: [number, number] | null): p is [number, number] => p !== null);
    }, [JSON.stringify(selectedOrdersArray), orders, getMapPosition]);

    // Create polyline positions (warehouse first, then selected orders)
    const polylinePositions = useMemo(() => {
        const positions: [number, number][] = [];
        if (warehouseLocation &&
            Array.isArray(warehouseLocation) &&
            warehouseLocation.length === 2 &&
            !isNaN(warehouseLocation[0]) &&
            !isNaN(warehouseLocation[1])) {
            positions.push(warehouseLocation as [number, number]);
        }
        positions.push(...selectedPositions);
        return positions;
    }, [warehouseLocation, selectedPositions]);

    // Get selection count for polyline dashArray
    const selectedCount = useMemo(() => getCount(selectedOrders), [selectedOrders]);

    // Validar center y usar punto por defecto si es inválido
    // Also consider warehouseLocation for centering
    const getDefaultCenter = (): [number, number] => DEFAULT_CENTER;

    const validCenter: [number, number] = center &&
        Array.isArray(center) &&
        center.length === 2 &&
        !isNaN(center[0]) &&
        !isNaN(center[1])
        ? center
        : (warehouseLocation &&
            Array.isArray(warehouseLocation) &&
            warehouseLocation.length === 2 &&
            !isNaN(warehouseLocation[0]) &&
            !isNaN(warehouseLocation[1])
            ? warehouseLocation
            : getDefaultCenter());

    if (!isClient) {
        return (
            <div className="h-96 bg-gray-100 flex items-center justify-center rounded-lg">
                <div className="text-gray-500">Cargando mapa...</div>
            </div>
        );
    }

    return (
        <div className="h-96 rounded-lg overflow-hidden border" data-selected-orders={selectedOrdersKey}>
            <MapContainer
                center={validCenter}
                zoom={12}
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
                <MapUpdater center={mapCenter} />
                <BoundsUpdater positions={selectedPositions} warehouseLocation={warehouseLocation} selectionVersion={selectionVersion} />

                {/* Warehouse marker (red) */}
                {warehouseLocation &&
                    Array.isArray(warehouseLocation) &&
                    warehouseLocation.length === 2 &&
                    !isNaN(warehouseLocation[0]) &&
                    !isNaN(warehouseLocation[1]) &&
                    warehouseLocation[0] !== 0 &&
                    warehouseLocation[1] !== 0 && (
                        <Marker
                            position={warehouseLocation as [number, number]}
                            icon={redIcon}
                        >
                            <Popup>
                                <div className="text-sm">
                                    <div className="font-medium text-red-600">🏭 Bodega</div>
                                    <div className="text-gray-500">Punto de partida</div>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                {/* Route polyline */}
                {polylinePositions.length > 1 && (
                    <Polyline
                        positions={polylinePositions}
                        pathOptions={{
                            color: '#3b82f6',
                            weight: 4,
                            opacity: 0.8,
                            dashArray: selectedCount > 0 ? undefined : '10, 10'
                        }}
                    />
                )}

                {/* Order markers */}
                {orders.map((order) => {
                    const position = getMapPosition(order);
                    // Skip invalid positions (null, undefined, or [0, 0] which is in Atlantic Ocean)
                    if (!position || position[0] === 0 || position[1] === 0) {
                        console.warn('[RoutesMap] Skipping order with invalid position:', order.id, position);
                        return null;
                    }

                    const isSelected = isOrderSelected(order.id, selectedOrders);

                    return (
                        <Marker
                            key={order.id}
                            position={position}
                            icon={isSelected ? blueIcon : grayIcon}
                            eventHandlers={{
                                click: () => {
                                    onOrderSelect(order.id);
                                },
                            }}
                        >
                            <Popup>
                                <div className="text-sm space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{order.order_number}</span>
                                        {isSelected && (
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                                ✓ Seleccionado
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-gray-600">{order.customer.full_name}</div>
                                    <div className="text-gray-500 text-xs">{order.address}</div>
                                    <div className="font-medium text-green-600">{formatCurrency(order.total_amount)}</div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
