"use server"

import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

export interface CustomerOption {
    id: string;
    full_name: string;
    phone: string | null;
    email: string | null;
    credit_limit: number;
    current_debt: number;
    address?: {
        street_address: string;
        city: string | null;
    };
}

/**
 * Server Action: Buscar clientes para el selector de POS
 * Solo devuelve clientes activos para el distribuidor
 * 
 * @param distributorIdentifier - Either a distributor UUID (preferred) or slug
 * @param searchTerm - Search query
 * @param isDistributorId - If true, treat distributorIdentifier as UUID; otherwise treat as slug
 */
export async function searchCustomersAction(distributorIdentifier: string, searchTerm: string = '', isDistributorId: boolean = false) {
    const supabase = await createClient();

    try {
        let distributorId: string;

        if (isDistributorId) {
            // Directly use the provided ID (it's already a UUID)
            distributorId = distributorIdentifier;
        } else {
            // Get distributor ID from slug
            const { data: distributor } = await adminClient
                .from('distributors')
                .select('id')
                .eq('slug', distributorIdentifier)
                .eq('is_active', true)
                .single();

            if (!distributor) {
                return { success: false, error: 'Distribuidor no encontrado', customers: [] };
            }
            distributorId = distributor.id;
        }

        // Build query for customer relationships
        // Using inner join to ensure we only get relationships with valid customer profiles
        // Using simpler relation syntax to avoid FK naming issues
        let query = adminClient
            .from('customer_relationships')
            .select(
                `id,
                customer_id,
                credit_limit,
                current_debt,
                status,
                profiles(
                    id,
                    full_name,
                    phone,
                    email,
                    addresses(
                        id,
                        street_address,
                        city
                    )
                )`
            )
            .eq('distributor_id', distributorId)
            .eq('status', 'active');

        // Add search filter if provided
        if (searchTerm && searchTerm.trim() !== '') {
            query = query.or(`profiles.full_name.ilike.%${searchTerm}%,profiles.email.ilike.%${searchTerm}%,profiles.phone.ilike.%${searchTerm}%`);
        }

        const { data: relationships, error } = await query;

        if (error) {
            console.error('Supabase Error Detailed:', error);
            return { success: false, error: error.message, customers: [] };
        }

        // Transform data
        const customers: CustomerOption[] = (relationships as any[] || []).map((rel: any) => {
            const profile = rel.profiles;
            // Handle case where customer profile might not be loaded
            const customerProfile = profile || {};
            const defaultAddress = customerProfile.addresses?.find((addr: any) => addr.is_default) || customerProfile.addresses?.[0];

            return {
                id: profile.id || rel.customer_id,
                full_name: profile.full_name || profile.email || 'Cliente sin nombre',
                phone: profile.phone,
                email: profile.email,
                credit_limit: rel.credit_limit || 0,
                current_debt: rel.current_debt || 0,
                address: defaultAddress ? {
                    street_address: defaultAddress.street_address,
                    city: defaultAddress.city
                } : undefined
            };
        });

        // Sort customers alphabetically by full_name in JavaScript
        customers.sort((a, b) => {
            const nameA = a.full_name || '';
            const nameB = b.full_name || '';
            return nameA.localeCompare(nameB);
        });

        return { success: true, customers };

    } catch (error: any) {
        console.error('Unexpected error searching customers:', error);
        return { success: false, error: error.message || 'Error inesperado', customers: [] };
    }
}

/**
 * Server Action: Obtener información de crédito de un cliente específico
 */
export async function getCustomerCreditAction(customerId: string, distributorId: string) {
    try {
        const { data: relationship, error } = await adminClient
            .from('customer_relationships')
            .select('credit_limit, current_debt')
            .eq('customer_id', customerId)
            .eq('distributor_id', distributorId)
            .eq('status', 'active')
            .single();

        if (error || !relationship) {
            return {
                hasCredit: false,
                creditLimit: 0,
                currentDebt: 0,
                availableCredit: 0
            };
        }

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
        console.error('Error fetching customer credit:', error);
        return {
            hasCredit: false,
            creditLimit: 0,
            currentDebt: 0,
            availableCredit: 0
        };
    }
}

/**
 * Server Action: Obtener el rol del usuario para un distribuidor específico
 */
export async function getUserRoleAction(userId: string, distributorId: string) {
    const supabase = await createClient();

    try {
        const { data: distributorUser, error } = await supabase
            .from('distributor_users')
            .select('role')
            .eq('user_id', userId)
            .eq('distributor_id', distributorId)
            .eq('is_active', true)
            .maybeSingle();

        if (error) {
            console.error('Error fetching user role:', error);
            return null;
        }

        return distributorUser?.role || null;
    } catch (error) {
        console.error('Unexpected error fetching user role:', error);
        return null;
    }
}
