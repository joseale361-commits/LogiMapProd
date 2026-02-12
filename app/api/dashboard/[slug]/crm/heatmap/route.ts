import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser, getDistributorBySlug } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

export async function GET(
    request: NextRequest,
    { params }: { params: any }
) {
    try {
        const { slug } = await params;

        const supabase = await createClient();
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const distributor = await getDistributorBySlug(slug);
        if (!distributor) {
            return NextResponse.json({ error: 'Distributor not found' }, { status: 404 });
        }

        // Fetch customers with their default address using INNER join
        // This ensures we only get customers who have addresses with location data
        const { data: customerRelationships, error: crError } = await adminClient
            .from('customer_relationships')
            .select(`
                *,
                customer:profiles!customer_id (
                    id,
                    full_name,
                    email,
                    phone,
                    created_at,
                    addresses!inner (
                        id,
                        street_address,
                        city,
                        location,
                        is_default,
                        zone_name
                    )
                )
            `)
            .eq('distributor_id', distributor.id)
            .eq('status', 'active');

        if (crError) {
            console.error('Error fetching customer relationships:', crError);
            throw crError;
        }

        // Filter and transform the data to get customers with valid location data
        // First, get the default address (is_default = true), or fall back to first address with location
        const heatmapPoints = customerRelationships
            .map((relationship: any) => {
                const customer = relationship.customer;

                if (!customer?.addresses || customer.addresses.length === 0) {
                    return null;
                }

                // Find the default address first, otherwise use the first address with location
                let address = customer.addresses.find((addr: any) => addr.is_default === true);

                // If no default address, try to find one with location
                if (!address?.location) {
                    address = customer.addresses.find((addr: any) => addr.location && addr.location.lat && addr.location.lng);
                }

                // If still no address with location, try the first one
                if (!address?.location) {
                    address = customer.addresses[0];
                }

                if (!address?.location) {
                    return null;
                }

                // Extract coordinates with comprehensive null checks
                const lat = address.location.lat ?? address.location.latitude;
                const lng = address.location.lng ?? address.location.longitude;

                // Validate coordinates
                if (lat === null || lat === undefined ||
                    lng === null || lng === undefined ||
                    isNaN(Number(lat)) || isNaN(Number(lng))) {
                    return null;
                }

                return {
                    id: customer.id,
                    full_name: customer.full_name,
                    email: customer.email,
                    phone: customer.phone,
                    location: {
                        lat: Number(lat),
                        lng: Number(lng)
                    },
                    address: {
                        street_address: address.street_address,
                        city: address.city,
                        zone_name: address.zone_name
                    }
                };
            })
            .filter((point: { id: string; full_name: string; email: string | null; phone: string | null; location: { lat: number; lng: number }; address: { street_address: string; city: string | null; zone_name: string | null } } | null): point is { id: string; full_name: string; email: string | null; phone: string | null; location: { lat: number; lng: number }; address: { street_address: string; city: string | null; zone_name: string | null } } => point !== null);

        return NextResponse.json({
            success: true,
            count: heatmapPoints.length,
            heatmapPoints
        });

    } catch (error) {
        console.error('CRM Heatmap API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
