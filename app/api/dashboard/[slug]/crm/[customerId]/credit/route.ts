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
        const { credit_limit } = body;

        const supabase = await createClient();
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const distributor = await getDistributorBySlug(slug);
        if (!distributor) {
            return NextResponse.json({ error: 'Distributor not found' }, { status: 404 });
        }

        // Find the customer relationship
        const { data: relationship, error: relError } = await adminClient
            .from('customer_relationships')
            .select('id')
            .eq('customer_id', customerId)
            .eq('distributor_id', distributor.id)
            .single();

        if (relError || !relationship) {
            return NextResponse.json({ error: 'Customer relationship not found' }, { status: 404 });
        }

        // Update the credit limit
        const { error: updateError } = await adminClient
            .from('customer_relationships')
            .update({
                credit_limit: credit_limit ? parseFloat(credit_limit) : 0
            })
            .eq('id', relationship.id);

        if (updateError) {
            console.error('Error updating credit limit:', updateError);
            return NextResponse.json({ error: 'Failed to update credit limit' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Credit limit updated successfully'
        });

    } catch (error) {
        console.error('Update Credit API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
