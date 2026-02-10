'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminClient } from '@/lib/supabase/admin';

// Validation schemas
const variantSchema = z.object({
    name: z.string().min(1, 'El nombre de la variante es obligatorio'),
    sku: z.string().min(1, 'El SKU es obligatorio'),
    pack_units: z.coerce.number().int().positive('Pack units debe ser un número positivo').default(1),
    price: z.coerce.number().positive('El precio debe ser mayor a 0'),
    stock_virtual: z.coerce.number().nonnegative('El stock no puede ser negativo').default(0),
});

const productSchema = z.object({
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    description: z.string().optional(),
    brand: z.string().optional(),
    category_id: z.string().uuid('Categoría inválida').optional(),
    image_url: z.string().url('URL de imagen inválida').optional().or(z.literal('')),
    base_price: z.coerce.number().positive('El precio base debe ser mayor a 0'),
    distributor_id: z.string().uuid('Distribuidor inválido'),
    variants: z.array(variantSchema).min(1, 'Debe agregar al menos una variante'),
});

export type ProductFormData = z.infer<typeof productSchema>;

interface ActionResult {
    success: boolean;
    error?: string;
    productId?: string;
}

/**
 * Server action to create a product with variants.
 * Uses a transaction-like approach by inserting product first, then variants.
 */
export async function createProductAction(
    formData: ProductFormData
): Promise<ActionResult> {
    try {
        // Validate input
        const validated = productSchema.parse(formData);

        // Extract variants and product data
        const { variants, ...productData } = validated;

        // Generate SKU for parent product (using first variant's SKU as base)
        const parentSKU = variants[0].sku.split('-')[0] || `PROD-${Date.now()}`;

        // Step 1: Insert product
        const { data: product, error: productError } = await adminClient
            .from('products')
            .insert({
                ...productData,
                sku: parentSKU,
                is_active: true,
                category_id: productData.category_id || null,
                image_url: productData.image_url || null,
                description: productData.description || null,
                brand: productData.brand || null,
            })
            .select('id')
            .single();

        if (productError || !product) {
            console.error('[CreateProduct] Error creating product:', productError);
            return {
                success: false,
                error: 'Error al crear el producto. Por favor intenta nuevamente.',
            };
        }

        // Step 2: Insert all variants
        const variantsToInsert = variants.map((variant) => ({
            ...variant,
            product_id: product.id,
            is_active: true,
        }));

        const { error: variantsError } = await adminClient
            .from('product_variants')
            .insert(variantsToInsert);

        if (variantsError) {
            console.error('[CreateProduct] Error creating variants:', variantsError);

            // Cleanup: Delete the product if variants failed
            await adminClient.from('products').delete().eq('id', product.id);

            return {
                success: false,
                error: 'Error al crear las variantes del producto. Por favor intenta nuevamente.',
            };
        }

        // Revalidate products list
        revalidatePath(`/dashboard/[slug]/products`, 'page');

        return {
            success: true,
            productId: product.id,
        };
    } catch (error) {
        console.error('[CreateProduct] Unexpected error:', error);

        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: error.issues.map((e) => e.message).join(', '),
            };
        }

        return {
            success: false,
            error: 'Error inesperado al crear el producto.',
        };
    }
}
