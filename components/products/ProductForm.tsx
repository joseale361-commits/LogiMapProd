'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Loader2, Camera, UploadCloud } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { uploadProductImage } from '@/lib/actions/products';
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
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
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

    // Helper function to handle URL input - converts URL to Supabase storage
    async function handleUrlInput(url: string): Promise<string | null> {
        if (!url) return null;

        // Check if it's already a Supabase URL (our storage)
        if (url.includes('supabase.co')) return url;

        try {
            // Fetch the image from the URL
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch image');

            const blob = await res.blob();

            // Convert blob to File
            const fileName = `url-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
            const file = new File([blob], fileName, { type: blob.type || 'image/webp' });

            // Compress the image
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1024,
                useWebWorker: true,
                fileType: 'image/webp'
            };
            const compressedFile = await imageCompression(file, options);

            // Upload to Supabase Storage
            const formData = new FormData();
            formData.append('file', compressedFile);

            const result = await uploadProductImage(formData, distributorSlug);

            if (result.success && result.url) {
                return result.url;
            } else {
                console.error('Error uploading URL image:', result.error);
                return null;
            }
        } catch (error) {
            console.error('Error processing URL image:', error);
            return null;
        }
    }

    // Handle file upload with compression
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploadProgress(10);

            // Compress Image
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1024,
                useWebWorker: true,
                fileType: 'image/webp'
            };

            const compressedFile = await imageCompression(file, options);
            setUploadProgress(40);

            // Preview
            const reader = new FileReader();
            reader.onloadend = () => setPreviewUrl(reader.result as string);
            reader.readAsDataURL(compressedFile);

            // Create FormData for Server Action
            const data = new FormData();
            data.append('file', compressedFile);

            // Upload
            setUploadProgress(60);
            const result = await uploadProductImage(data, distributorSlug);

            if (result.success && result.url) {
                setValue('image_url', result.url);
                setUploadProgress(100);
            } else {
                setError('Error uploading image: ' + (result.error || 'Unknown error'));
                setUploadProgress(0);
            }
        } catch (error) {
            console.error('Image processing error:', error);
            setError('Error processing image');
            setUploadProgress(0);
        }
    };

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
                    {/* Image Upload */}
                    <div className="space-y-2">
                        <Label>Imagen del Producto</Label>
                        <div className="flex items-start gap-4">
                            {/* Image Preview */}
                            <div
                                className="relative w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center overflow-hidden bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {(previewUrl || watch('image_url')) ? (
                                    <img
                                        src={previewUrl || watch('image_url')}
                                        alt="Preview"
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <Camera className="w-8 h-8 text-muted-foreground" />
                                )}

                                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <UploadCloud className="w-6 h-6 text-white" />
                                </div>
                            </div>

                            <div className="flex-1 space-y-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <UploadCloud className="w-4 h-4 mr-2" />
                                    Subir Imagen
                                </Button>

                                <Input
                                    id="image_url"
                                    {...register('image_url')}
                                    placeholder="O pega una URL..."
                                    type="url"
                                    className="text-xs"
                                    onChange={async (e) => {
                                        const url = e.target.value;
                                        setValue('image_url', url);

                                        // If it's a valid URL, try to convert to Supabase storage
                                        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
                                            setUploadProgress(10);
                                            const convertedUrl = await handleUrlInput(url);
                                            if (convertedUrl) {
                                                setValue('image_url', convertedUrl);
                                                setPreviewUrl(convertedUrl);
                                            }
                                            setUploadProgress(0);
                                        } else {
                                            setPreviewUrl(url);
                                        }
                                    }}
                                />

                                {uploadProgress > 0 && uploadProgress < 100 && (
                                    <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                    </div>
                                )}
                            </div>
                        </div>
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
