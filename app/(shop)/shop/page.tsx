import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { fetchLinkedDistributors, fetchActiveShops, getCustomerSummary } from '@/lib/queries/customer';
import { DistributorList } from '@/components/customer/DistributorList';
import { QuickSummary } from '@/components/customer/QuickSummary';
import { Package } from 'lucide-react';
import { CustomerNavbar } from '@/components/shop/CustomerNavbar';

export default async function CustomerHomePage() {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect('/login');
    }

    // Fetch data
    const [favorites, allDistributors, summary] = await Promise.all([
        fetchLinkedDistributors(),
        fetchActiveShops(),
        getCustomerSummary(),
    ]);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <CustomerNavbar />

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-12">
                {/* Quick Summary */}
                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Package className="w-6 h-6 text-blue-600" />
                        Mi Resumen
                    </h2>
                    <QuickSummary summary={summary} />
                </section>

                {/* Distributor List with Search */}
                <DistributorList
                    favorites={favorites}
                    allDistributors={allDistributors}
                />
            </div>
        </div>
    );
}
