'use server';

import { adminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function updateProduct(id: string, data: any) {
    try {
        const {
            productName,
            brand,
            description,
            categoryId, // Matches FormData in UI
            images, // Now an array
            variants,
        } = data;

        // 1. Update main product
        const productUpdate = {
            name: productName,
            brand: brand,
            description: description,
            category_id: categoryId === 'uncategorized' ? null : categoryId,
            images: Array.isArray(images) ? images : [],
            updated_at: new Date().toISOString(),
        };

        const { error: productError } = await adminClient
            .from('products')
            .update(productUpdate)
            .eq('id', id);

        if (productError) throw new Error(`Error updating product: ${productError.message}`);

        // 2. Get existing variants to detect deletions
        const { data: existingVariants, error: fetchError } = await adminClient
            .from('product_variants')
            .select('id')
            .eq('product_id', id);

        if (fetchError) throw new Error(`Error fetching existing variants: ${fetchError.message}`);

        const existingVariantIds = new Set(existingVariants?.map((v: any) => v.id) || []);
        const submittedVariantIds = new Set(
            variants
                .filter((v: any) => v.id)
                .map((v: any) => v.id)
        );

        // 3. Handle variants
        if (variants && Array.isArray(variants) && variants.length > 0) {
            for (const variant of variants) {
                const attributes = {
                    ...variant.attributes,
                    target_stock: variant.target_stock || 0,
                    image_url: variant.image_url || null,
                };

                if (!variant.id) {
                    // Insert new variant
                    // Ensure stock values are integers
                    const stockVirtual = parseInt(String(variant.stock_virtual || 0), 10);
                    const targetStock = parseInt(String(variant.target_stock || 0), 10);

                    const { error: insertError } = await adminClient
                        .from('product_variants')
                        .insert({
                            product_id: id,
                            distributor_id: data.distributor_id,
                            sku: variant.sku,
                            price: variant.price,
                            stock_virtual: stockVirtual,
                            attributes: {
                                ...variant.attributes,
                                stock_virtual: stockVirtual,
                                target_stock: targetStock,
                            },
                            is_new: variant.is_new || false,
                            is_on_sale: variant.is_on_sale || false,
                            sale_price: variant.sale_price || 0,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        });

                    if (insertError) throw new Error(`Error inserting variant: ${insertError.message}`);
                } else {
                    // Update existing variant
                    // Ensure stock values are integers
                    const stockVirtual = parseInt(String(variant.stock_virtual || 0), 10);
                    const targetStock = parseInt(String(variant.target_stock || 0), 10);

                    const variantUpdate: any = {
                        sku: variant.sku,
                        price: variant.price,
                        stock_virtual: stockVirtual,
                        attributes: {
                            ...variant.attributes,
                            stock_virtual: stockVirtual,
                            target_stock: targetStock,
                        },
                        is_new: variant.is_new,
                        is_on_sale: variant.is_on_sale,
                        sale_price: variant.sale_price,
                        updated_at: new Date().toISOString(),
                    };

                    const { error: variantError } = await adminClient
                        .from('product_variants')
                        .update(variantUpdate)
                        .eq('id', variant.id);

                    if (variantError) throw new Error(`Error updating variant: ${variantError.message}`);
                }
            }
        }

        // 4. Delete variants that were removed
        const variantsToDelete = [...existingVariantIds].filter(id => !submittedVariantIds.has(id));
        if (variantsToDelete.length > 0) {
            const { error: deleteError } = await adminClient
                .from('product_variants')
                .delete()
                .in('id', variantsToDelete);

            if (deleteError) throw new Error(`Error deleting variants: ${deleteError.message}`);
        }

        revalidatePath('/dashboard/[slug]/products');
        revalidatePath('/dashboard/[slug]/inventory');
        return { success: true };
    } catch (error) {
        console.error('Update Product Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

export async function uploadProductImage(formData: FormData, slug: string) {
    try {
        const file = formData.get('file') as File;
        if (!file) throw new Error('No file uploaded');

        const fileName = `${slug}/${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;

        const { data, error } = await adminClient.storage
            .from('products')
            .upload(fileName, file, {
                contentType: 'image/webp',
                upsert: true
            });

        if (error) throw new Error(`Storage upload failed: ${error.message}`);

        const { data: publicData } = adminClient.storage
            .from('products')
            .getPublicUrl(fileName);

        return { success: true, url: publicData.publicUrl };
    } catch (error) {
        console.error('Upload Image Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Upload failed' };
    }
}

export async function createCategory(name: string, distributorId: string, slug: string) {
    // Categories are now string-based, so this is mostly a UI helper if needed
    // However, we return an object that matches the old expectation if possible
    return { success: true, category: { id: name, name: name } };
}

export async function deleteProductAction(productId: string, path: string) {
    try {
        const { error } = await adminClient
            .from('products')
            .delete()
            .eq('id', productId);

        if (error) throw new Error(`Error deleting product: ${error.message}`);

        revalidatePath(path);
        return { success: true };
    } catch (error) {
        console.error('Delete Product Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Delete failed' };
    }
}
