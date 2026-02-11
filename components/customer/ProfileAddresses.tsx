"use client"

import { Button } from '@/components/ui/button';
import { MapPin, Edit, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';


export interface Address {
    id: string;
    label: string | null;
    street_address: string;
    city: string;
    state: string | null;
    country: string | null;
    postal_code: string | null;
    additional_info: string | null;
    delivery_instructions: string | null;
    is_default: boolean | null;
    lat: number | null;
    lng: number | null;
}

interface ProfileAddressesProps {
    addresses: Address[];
    userId: string;
}

export function ProfileAddresses({ addresses, userId }: ProfileAddressesProps) {
    const router = useRouter();

    const handleAddClick = () => {
        // Navigate to full-page address form
        router.push(`/dashboard/customers/${userId}/addresses/new`);
    };

    const handleEditClick = (address: Address) => {
        // Navigate to full-page address form with address data
        router.push(`/dashboard/customers/${userId}/addresses/new?edit=true&id=${address.id}`);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={handleAddClick} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Dirección
                </Button>
            </div>

            {addresses.length > 0 ? (
                <div className="space-y-3">
                    {addresses.map((address) => (
                        <div
                            key={address.id}
                            className="p-4 border border-gray-200 rounded-lg flex items-start justify-between hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    {address.label && (
                                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">{address.label}</p>
                                    )}
                                    <p className="text-sm font-medium text-gray-900">{address.street_address}</p>
                                    <p className="text-sm text-gray-600">{address.city}</p>
                                    {address.is_default && (
                                        <Badge variant="secondary" className="mt-1">
                                            Predeterminada
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditClick(address)}
                            >
                                <Edit className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No tienes direcciones guardadas</p>
                </div>
            )}


        </div>
    );
}
