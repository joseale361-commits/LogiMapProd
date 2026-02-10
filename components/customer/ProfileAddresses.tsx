"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Edit, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import dynamic from 'next/dynamic';
import type { AddressFormData } from '@/components/shop/AddressModal';
import { saveAddressAction } from '@/lib/actions/address';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// Dynamically import AddressModal to avoid SSR issues with Leaflet
const AddressModal = dynamic(
    () => import('@/components/shop/AddressModal').then((mod) => mod.AddressModal),
    { ssr: false }
);

export interface Address {
    id: string;
    label: string | null;
    street_address: string;
    city: string;
    state: string | null;
    country: string;
    postal_code: string | null;
    additional_info: string | null;
    delivery_instructions: string | null;
    is_default: boolean;
    lat: number | null;
    lng: number | null;
}

interface ProfileAddressesProps {
    addresses: Address[];
    userId: string;
}

export function ProfileAddresses({ addresses, userId }: ProfileAddressesProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Partial<AddressFormData> | undefined>(undefined);
    const router = useRouter();

    const handleAddClick = () => {
        setEditingAddress(undefined);
        setIsModalOpen(true);
    };

    const handleEditClick = (address: Address) => {
        setEditingAddress({
            id: address.id,
            label: address.label || '',
            street_address: address.street_address,
            city: address.city,
            state: address.state || 'CI',
            postal_code: address.postal_code || '',
            country: address.country,
            additional_info: address.additional_info || '',
            delivery_instructions: address.delivery_instructions || '',
            lat: address.lat || 4.7110,
            lng: address.lng || -74.0721,
            is_default: address.is_default,
        });
        setIsModalOpen(true);
    };

    const handleSaveAddress = async (formData: AddressFormData) => {
        try {
            const result = await saveAddressAction({
                ...formData,
                id: editingAddress?.id
            });

            if (result.success) {
                toast.success(editingAddress?.id ? 'Dirección actualizada exitosamente' : 'Dirección creada exitosamente');
                setIsModalOpen(false);
                router.refresh();
            } else {
                toast.error(result.error || 'Error al guardar la dirección');
            }
        } catch (error) {
            console.error(error);
            toast.error('Ocurrió un error inesperado');
        }
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

            <AddressModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveAddress}
                initialData={editingAddress}
            />
        </div>
    );
}
