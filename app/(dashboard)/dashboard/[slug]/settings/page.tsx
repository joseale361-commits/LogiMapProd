export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { notFound } from 'next/navigation';
import { getDistributorBySlug, getDistributorSettingsBySlug } from '@/lib/supabase/server';
import SettingsForm from '@/components/dashboard/settings/SettingsForm';

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function SettingsPage({ params }: PageProps) {
    const { slug } = await params;

    // Get distributor data server-side (basic fields from table)
    const distributor = await getDistributorBySlug(slug);

    if (!distributor) {
        notFound();
    }

    // Get location data from view (GeoJSON format)
    const settingsData = await getDistributorSettingsBySlug(slug);

    // 🔍 [SERVER READ] Raw Location from View (GeoJSON)
    console.log('🔍 [SERVER READ] Raw Location from View:', settingsData?.location_json);

    // EXPLICIT PARSING - GeoJSON format
    let initialLat = 0;
    let initialLng = 0;

    if (settingsData?.location_json?.coordinates) {
        // GeoJSON is [Longitude, Latitude]
        initialLng = settingsData.location_json.coordinates[0];
        initialLat = settingsData.location_json.coordinates[1];
        console.log('✅ Coordinates Parsed:', { initialLat, initialLng });
    } else {
        console.log('⚠️ No coordinates found in location_json');
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Configuración de Tienda</h1>
                <p className="text-gray-600 mt-1">
                    Personaliza la información y apariencia de tu tienda
                </p>
            </div>

            <SettingsForm
                initialLat={initialLat}
                initialLng={initialLng}
                slug={slug}
                name={distributor.name || ''}
                phone={distributor.phone || ''}
                logo_url={distributor.logo_url || ''}
                colors={(distributor.settings as any)?.colors || {
                    primary: '#3b82f6',
                    secondary: '#64748b',
                    accent: '#f59e0b',
                }}
                delivery_zones={distributor.delivery_zones}
                delivery_settings={(distributor.settings as any)?.delivery_settings || {
                    free_radius_km: 0,
                    max_radius_km: 0,
                    delivery_fee: 0,
                    min_order_amount: 0,
                }}
                warehouse_address={distributor.warehouse_address || ''}
            />
        </div>
    );
}
