import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser, getDistributorBySlug } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

/**
 * GET /api/dashboard/[slug]/finance/payments/[customerId]
 * 
 * Returns payment and invoice history for a specific customer.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: any }
) {
    try {
        const { slug, customerId } = await params;

        // Initialize supabase client
        const supabase = await createClient();

        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'No autenticado' },
                { status: 401 }
            );
        }

        // Get distributor
        const distributor = await getDistributorBySlug(slug);
        if (!distributor) {
            return NextResponse.json(
                { success: false, error: 'Distribuidora no encontrada' },
                { status: 404 }
            );
        }

        console.log('[Finance API] Fetching history for customer:', customerId);

        // Verify customer has relationship with this distributor
        const { data: relationship, error: relationshipError } = await adminClient
            .from('customer_relationships')
            .select('id, current_debt, payment_terms_days')
            .eq('distributor_id', distributor.id)
            .eq('customer_id', customerId)
            .single();

        if (relationshipError || !relationship) {
            console.error('[Finance API] Customer relationship not found:', relationshipError);
            return NextResponse.json(
                { success: false, error: 'Cliente no encontrado o no tiene relación con esta distribuidora' },
                { status: 404 }
            );
        }

        // Get payment history
        const { data: payments, error: paymentsError } = await adminClient
            .from('payments')
            .select('*')
            .eq('distributor_id', distributor.id)
            .eq('customer_id', customerId)
            .order('payment_date', { ascending: false });

        if (paymentsError) {
            console.error('[Finance API] Error fetching payments:', paymentsError);
            throw paymentsError;
        }

        // Get invoice history (orders for this customer)
        const { data: invoices, error: invoicesError } = await adminClient
            .from('orders')
            .select(`
        id,
        order_number,
        total_amount,
        created_at,
        status,
        payment_status
      `)
            .eq('distributor_id', distributor.id)
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false });

        if (invoicesError) {
            console.error('[Finance API] Error fetching invoices:', invoicesError);
            throw invoicesError;
        }

        console.log('[Finance API] History fetched:', {
            payments_count: payments?.length || 0,
            invoices_count: invoices?.length || 0
        });

        return NextResponse.json({
            success: true,
            payments: payments || [],
            invoices: invoices || [],
            current_debt: relationship.current_debt,
            payment_terms_days: relationship.payment_terms_days
        });
    } catch (error) {
        console.error('[Finance API] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
