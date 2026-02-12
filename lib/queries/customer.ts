import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';

export type Distributor = Database['public']['Tables']['distributors']['Row'];

export interface DistributorCardData {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    is_active: boolean | null;
}

export interface CustomerSummary {
    lastOrder: {
        order_number: string;
        status: string;
        total_amount: number;
        created_at: string | null;
        distributors: { name: string };
    } | null;
    totalDebt: number;
}

// Obtener distribuidoras favoritas (Linked)
export async function fetchLinkedDistributors() {
    const supabase = await createClient();

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return [];

        // Buscamos el perfil del usuario
        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('auth_user_id', user.id)
            .single();

        if (!profile) return [];

        // Buscamos las relaciones
        const { data, error } = await supabase
            .from('customer_relationships')
            .select(`
                distributor_id,
                distributors (
                    id,
                    name,
                    slug,
                    logo_url,
                    is_active
                )
            `)
            .eq('customer_id', profile.id)
            .eq('status', 'active');

        if (error) {
            console.error('Error fetching linked distributors:', error);
            return [];
        }

        // Mapeamos para devolver solo la info de la distribuidora
        return data.map((item: any) => item.distributors).filter(Boolean);

    } catch (error) {
        console.error('Unexpected error fetching linked distributors:', error);
        return [];
    }
}

// Obtener todas las distribuidoras activas (Para buscar)
export async function fetchActiveShops() {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('distributors')
            .select('id, name, slug, logo_url, is_active')
            .eq('is_active', true)
            .eq('subscription_status', 'active');

        if (error) {
            console.error('Error fetching active distributors:', error);
            return [];
        }

        return data;
    } catch (error) {
        console.error('Unexpected error fetching active distributors:', error);
        return [];
    }
}

// Obtener resumen del cliente (Último pedido, Deuda)
export async function getCustomerSummary() {
    const supabase = await createClient();

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { lastOrder: null, totalDebt: 0 };

        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('auth_user_id', user.id)
            .single();

        if (!profile) return { lastOrder: null, totalDebt: 0 };

        // 1. Último Pedido
        const { data: lastOrder } = await supabase
            .from('orders')
            .select('order_number, status, total_amount, created_at, distributors(name)')
            .eq('customer_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        // 2. Deuda Total (Sumar saldo de relaciones)
        // Nota: En nuestro esquema actual la deuda está en customer_relationships o customers
        // Vamos a asumir que por ahora devolvemos 0 si no hemos implementado la lógica de deuda compleja

        return {
            lastOrder: lastOrder || null,
            totalDebt: 0 // Pendiente implementar lógica de deuda
        };

    } catch (error) {
        console.error('Error getting customer summary:', error);
        return { lastOrder: null, totalDebt: 0 };
    }
}

// Obtener información de crédito del cliente con un distribuidor específico
export async function getCustomerCreditInfo(distributorId: string) {
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