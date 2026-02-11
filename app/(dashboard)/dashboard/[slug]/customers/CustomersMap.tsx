"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin } from 'lucide-react';

// Custom marker icons for different customer statuses
const createStatusIcon = (color: string) => {
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="
            background-color: ${color};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
    });
};

const greenIcon = createStatusIcon('#22c55e'); // Green - active 7 days
const yellowIcon = createStatusIcon('#eab308'); // Yellow - 15 days
const redIcon = createStatusIcon('#ef4444'); // Red - 30+ days (at risk)

interface CustomerLocation {
    lat: number;
    lng: number;
}

interface Customer {
    id: string;
    full_name: string;
    phone: string | null;
    pin_status: 'active-7' | 'active-15' | 'inactive-30' | 'inactive';
    days_since_last_order: number | null;
    last_order_date: string | null;
    total_orders: number;
    purchase_frequency: number | null;
    address: {
        street_address: string;
        city: string | null;
        location: CustomerLocation | null;
    } | null;
}

interface CustomersMapProps {
    customers: Customer[];
    height?: string;
    centerOnCustomerId?: string | null;
}

// Component to handle map fly to animation
function FlyToCustomer({ center }: { center: [number, number] | null }) {
    const map = useMap();

    useEffect(() => {
        if (center) {
            map.flyTo(center, 15, { duration: 1.5 });
        }
    }, [map, center]);

    return null;
}

// Helper function to validate coordinates
export function isValidCoordinate(lat: any, lng: any): boolean {
    if (lat === null || lat === undefined || lng === null || lng === undefined) {
        return false;
    }
    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (isNaN(latNum) || isNaN(lngNum)) {
        return false;
    }
    // Valid latitude range: -90 to 90
    // Valid longitude range: -180 to 180
    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
        return false;
    }
    return true;
}

// Helper function to safely extract coordinates
export function getCustomerCoordinates(customer: Customer): { lat: number; lng: number } | null {
    const location = customer.address?.location;
    if (!location) return null;

    const lat = location.lat;
    const lng = location.lng;

    if (!isValidCoordinate(lat, lng)) return null;

    return { lat: Number(lat), lng: Number(lng) };
}

