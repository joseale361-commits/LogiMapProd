"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Default center (Bogotá, Colombia)
const DEFAULT_CENTER: [number, number] = [4.711, -74.0721];

interface Client {
    id: string;
    full_name: string;
    phone: string | null;
    email: string | null;
    current_debt: number;
    address: {
        street_address: string;
        city: string | null;
        location: { lat: number; lng: number } | null;
    } | null;
}

interface HeatmapProps {
    clients: Client[];
}

// Helper function to validate coordinates
function isValidCoordinate(lat: any, lng: any): boolean {
    if (lat === null || lat === undefined || lng === null || lng === undefined) {
        return false;
    }
    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (isNaN(latNum) || isNaN(lngNum)) {
        return false;
    }
    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
        return false;
    }
    return true;
}

// Helper function to safely extract coordinates
function getClientCoordinates(client: Client): { lat: number; lng: number } | null {
    const location = client.address?.location;
    if (!location) return null;

    const lat = location.lat;
    const lng = location.lng;

    if (!isValidCoordinate(lat, lng)) return null;

    return { lat: Number(lat), lng: Number(lng) };
}

export default function Heatmap({ clients }: HeatmapProps) {
    const [isClient, setIsClient] = useState(false);
    const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Filter clients with valid locations
    const clientsWithLocation = clients.filter(c => {
        const coords = getClientCoordinates(c);
        return coords !== null;
    });

    // Calculate center from client locations
    useEffect(() => {
        if (clientsWithLocation.length > 0) {
            const sumLat = clientsWithLocation.reduce((sum, c) => {
                const coords = getClientCoordinates(c);
                return sum + (coords?.lat || 0);
            }, 0);
            const sumLng = clientsWithLocation.reduce((sum, c) => {
                const coords = getClientCoordinates(c);
                return sum + (coords?.lng || 0);
            }, 0);
            setMapCenter([sumLat / clientsWithLocation.length, sumLng / clientsWithLocation.length]);
        }
    }, [clients]);

    if (!isClient) {
        return (
            <div className="h-[500px] w-full bg-gray-100 flex items-center justify-center rounded-lg">
                <div className="text-gray-500">Cargando mapa...</div>
            </div>
        );
    }

    if (clientsWithLocation.length === 0) {
        return (
            <div className="h-[500px] w-full rounded-lg overflow-hidden border flex items-center justify-center bg-gray-100">
                <div className="text-center text-gray-500 p-4">
                    <p className="text-lg font-medium">Sin clientes geolocalizados</p>
                    <p className="text-sm">Los clientes necesitan una dirección con ubicación para aparecer en el mapa.</p>
                </div>
            </div>
        );
    }

    // Format currency for display
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="h-[500px] w-full rounded-lg overflow-hidden border relative">
            <MapContainer
                center={mapCenter}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution={mapboxToken
                        ? '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}
                    url={mapboxToken
                        ? `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`
                        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
                />
                {clientsWithLocation.map((client) => {
                    const coords = getClientCoordinates(client);
                    if (!coords) return null;

                    const hasDebt = client.current_debt > 0;

                    return (
                        <CircleMarker
                            key={client.id}
                            center={[coords.lat, coords.lng]}
                            radius={8}
                            pathOptions={{
                                color: hasDebt ? '#ef4444' : '#3b82f6', // Red for debt, Blue for good
                                fillColor: hasDebt ? '#ef4444' : '#3b82f6',
                                fillOpacity: 0.7,
                                weight: 2
                            }}
                        >
                            <Popup>
                                <div className="text-sm space-y-1 min-w-[180px]">
                                    <div className="font-semibold text-base">{client.full_name}</div>

                                    {/* Debt status */}
                                    <div className="flex items-center gap-2">
                                        <span className={`inline-block w-3 h-3 rounded-full ${hasDebt ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                                        <span className={hasDebt ? 'text-red-600 font-medium' : 'text-blue-600'}>
                                            {hasDebt ? `Deuda: ${formatCurrency(client.current_debt)}` : 'Sin deuda'}
                                        </span>
                                    </div>

                                    {client.address && (
                                        <div className="text-gray-600 text-xs">
                                            {client.address.street_address}
                                            {client.address.city && `, ${client.address.city}`}
                                        </div>
                                    )}

                                    {client.phone && (
                                        <div className="text-gray-500 text-xs">
                                            📞 {client.phone}
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </CircleMarker>
                    );
                })}
            </MapContainer>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white/95 p-3 rounded-lg shadow-lg z-[1000]">
                <div className="text-xs font-medium text-gray-700 mb-2">Estado de Crédito</div>
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                        <span className="text-xs text-gray-600">Con deuda</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                        <span className="text-xs text-gray-600">Sin deuda</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
