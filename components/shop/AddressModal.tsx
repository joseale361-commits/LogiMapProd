"use client"

import { MapPin } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import dynamic from 'next/dynamic';
import type { AddressFormData } from '@/components/customer/AddressForm';

// Dynamically import AddressForm to avoid SSR issues with Leaflet
const AddressForm = dynamic(
    () => import('@/components/customer/AddressForm').then((mod) => mod.AddressForm),
    { ssr: false }
);

interface AddressModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (address: AddressFormData) => void;
    initialData?: Partial<AddressFormData>;
}

export type { AddressFormData };

export function AddressModal({ isOpen, onClose, onSave, initialData }: AddressModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        {initialData ? 'Editar Dirección' : 'Nueva Dirección'}
                    </DialogTitle>
                    <DialogDescription>
                        Ingresa los detalles de tu dirección y selecciona tu ubicación en el mapa
                    </DialogDescription>
                </DialogHeader>

                <AddressForm
                    initialData={initialData}
                    onSave={(data) => {
                        onSave(data);
                    }}
                    onCancel={onClose}
                />
            </DialogContent>
        </Dialog>
    );
}
