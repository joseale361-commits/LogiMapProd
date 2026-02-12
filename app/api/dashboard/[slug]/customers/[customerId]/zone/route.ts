import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser, getDistributorBySlug } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

export async function PUT(
    request: NextRequest,
    { params }: { params: any }
) {
    try {
        const { slug, customerId } = await params;
        const body = await request.json();
        const { zone_name } = body;

        if (!zone_name || typeof zone_name !== 'string') {
            return NextResponse.json({ error: 'Zone name is required' }, { status: 400 });
        }

        const supabase = await createClient();
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const distributor = await getDistributorBySlug(slug);
        if (!distributor) {
            return NextResponse.json({ error: 'Distributor not found' }, { status: 404 });
        }

        // First, get the customer relationship to find the customer
        const { data: relationship, error: relError } = await adminClient
            .from('customer_relationships')
            .select('customer_id')
            .eq('distributor_id', distributor.id)
            .eq('customer_id', customerId)
            .eq('status', 'active')
            .single();

        if (relError || !relationship) {
            return NextResponse.json({ error: 'Customer relationship not found' }, { status: 404 });
        }

        // Get the default address for this customer
        const { data: address, error: addrError } = await adminClient
            .from('addresses')
            .select('id')
            .eq('profile_id', customerId)
            .eq('is_default', true)
            .single();

        // If no default address, try to get any address
        let addressId = address?.id;
        if (!addressId) {
            const { data: anyAddress } = await adminClient
                .from('addresses')
                .select('id')
                .eq('profile_id', customerId)
                .limit(1)
                .single();
            addressId = anyAddress?.id;
        }

        if (!addressId) {
            return NextResponse.json({ error: 'No address found for this customer' }, { status: 404 });
        }

        // Update the zone_name for the address
        const { data: updatedAddress, error: updateError } = await adminClient
            .from('addresses')
            .update({ zone_name: zone_name.trim() })
            .eq('id', addressId)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating zone:', updateError);
            return NextResponse.json({ error: 'Failed to update zone' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Zone updated successfully',
            address: updatedAddress
        });

    } catch (error) {
        console.error('Update Zone API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
