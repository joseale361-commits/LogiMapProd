import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

import { AddressPageForm } from '@/components/customer/AddressPageForm';

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function NewAddressPage({ params }: PageProps) {
    const { id: customerId } = await params;
    return (
        <div className="fixed inset-0 z-50 bg-white">
            <Suspense fallback={
                <div className="flex items-center justify-center h-screen">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            }>
                <AddressPageForm customerId={customerId} />
            </Suspense>
        </div>
    );
}
