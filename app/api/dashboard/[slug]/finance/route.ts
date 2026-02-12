import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser, getDistributorBySlug } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

/**
 * GET /api/dashboard/[slug]/finance
 * 
 * Returns finance summary and debtors list for a distributor.
 */
export async function GET(
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

        console.log('[Finance API] Fetching data for distributor:', distributor.id);

        // Get today's date in Colombia timezone
        const today = new Date().toISOString().split('T')[0];

        // Get total CxC (sum of current_debt from customer_relationships)
        const { data: cxcData, error: cxcError } = await adminClient
            .from('customer_relationships')
            .select('current_debt')
            .eq('distributor_id', distributor.id)
            .gt('current_debt', 0);

        if (cxcError) {
            console.error('[Finance API] Error fetching CxC:', cxcError);
            throw cxcError;
        }

        const totalCxC = cxcData?.reduce((sum: number, rel: { current_debt: number | null }) => sum + (rel.current_debt || 0), 0) || 0;

        // Get today's collections (payments made today)
        const { data: paymentsData, error: paymentsError } = await adminClient
            .from('payments')
            .select('amount')
            .eq('distributor_id', distributor.id)
            .gte('payment_date', today);

        if (paymentsError) {
            console.error('[Finance API] Error fetching payments:', paymentsError);
            throw paymentsError;
        }

        const recaudoHoy = paymentsData?.reduce((sum: number, payment: { amount: number | null }) => sum + (payment.amount || 0), 0) || 0;

        // Get debtors list with payment info
        const { data: debtorsData, error: debtorsError } = await adminClient
            .from('customer_relationships')
            .select(`
        id,
        customer_id,
        current_debt,
        payment_terms_days,
        profiles!customer_relationships_customer_id_fkey (
          full_name
        )
      `)
            .eq('distributor_id', distributor.id)
            .gt('current_debt', 0)
            .order('current_debt', { ascending: false });

        if (debtorsError) {
            console.error('[Finance API] Error fetching debtors:', debtorsError);
            throw debtorsError;
        }

        // Get last payment for each debtor
        const debtorIds = debtorsData?.map((d: { customer_id: string }) => d.customer_id) || [];
        const { data: lastPaymentsData } = await adminClient
            .from('payments')
            .select('customer_id, amount, payment_date')
            .eq('distributor_id', distributor.id)
            .in('customer_id', debtorIds)
            .order('payment_date', { ascending: false });

        // Map last payments to customers
        const lastPaymentMap = new Map<string, { amount: number; date: string }>();
        lastPaymentsData?.forEach((payment: any) => {
            if (!lastPaymentMap.has(payment.customer_id)) {
                lastPaymentMap.set(payment.customer_id, {
                    amount: payment.amount,
                    date: payment.payment_date
                });
            }
        });

        // Calculate days overdue for each debtor
        const debtors = (debtorsData || []).map((debtor: any) => {
            const profile = debtor.profiles || debtor['profiles!customer_relationships_customer_id_fkey'];
            const lastPayment = lastPaymentMap.get(debtor.customer_id);

            // Calculate days overdue based on payment terms
            // If no payment terms, default to 30 days
            const paymentTerms = debtor.payment_terms_days || 30;
            const lastPaymentDate = lastPayment?.date ? new Date(lastPayment.date) : null;
            const todayDate = new Date();

            let daysOverdue = 0;
            if (lastPaymentDate) {
                const dueDate = new Date(lastPaymentDate);
                dueDate.setDate(dueDate.getDate() + paymentTerms);
                const diffTime = todayDate.getTime() - dueDate.getTime();
                daysOverdue = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
            } else {
                // No payment history, assume overdue
                daysOverdue = paymentTerms;
            }

            return {
                id: debtor.id,
                customer_id: debtor.customer_id,
                customer_name: profile?.full_name || 'Desconocido',
                current_debt: debtor.current_debt,
                last_payment_date: lastPayment?.date || null,
                last_payment_amount: lastPayment?.amount || null,
                days_overdue: daysOverdue
            };
        });

        const summary = {
            total_cxc: totalCxC,
            recaudo_hoy: recaudoHoy,
            total_debtors: debtors.length
        };

        console.log('[Finance API] Summary:', summary);
        console.log('[Finance API] Debtors found:', debtors.length);

        return NextResponse.json({
            success: true,
            summary,
            debtors
        });
    } catch (error) {
        console.error('[Finance API] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
