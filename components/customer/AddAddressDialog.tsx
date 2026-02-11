"use client"

import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import Link from 'next/link';

export function AddAddressDialog() {
    return (
        <Link href="/dashboard/customers/me/addresses/new">
            <Button variant="outline" size="sm">
                <MapPin className="w-4 h-4 mr-2" />
                Agregar Dirección
            </Button>
        </Link>
    );
}
