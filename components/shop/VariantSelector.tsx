"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database } from '@/types/supabase';

type ProductVariant = Database['public']['Tables']['product_variants']['Row'];

interface VariantSelectorProps {
    variants: ProductVariant[];
    selectedVariantId: string;
    onVariantChange: (variantId: string) => void;
    disabled?: boolean;
}

export function VariantSelector({
    variants,
    selectedVariantId,
    onVariantChange,
    disabled = false
}: VariantSelectorProps) {
    const selectedVariant = variants.find(v => v.id === selectedVariantId);

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
                Selecciona variante
            </label>
            <Select
                value={selectedVariantId}
                onValueChange={onVariantChange}
                disabled={disabled}
            >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona una variante" />
                </SelectTrigger>
                <SelectContent>
                    {variants.map((variant) => (
                        <SelectItem key={variant.id} value={variant.id}>
                            <div className="flex items-center justify-between gap-4">
                                <span className="font-medium">{variant.name}</span>
                                <span className="text-sm text-gray-500">
                                    {variant.pack_units} {variant.pack_units === 1 ? 'unidad' : 'unidades'}
                                </span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {selectedVariant && (
                <p className="text-xs text-gray-500">
                    SKU: {selectedVariant.sku}
                </p>
            )}
        </div>
    );
}
