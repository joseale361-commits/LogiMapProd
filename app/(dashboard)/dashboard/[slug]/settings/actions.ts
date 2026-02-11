'use server'

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/supabase/server';
import { getDistributorBySlug } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

export async function updateSettings(
    prevState: any,
    formData: FormData
) {
    // DEBUG: Log coordinates received from form
    const rawLat = formData.get('lat');
    const rawLng = formData.get('lng');
    console.log('SERVER ACTION RECEIVED:', { rawLat, rawLng });

    try {
        const slug = formData.get('slug') as string;
        const name = formData.get('name') as string;
        const phone = formData.get('phone') as string;
        const logo_url = formData.get('logo_url') as string | null;
        const colorsJson = formData.get('colors') as string;
        const delivery_zonesJson = formData.get('delivery_zones') as string;
        const delivery_settingsJson = formData.get('delivery_settings') as string;
        const warehouse_address = formData.get('warehouse_address') as string | null;

        // Parse coordinates from formData
        const lat = parseFloat(rawLat as string);
        const lng = parseFloat(rawLng as string);

        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, error: 'No autenticado' };
        }

        // Get distributor
        const distributor = await getDistributorBySlug(slug);
        if (!distributor) {
            return { success: false, error: 'Distribuidora no encontrada' };
        }

        // Build update object
        const updateData: any = {};
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;
        if (logo_url !== null) updateData.logo_url = logo_url;

        // Handle colors and delivery_settings as JSONB in settings
        if (colorsJson || delivery_settingsJson) {
            try {
                const settings = {
                    ...(distributor.settings as any || {}),
                };

                if (colorsJson) {
                    const colors = JSON.parse(colorsJson);
                    settings.colors = colors;
                }

                if (delivery_settingsJson) {
                    const delivery_settings = JSON.parse(delivery_settingsJson);
                    settings.delivery_settings = delivery_settings;
                }

                updateData.settings = settings;
            } catch (e) {
                console.error('Error parsing settings JSON:', e);
            }
        }

        // Handle delivery zones as JSON
        if (delivery_zonesJson) {
            try {
                updateData.delivery_zones = JSON.parse(delivery_zonesJson);
            } catch (e) {
                console.error('Error parsing delivery_zones JSON:', e);
            }
        }

        // Parse coordinates from formData
        // Note: lat and lng already declared above
        if (isNaN(lat) || isNaN(lng)) {
            console.error('Invalid coordinates:', { lat, lng });
        }

        // CRITICAL: PostGIS requires LONGITUDE FIRST
        // Format: POINT(longitude latitude)
        const locationPoint = `POINT(${lng} ${lat})`;

        // Update distributor with the location
        updateData.location = locationPoint;

        if (warehouse_address !== null) {
            updateData.warehouse_address = warehouse_address;
        }

        // Update distributor
        const { data: updatedDistributor, error } = await adminClient
            .from('distributors')
            .update(updateData)
            .eq('id', distributor.id)
            .select()
            .single();

        if (error) {
            console.error('[API] Error updating distributor:', error.message);
            return { success: false, error: 'Error al actualizar la configuración: ' + error.message };
        }

        // CRITICAL: Validate that rows were actually updated
        if (!updatedDistributor) {
            console.error('CRITICAL: Update succeeded but NO rows were modified. Check RLS or ID mismatch.');
            console.error('DEBUG: distributor.id =', distributor.id, '| slug =', slug);
            return { success: false, error: 'No se pudo guardar. Permisos insuficientes o tienda no encontrada.' };
        }

        console.log('SUCCESS: Updated distributor location:', updatedDistributor.location);

        // Force cache refresh so the map shows the new location immediately
        revalidatePath(`/dashboard/${slug}/settings`);
        revalidatePath(`/dashboard/${slug}/routes`);

        return { success: true, distributor: updatedDistributor };
    } catch (error) {
        console.error('[API] Error updating settings:', error);
        return { success: false, error: 'Error interno del servidor' };
    }
}
