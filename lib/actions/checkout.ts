"use server"

import { createClient } from '@/lib/supabase/server';

/**
 * Server Action: Obtener información de crédito del cliente con un distribuidor específico
 * Esta función debe ejecutarse en el servidor porque usa createClient de server
 */
export async function getCreditInfoAction(distributorId: string) {
    const supabase = await createClient();

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return {
                hasCredit: false,
                creditLimit: 0,
                currentDebt: 0,
                availableCredit: 0
            };
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('auth_user_id', user.id)
            .single();

        if (!profile) {
            return {
                hasCredit: false,
                creditLimit: 0,
                currentDebt: 0,
                availableCredit: 0
            };
        }

        // Obtener la relación con el distribuidor
        const { data: relationship, error } = await supabase
            .from('customer_relationships')
            .select('credit_limit, current_debt')
            .eq('customer_id', profile.id)
            .eq('distributor_id', distributorId)
            .eq('status', 'active')
            .single();

        if (error || !relationship) {
            console.error('Error fetching credit info:', error);
            return {
                hasCredit: false,
                creditLimit: 0,
                currentDebt: 0,
                availableCredit: 0
            };
        }

        // Cast to any temporarily until we update the schema
        const rel = relationship as any;
        const creditLimit = rel.credit_limit || 0;
        const currentDebt = rel.current_debt || 0;
        const availableCredit = creditLimit - currentDebt;

        return {
            hasCredit: creditLimit > 0,
            creditLimit,
            currentDebt,
            availableCredit: Math.max(0, availableCredit)
        };

    } catch (error) {
        console.error('Unexpected error fetching credit info:', error);
        return {
            hasCredit: false,
            creditLimit: 0,
            currentDebt: 0,
            availableCredit: 0
        };
    }
}