export default function CustomersMap({ customers, height = 'h-96', centerOnCustomerId }: CustomersMapProps) {
    const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
    const [zoom, setZoom] = useState(12);

    // Filter customers with valid locations - with comprehensive safety checks
    const customersWithLocation = customers.filter(c => {
        const coords = getCustomerCoordinates(c);
        return coords !== null;
    });

    // Find the customer to center on
    const customerToCenter = centerOnCustomerId
        ? customers.find(c => c.id === centerOnCustomerId)
        : null;

    const centerCoords = customerToCenter ? getCustomerCoordinates(customerToCenter) : null;

    useEffect(() => {
        // If centering on a specific customer
        if (centerCoords) {
            setMapCenter([centerCoords.lat, centerCoords.lng]);
            setZoom(15);
            return;
        }

        // Calculate center from customer locations or default to Bogotá
        if (customersWithLocation.length > 0) {
            const sumLat = customersWithLocation.reduce((sum, c) => {
                const coords = getCustomerCoordinates(c);
                return sum + (coords?.lat || 0);
            }, 0);
            const sumLng = customersWithLocation.reduce((sum, c) => {
                const coords = getCustomerCoordinates(c);
                return sum + (coords?.lng || 0);
            }, 0);
            setMapCenter([sumLat / customersWithLocation.length, sumLng / customersWithLocation.length]);
            setZoom(12);
        } else {
            // Default to Bogotá center
            setMapCenter([4.7110, -74.0721]);
            setZoom(11);
        }
    }, [customers, centerOnCustomerId, centerCoords, customersWithLocation.length]);

    const getIcon = (status: Customer['pin_status']) => {
        switch (status) {
            case 'active-7':
                return greenIcon;
            case 'active-15':
                return yellowIcon;
            case 'inactive-30':
            case 'inactive':
                return redIcon;
            default:
                return greenIcon;
        }
    };

    const formatLastOrder = (date: string | null) => {
        if (!date) return 'Sin pedidos';
        const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Hoy';
        if (days === 1) return 'Ayer';
        if (days < 7) return `Hace ${days} días`;
        if (days < 30) return `Hace ${Math.floor(days / 7)} semanas`;
        return `Hace ${Math.floor(days / 30)} meses`;
    };

    if (customersWithLocation.length === 0) {
        return (
            <div className={`${height} rounded-lg overflow-hidden border flex items-center justify-center bg-gray-100`}>
                <div className="text-center text-gray-500 p-4">
                    <p className="text-lg font-medium">Sin clientes geolocalizados</p>
                    <p className="text-sm">Los clientes necesitan una dirección con ubicación para aparecer en el mapa.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`${height} rounded-lg overflow-hidden border relative`}>
            <MapContainer
                center={mapCenter || [4.7110, -74.0721]}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FlyToCustomer center={centerCoords ? [centerCoords.lat, centerCoords.lng] : null} />
                {customersWithLocation.map((customer) => {
                    const coords = getCustomerCoordinates(customer);
                    if (!coords) return null;

                    return (
                        <Marker
                            key={customer.id}
                            position={[coords.lat, coords.lng]}
                            icon={getIcon(customer.pin_status)}
                        >
                            <Popup>
                                <div className="text-sm space-y-2 min-w-[200px]">
                                    <div className="font-semibold text-base">{customer.full_name}</div>

                                    {/* Status badge */}
                                    <div className="flex items-center gap-2">
                                        <span className={`inline-block w-3 h-3 rounded-full ${customer.pin_status === 'active-7' ? 'bg-green-500' :
                                            customer.pin_status === 'active-15' ? 'bg-yellow-500' :
                                                'bg-red-500'
                                            }`}></span>
                                        <span className="text-xs text-gray-600">
                                            {customer.pin_status === 'active-7' && 'Compró recientemente (7 días)'}
                                            {customer.pin_status === 'active-15' && 'Hace 15 días'}
                                            {(customer.pin_status === 'inactive-30' || customer.pin_status === 'inactive') && 'Cliente en riesgo (+30 días)'}
                                        </span>
                                    </div>

                                    {customer.address && (
                                        <div className="text-gray-600 text-xs">
                                            {customer.address.street_address}
                                            {customer.address.city && `, ${customer.address.city}`}
                                        </div>
                                    )}

                                    <div className="border-t pt-2 space-y-1">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Última compra:</span>
                                            <span className="font-medium">{formatLastOrder(customer.last_order_date)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Total pedidos:</span>
                                            <span className="font-medium">{customer.total_orders}</span>
                                        </div>
                                        {customer.purchase_frequency && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Frecuencia:</span>
                                                <span className="font-medium">Cada {customer.purchase_frequency} días</span>
                                            </div>
                                        )}
                                    </div>

                                    {customer.phone && (
                                        <a
                                            href={`https://wa.me/${customer.phone.replace(/\D/g, '')}?text=Hola ${encodeURIComponent(customer.full_name)}, hace tiempo no pides. ¡Mira estas ofertas!`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full mt-2 bg-green-500 hover:bg-green-600 text-white text-center py-1.5 px-3 rounded text-xs font-medium transition-colors"
                                        >
                                            📱 Enviar Promo por WhatsApp
                                        </a>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white/95 p-3 rounded-lg shadow-lg z-[1000]">
                <div className="text-xs font-medium text-gray-700 mb-2">Estado del Cliente</div>
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                        <span className="text-xs text-gray-600">Compró hace 7 días</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                        <span className="text-xs text-gray-600">Hace 15 días</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                        <span className="text-xs text-gray-600">En riesgo (+30 días)</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
