import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser, getDistributorBySlug } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

/**
 * POST /api/dashboard/[slug]/finance/payments
 * 
 * Registers a new payment for a customer.
 * Automatically updates the customer's current_debt in customer_relationships.
 */
export async function POST(
    request: NextRequest,
    { params }: { params: any }
) {
    try {
        const { slug } = await params;

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

        // Parse request body
        const body = await request.json();
        const { customer_id, amount, notes, payment_method } = body;

        // Validate required fields
        if (!customer_id || !amount || amount <= 0) {
            return NextResponse.json(
                { success: false, error: 'Datos inválidos. Se requiere customer_id y amount > 0' },
                { status: 400 }
            );
        }

        console.log('[Finance API] Registering payment:', {
            distributor_id: distributor.id,
            customer_id,
            amount,
            payment_method
        });

        // Check if customer has a relationship with this distributor
        const { data: relationship, error: relationshipError } = await adminClient
            .from('customer_relationships')
            .select('id, current_debt')
            .eq('distributor_id', distributor.id)
            .eq('customer_id', customer_id)
            .single();

        if (relationshipError || !relationship) {
            console.error('[Finance API] Customer relationship not found:', relationshipError);
            return NextResponse.json(
                { success: false, error: 'Cliente no encontrado o no tiene relación con esta distribuidora' },
                { status: 404 }
            );
        }

        // Check if payment amount exceeds current debt
        if (amount > relationship.current_debt) {
            console.warn('[Finance API] Payment amount exceeds current debt:', {
                amount,
                current_debt: relationship.current_debt
            });
            return NextResponse.json(
                {
                    success: false,
                    error: `El monto del pago (${amount}) excede la deuda actual (${relationship.current_debt})`
                },
                { status: 400 }
            );
        }

        // Insert payment record
        const { data: payment, error: paymentError } = await adminClient
            .from('payments')
            .insert({
                distributor_id: distributor.id,
                customer_id,
                amount,
                payment_method: payment_method || 'office',
                notes: notes || null,
                created_by: user.id,
                payment_date: new Date().toISOString().split('T')[0]
            })
            .select()
            .single();

        if (paymentError) {
            console.error('[Finance API] Error inserting payment:', paymentError);
            throw paymentError;
        }

        // The trigger will automatically update customer_relationships.current_debt
        // But let's verify it was updated correctly
        const { data: updatedRelationship, error: verifyError } = await adminClient
            .from('customer_relationships')
            .select('current_debt')
            .eq('id', relationship.id)
            .single();

        if (verifyError) {
            console.error('[Finance API] Error verifying debt update:', verifyError);
        } else {
            console.log('[Finance API] Debt updated:', {
                old_debt: relationship.current_debt,
                new_debt: updatedRelationship?.current_debt,
                payment_amount: amount
            });
        }

        console.log('[Finance API] Payment registered successfully:', payment.id);

        return NextResponse.json({
            success: true,
            payment,
            new_debt: updatedRelationship?.current_debt
        });
    } catch (error) {
        console.error('[Finance API] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
