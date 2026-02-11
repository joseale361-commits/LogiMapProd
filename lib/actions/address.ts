'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface AddressActionInput {
    id?: string;
    street_address: string;
    city: string;
    state?: string;
    country?: string;
    postal_code?: string;
    label?: string;
    additional_info?: string;
    delivery_instructions?: string;
    is_default?: boolean;
    lat?: number;
    lng?: number;
}

/**
 * Create or update an address
 */
export async function saveAddressAction(input: AddressActionInput, customerId?: string) {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { success: false, error: 'Usuario no autenticado' };
    }

    try {
        const lng = input.lng || 0;
        const lat = input.lat || 0;
        const locationWKT = `POINT(${lng} ${lat})`;

        const addressData = {
            user_id: user.id,
            street_address: input.street_address,
            city: input.city,
            state: input.state || null,
            country: input.country || 'CO',
            postal_code: input.postal_code || null,
            label: input.label || null,
            additional_info: input.additional_info || null,
            delivery_instructions: input.delivery_instructions || null,
            is_default: input.is_default || false,
            location: locationWKT,
            is_active: true,
        };

        let result;
        if (input.id) {
            // Update
            result = await (supabase.from('addresses') as any)
                .update(addressData)
                .eq('id', input.id)
                .eq('user_id', user.id);
        } else {
            // Create
            result = await (supabase.from('addresses') as any)
                .insert(addressData);
        }

        if (result.error) {
            console.error('Error saving address:', result.error);
            return { success: false, error: result.error.message };
        }

        // Revalidate customer profile page to show the new address
        if (customerId) {
            revalidatePath(`/dashboard/customers/${customerId}`);
            revalidatePath('/dashboard/customers');
        }

        // Also revalidate shop profile and checkout
        revalidatePath('/shop/profile');
        revalidatePath('/checkout');

        return { success: true };
    } catch (error) {
        console.error('Unexpected error in saveAddressAction:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error inesperado',
        };
    }
}
