import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

interface MappedRow {
    productName: string;
    variantName: string;
    price: number;
    packUnits: number;
    stock: number;
    sku: string;
}

interface GroupedProduct {
    name: string;
    variants: MappedRow[];
}

interface ImportRequest {
    products: GroupedProduct[];
}

interface ImportResult {
    success: boolean;
    message: string;
    productsCreated?: number;
    variantsCreated?: number;
    errors?: string[];
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const body: ImportRequest = await request.json();
        const { products } = body;

        if (!products || !Array.isArray(products)) {
            return NextResponse.json(
                { success: false, message: 'Datos inválidos' },
                { status: 400 }
            );
        }

        const { slug } = await params;

        if (!slug) {
            return NextResponse.json(
                { success: false, message: 'Distribuidor no especificado' },
                { status: 400 }
            );
        }

        // Get distributor ID from slug
        const { data: distributor, error: distributorError } = await adminClient
            .from('distributors')
            .select('id')
            .eq('slug', slug)
            .single();

        if (distributorError || !distributor) {
            return NextResponse.json(
                { success: false, message: 'Distribuidor no encontrado' },
                { status: 404 }
            );
        }

        const distributorId = distributor.id;
        const errors: string[] = [];
        let productsCreated = 0;
        let variantsCreated = 0;

        // Process each product
        for (const product of products) {
            try {
                // Validate product name
                if (!product.name || product.name.trim().length === 0) {
                    errors.push(`Producto sin nombre omitido`);
                    continue;
                }

                // Validate variants
                if (!product.variants || product.variants.length === 0) {
                    errors.push(`Producto "${product.name}" no tiene variantes`);
                    continue;
                }

                // Validate each variant has required fields
                const validVariants = product.variants.filter((variant) => {
                    if (!variant.price || variant.price <= 0) {
                        errors.push(`Variante "${variant.variantName}" de "${product.name}" tiene precio inválido`);
                        return false;
                    }
                    return true;
                });

                if (validVariants.length === 0) {
                    errors.push(`Producto "${product.name}" no tiene variantes válidas`);
                    continue;
                }

                // Check if product with same name already exists for this distributor
                const { data: existingProduct } = await adminClient
                    .from('products')
                    .select('id, sku')
                    .eq('distributor_id', distributorId)
                    .eq('name', product.name.trim())
                    .maybeSingle();

                let productId: string;
                let isNewProduct = false;

                if (existingProduct) {
                    productId = existingProduct.id;
                    // Update existing product basic info if needed
                    await adminClient
                        .from('products')
                        .update({
                            base_price: product.variants[0].price,
                            is_active: true,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', productId);
                } else {
                    // Generate SKU for parent product if creating new
                    const parentSKU = validVariants[0].sku && validVariants[0].sku.trim() !== ''
                        ? validVariants[0].sku.trim()
                        : `PROD-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

                    const { data: newProduct, error: productError } = await adminClient
                        .from('products')
                        .insert({
                            name: product.name.trim(),
                            sku: parentSKU,
                            base_price: product.variants[0].price,
                            distributor_id: distributorId,
                            is_active: true,
                        })
                        .select('id')
                        .single();

                    if (productError || !newProduct) {
                        errors.push(`Error al crear producto "${product.name}": ${productError?.message}`);
                        continue;
                    }
                    productId = newProduct.id;
                    isNewProduct = true;
                    productsCreated++;
                }

                // Process variants with Upsert-by-Name logic
                for (const [index, variant] of validVariants.entries()) {
                    // Search for existing variant by name within this product
                    const { data: existingVariant } = await adminClient
                        .from('product_variants')
                        .select('id')
                        .eq('product_id', productId)
                        .eq('name', variant.variantName.trim() || 'Unidad')
                        .maybeSingle();

                    const variantData = {
                        product_id: productId,
                        name: variant.variantName.trim() || 'Unidad',
                        price: variant.price,
                        pack_units: variant.packUnits || 1,
                        stock_virtual: variant.stock || 0,
                        is_active: true,
                        display_order: index,
                        updated_at: new Date().toISOString()
                    };

                    if (existingVariant) {
                        // Update existing variant
                        const { error: variantUpdateError } = await adminClient
                            .from('product_variants')
                            .update(variantData)
                            .eq('id', existingVariant.id);

                        if (variantUpdateError) {
                            errors.push(`Error al actualizar variante "${variant.variantName}" de "${product.name}": ${variantUpdateError.message}`);
                        }
                    } else {
                        // Insert new variant
                        const sku = variant.sku.trim() || `VAR-${Date.now()}-${index}`;
                        const { error: variantInsertError } = await adminClient
                            .from('product_variants')
                            .insert({ ...variantData, sku });

                        if (variantInsertError) {
                            errors.push(`Error al crear variante "${variant.variantName}" de "${product.name}": ${variantInsertError.message}`);
                        } else {
                            variantsCreated++;
                        }
                    }
                }

                // If it was a new product and ALL variants failed, we might want to delete it (cleanup)
                // But since we are iterating, some might have succeeded.
                if (isNewProduct && variantsCreated === 0 && validVariants.length > 0) {
                    await adminClient.from('products').delete().eq('id', productId);
                    productsCreated--;
                }
            } catch (error) {
                console.error(`Error processing product "${product.name}":`, error);
                errors.push(`Error inesperado al procesar "${product.name}"`);
            }
        }

        // Revalidate products list
        revalidatePath(`/dashboard/[slug]/products`, 'page');

        // Return result
        const success = errors.length === 0 || productsCreated > 0;
        const message = success
            ? `Importación completada: ${productsCreated} productos y ${variantsCreated} variantes creados${errors.length > 0 ? ` con ${errors.length} errores` : ''}`
            : 'No se pudo importar ningún producto';

        return NextResponse.json<ImportResult>({
            success,
            message,
            productsCreated,
            variantsCreated,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        console.error('Error in import API:', error);
        return NextResponse.json<ImportResult>(
            {
                success: false,
                message: 'Error interno del servidor',
                errors: [error instanceof Error ? error.message : 'Error desconocido'],
            },
            { status: 500 }
        );
    }
}
