'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { createProductAction } from '@/app/(dashboard)/dashboard/[slug]/products/new/actions';

// Validation schemas (client-side, matching server)
const variantSchema = z.object({
    name: z.string().min(1, 'El nombre de la variante es obligatorio'),
    sku: z.string().min(1, 'El SKU es obligatorio'),
    pack_units: z.coerce.number().int().positive('Pack units debe ser un número positivo'),
    price: z.coerce.number().positive('El precio debe ser mayor a 0'),
    stock_virtual: z.coerce.number().nonnegative('El stock no puede ser negativo'),
});

const formSchema = z.object({
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    description: z.string().optional(),
    brand: z.string().optional(),
    category_id: z.string().optional(),
    image_url: z.string().optional(),
    base_price: z.coerce.number().positive('El precio base debe ser mayor a 0'),
    variants: z.array(variantSchema).min(1, 'Debe agregar al menos una variante'),
});

type FormData = z.infer<typeof formSchema>;

interface ProductFormProps {
    distributorId: string;
    distributorSlug: string;
    categories: { id: string; name: string; slug: string }[];
}

export function ProductForm({ distributorId, distributorSlug, categories }: ProductFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
        setValue,
    } = useForm<FormData>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: '',
            description: '',
            brand: '',
            category_id: '',
            image_url: '',
            base_price: 0,
            variants: [
                {
                    name: '',
                    sku: '',
                    pack_units: 1,
                    price: 0,
                    stock_virtual: 0,
                },
            ],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'variants',
    });

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const result = await createProductAction({
                ...data,
                distributor_id: distributorId,
            });

            if (result.success) {
                router.push(`/dashboard/${distributorSlug}/products`);
                router.refresh();
            } else {
                setError(result.error || 'Error al crear el producto');
            }
        } catch (err) {
            console.error('Error submitting form:', err);
            setError('Error inesperado al crear el producto');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Error Display */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}

            {/* Section 1: General Information */}
            <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Datos Generales</h3>

                {/* Product Name */}
                <div className="space-y-2">
                    <Label htmlFor="name">
                        Nombre del Producto <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="name"
                        {...register('name')}
                        placeholder="Ej: Coca Cola"
                        className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && (
                        <p className="text-sm text-red-600">{errors.name.message}</p>
                    )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                        id="description"
                        {...register('description')}
                        placeholder="Descripción del producto"
                        rows={3}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Category */}
                    <div className="space-y-2">
                        <Label htmlFor="category_id">Categoría</Label>
                        <Select onValueChange={(value) => setValue('category_id', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Brand */}
                    <div className="space-y-2">
                        <Label htmlFor="brand">Marca</Label>
                        <Input
                            id="brand"
                            {...register('brand')}
                            placeholder="Ej: Coca Cola Company"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Image URL */}
                    <div className="space-y-2">
                        <Label htmlFor="image_url">URL de Imagen</Label>
                        <Input
                            id="image_url"
                            {...register('image_url')}
                            placeholder="https://example.com/image.jpg"
                            type="url"
                        />
                    </div>

                    {/* Base Price */}
                    <div className="space-y-2">
                        <Label htmlFor="base_price">
                            Precio Base <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="base_price"
                            {...register('base_price')}
                            placeholder="0.00"
                            type="number"
                            step="0.01"
                            className={errors.base_price ? 'border-red-500' : ''}
                        />
                        {errors.base_price && (
                            <p className="text-sm text-red-600">{errors.base_price.message}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Section 2: Variants */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Variantes del Producto
                    </h3>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            append({
                                name: '',
                                sku: '',
                                pack_units: 1,
                                price: 0,
                                stock_virtual: 0,
                            })
                        }
                        className="gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Agregar Variante
                    </Button>
                </div>

                {fields.map((field, index) => (
                    <div
                        key={field.id}
                        className="p-6 border border-gray-200 rounded-lg space-y-4 relative"
                    >
                        {/* Remove button */}
                        {fields.length > 1 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                                className="absolute top-4 right-4 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}

                        <h4 className="font-medium text-gray-700">
                            Variante #{index + 1}
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Variant Name */}
                            <div className="space-y-2">
                                <Label htmlFor={`variants.${index}.name`}>
                                    Nombre <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    {...register(`variants.${index}.name`)}
                                    placeholder="Ej: Lata 330ml"
                                    className={errors.variants?.[index]?.name ? 'border-red-500' : ''}
                                />
                                {errors.variants?.[index]?.name && (
                                    <p className="text-sm text-red-600">
                                        {errors.variants[index]?.name?.message}
                                    </p>
                                )}
                            </div>

                            {/* SKU */}
                            <div className="space-y-2">
                                <Label htmlFor={`variants.${index}.sku`}>
                                    SKU <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    {...register(`variants.${index}.sku`)}
                                    placeholder="Ej: CC-330ML"
                                    className={errors.variants?.[index]?.sku ? 'border-red-500' : ''}
                                />
                                {errors.variants?.[index]?.sku && (
                                    <p className="text-sm text-red-600">
                                        {errors.variants[index]?.sku?.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Pack Units */}
                            <div className="space-y-2">
                                <Label htmlFor={`variants.${index}.pack_units`}>
                                    Pack Units <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    {...register(`variants.${index}.pack_units`)}
                                    placeholder="1"
                                    type="number"
                                    min="1"
                                    className={errors.variants?.[index]?.pack_units ? 'border-red-500' : ''}
                                />
                                {errors.variants?.[index]?.pack_units && (
                                    <p className="text-sm text-red-600">
                                        {errors.variants[index]?.pack_units?.message}
                                    </p>
                                )}
                            </div>

                            {/* Price */}
                            <div className="space-y-2">
                                <Label htmlFor={`variants.${index}.price`}>
                                    Precio Mayorista <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    {...register(`variants.${index}.price`)}
                                    placeholder="0.00"
                                    type="number"
                                    step="0.01"
                                    className={errors.variants?.[index]?.price ? 'border-red-500' : ''}
                                />
                                {errors.variants?.[index]?.price && (
                                    <p className="text-sm text-red-600">
                                        {errors.variants[index]?.price?.message}
                                    </p>
                                )}
                            </div>

                            {/* Stock */}
                            <div className="space-y-2">
                                <Label htmlFor={`variants.${index}.stock_virtual`}>
                                    Stock Inicial
                                </Label>
                                <Input
                                    {...register(`variants.${index}.stock_virtual`)}
                                    placeholder="0"
                                    type="number"
                                    min="0"
                                    className={errors.variants?.[index]?.stock_virtual ? 'border-red-500' : ''}
                                />
                                {errors.variants?.[index]?.stock_virtual && (
                                    <p className="text-sm text-red-600">
                                        {errors.variants[index]?.stock_virtual?.message}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {errors.variants && (
                    <p className="text-sm text-red-600">{errors.variants.message}</p>
                )}
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/dashboard/${distributorSlug}/products`)}
                    disabled={isSubmitting}
                >
                    Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isSubmitting ? 'Creando...' : 'Crear Producto'}
                </Button>
            </div>
        </form>
    );
}
