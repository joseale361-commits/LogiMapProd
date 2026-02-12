"use client";

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface CustomerLocation {
    lat: number;
    lng: number;
}

interface ZoneCustomerBase {
    id: string;
    full_name: string;
    phone: string | null;
    email: string | null;
    address: {
        street_address: string;
        city: string | null;
        zone_name: string | null;
    };
}

// Support both formats: location at root level or inside address
interface ZoneCustomer extends ZoneCustomerBase {
    location?: CustomerLocation;
    address: ZoneCustomerBase['address'] & {
        location?: CustomerLocation | null;
    };
}

interface ZoneMapProps {
    customers: ZoneCustomer[];
    height?: string;
    centerOnCustomerId?: string | null;
    onZoneUpdate?: (customerId: string, newZone: string) => void;
}

// Hash function to generate a consistent number from a string
function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

// Generate a consistent color from zone string
function getZoneColor(zone: string | null): string {
    if (!zone) {
        return '#9CA3AF'; // Gray for no zone
    }

    // Predefined palette of distinct colors for zones
    const colors = [
        '#EF4444', // Red
        '#F97316', // Orange
        '#EAB308', // Yellow
        '#22C55E', // Green
        '#14B8A6', // Teal
        '#06B6D4', // Cyan
        '#3B82F6', // Blue
        '#8B5CF6', // Violet
        '#EC4899', // Pink
        '#6366F1', // Indigo
        '#84CC16', // Lime
        '#F59E0B', // Amber
    ];

    const hash = hashString(zone);
    return colors[hash % colors.length];
}

// Get readable zone name
function getZoneDisplayName(zone: string | null): string {
    if (!zone) return 'Sin asignar';
    return zone;
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
function getCustomerCoordinates(customer: ZoneCustomer): { lat: number; lng: number } | null {
    // Try location at root level first (from heatmap API), then inside address
    const location = customer.location || customer.address?.location;
    if (!location) return null;

    const lat = location.lat;
    const lng = location.lng;

    if (!isValidCoordinate(lat, lng)) return null;

    return { lat: Number(lat), lng: Number(lng) };
}

// Get unique zones from customers
function getUniqueZones(customers: ZoneCustomer[]): string[] {
    const zones = new Set<string>();
    customers.forEach(customer => {
        if (customer.address?.zone_name) {
            zones.add(customer.address.zone_name);
        }
    });
    return Array.from(zones).sort();
}

export default function ZoneMap({
    customers,
    height = 'h-[600px]',
    centerOnCustomerId,
    onZoneUpdate
}: ZoneMapProps) {
    const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
    const [zoom, setZoom] = useState(12);
    const [selectedCustomer, setSelectedCustomer] = useState<ZoneCustomer | null>(null);
    const [editZoneDialogOpen, setEditZoneDialogOpen] = useState(false);
    const [newZoneName, setNewZoneName] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // Filter customers with valid locations
    const customersWithLocation = useMemo(() => {
        return customers.filter(c => {
            const coords = getCustomerCoordinates(c);
            return coords !== null;
        });
    }, [customers]);

    // Get unique zones for legend
    const uniqueZones = useMemo(() => getUniqueZones(customers), [customers]);

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

    const handleEditZone = (customer: ZoneCustomer) => {
        setSelectedCustomer(customer);
        setNewZoneName(customer.address?.zone_name || '');
        setEditZoneDialogOpen(true);
    };

    const handleSaveZone = async () => {
        if (!selectedCustomer || !onZoneUpdate) return;

        setIsEditing(true);
        try {
            await onZoneUpdate(selectedCustomer.id, newZoneName);
            setEditZoneDialogOpen(false);
            setSelectedCustomer(null);
        } catch (error) {
            console.error('Error updating zone:', error);
        } finally {
            setIsEditing(false);
        }
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

                    const zoneColor = getZoneColor(customer.address?.zone_name);
                    const zoneDisplayName = getZoneDisplayName(customer.address?.zone_name);

                    return (
                        <CircleMarker
                            key={customer.id}
                            center={[coords.lat, coords.lng]}
                            radius={10}
                            pathOptions={{
                                color: zoneColor,
                                fillColor: zoneColor,
                                fillOpacity: 0.7,
                                weight: 2
                            }}
                        >
                            <Popup>
                                <div className="text-sm space-y-2 min-w-[200px]">
                                    <div className="font-semibold text-base flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        {customer.full_name}
                                    </div>

                                    {/* Zone badge */}
                                    <div
                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                                        style={{
                                            backgroundColor: `${zoneColor}20`,
                                            color: zoneColor
                                        }}
                                    >
                                        <span
                                            className="w-2 h-2 rounded-full mr-1.5"
                                            style={{ backgroundColor: zoneColor }}
                                        ></span>
                                        Zona: {zoneDisplayName}
                                    </div>

                                    {customer.address && (
                                        <div className="text-gray-600 text-xs">
                                            {customer.address.street_address}
                                            {customer.address.city && `, ${customer.address.city}`}
                                        </div>
                                    )}

                                    {customer.phone && (
                                        <div className="text-gray-600 text-xs">
                                            📞 {customer.phone}
                                        </div>
                                    )}

                                    {/* Edit Zone Button */}
                                    {onZoneUpdate && (
                                        <Button
                                            onClick={() => handleEditZone(customer)}
                                            variant="outline"
                                            size="sm"
                                            className="w-full mt-2 flex items-center justify-center gap-1"
                                        >
                                            <Edit className="w-3 h-3" />
                                            Editar Zona
                                        </Button>
                                    )}
                                </div>
                            </Popup>
                        </CircleMarker>
                    );
                })}
            </MapContainer>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white/95 p-3 rounded-lg shadow-lg z-[1000] max-h-[300px] overflow-y-auto">
                <div className="text-xs font-medium text-gray-700 mb-2">Zonas de Ventas</div>
                <div className="space-y-1.5">
                    {uniqueZones.length > 0 ? (
                        uniqueZones.map(zone => (
                            <div key={zone} className="flex items-center gap-2">
                                <span
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: getZoneColor(zone) }}
                                ></span>
                                <span className="text-xs text-gray-600">{zone}</span>
                            </div>
                        ))
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                            <span className="text-xs text-gray-600">Sin asignar</span>
                        </div>
                    )}
                    {customersWithLocation.some(c => !c.address?.zone_name) && (
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                            <span className="text-xs text-gray-600">Sin zona</span>
                        </div>
                    )}
                    <div className="text-xs text-gray-400 pt-1 border-t">
                        Total: {customersWithLocation.length} clientes
                    </div>
                </div>
            </div>

            {/* Edit Zone Dialog */}
            <Dialog open={editZoneDialogOpen} onOpenChange={setEditZoneDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Zona del Cliente</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Cliente: {selectedCustomer?.full_name}
                        </label>
                        <input
                            type="text"
                            value={newZoneName}
                            onChange={(e) => setNewZoneName(e.target.value)}
                            placeholder="Ej: Norte, Sur, Centro, Este, Oeste"
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            list="zone-suggestions"
                        />
                        <datalist id="zone-suggestions">
                            {uniqueZones.map(zone => (
                                <option key={zone} value={zone} />
                            ))}
                        </datalist>
                        <p className="text-xs text-gray-500 mt-2">
                            Ingresa el nombre de la zona o selecciona una existente
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditZoneDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSaveZone}
                            disabled={isEditing}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isEditing ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
