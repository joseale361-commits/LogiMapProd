"use client";

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet icon fix
if (typeof window !== 'undefined') {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
}

function MapUpdater({ center }: { center: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 15, { animate: true, duration: 1.5 });
        }
    }, [center, map]);
    return null;
}

interface RoutesMapProps {
    orders: any[];
    center: [number, number];
    mapCenter: [number, number] | null;
    onOrderSelect: (id: string) => void;
    getMapPosition: (loc: any) => [number, number] | null;
    formatCurrency: (amount: number) => string;
}

export default function RoutesMap({
    orders,
    center,
    mapCenter,
    onOrderSelect,
    getMapPosition,
    formatCurrency
}: RoutesMapProps) {
    return (
        <div className="h-96 rounded-lg overflow-hidden border">
            <MapContainer
                center={center}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapUpdater center={mapCenter} />
                {orders.map((order) => {
                    const position = getMapPosition(order.delivery_location);
                    if (!position) return null;

                    return (
                        <Marker
                            key={order.id}
                            position={position}
                            eventHandlers={{
                                click: () => onOrderSelect(order.id),
                            }}
                        >
                            <Popup>
                                <div className="text-sm space-y-1">
                                    <div className="font-medium">{order.order_number}</div>
                                    <div className="text-gray-600">{order.customer.full_name}</div>
                                    <div className="text-gray-500">{order.delivery_address_text}</div>
                                    <div className="font-medium">{formatCurrency(order.total_amount)}</div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
