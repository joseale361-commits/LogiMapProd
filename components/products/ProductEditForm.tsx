'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { Camera, Save, ArrowLeft, Plus, Loader2, UploadCloud, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { updateProduct, uploadProductImage, createCategory } from '@/lib/actions/products';

// Image compression utility
import imageCompression from 'browser-image-compression';

// Helper function to handle URL input - converts URL to Supabase storage
async function handleUrlInput(url: string, slug: string): Promise<string | null> {
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

        const result = await uploadProductImage(formData, slug);

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

interface Variant {
    id?: string;
    name: string;
    sku: string;
    price: number;
    stock_virtual: number;
    target_stock: number;
    image_url?: string;
    is_new: boolean;
    is_on_sale: boolean;
    sale_price: number;
}

interface Category {
    id: string;
    name: string;
}

interface ProductEditFormProps {
    product: any;
    variants: Variant[];
    categories: Category[];
    distributorId: string;
    slug: string;
}

type FormData = {
    productName: string;
    brand: string;
    description: string;
    categoryId: string;
    price: number;
    isOnSale: boolean;
    salePrice: number;
    isNew: boolean;
    imageUrl: string;
    variants: Variant[];
};

export default function ProductEditForm({ product, variants, categories, distributorId, slug }: ProductEditFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [categoryList, setCategoryList] = useState(categories);
    const [previewUrl, setPreviewUrl] = useState(product.image_url || '');
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

    const {
        register,
        control,
        handleSubmit,
        setValue,
        watch,
    } = useForm<FormData>({
        defaultValues: {
            productName: product.name,
            brand: product.brand || '',
            description: product.description || '',
            categoryId: product.category_id || 'uncategorized',
            price: product.base_price,
            isOnSale: product.is_on_sale || false,
            salePrice: product.sale_price || 0,
            isNew: product.is_new || false,
            imageUrl: product.image_url || '',
            variants: variants.map(v => ({
                id: v.id,
                name: v.name,
                sku: v.sku,
                price: v.price,
                stock_virtual: v.stock_virtual || 0,
                target_stock: v.target_stock || 0,
                image_url: v.image_url || '',
                is_new: v.is_new || false,
                is_on_sale: v.is_on_sale || false,
                sale_price: v.sale_price || 0,
            })),
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'variants',
    });

    const watchedImageUrl = watch('imageUrl');

    // Image Compression and Upload
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploadProgress(10);

            // Compress Image
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 800,
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
            const result = await uploadProductImage(data, slug);

            if (result.success && result.url) {
                setValue('imageUrl', result.url);
                setUploadProgress(100);
            } else {
                alert('Error submitting image: ' + result.error);
                setUploadProgress(0);
            }

        } catch (error) {
            console.error('Image processing error:', error);
            alert('Error processing image');
            setUploadProgress(0);
        }
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return;

        const result = await createCategory(newCategoryName, distributorId, slug);
        if (result.success && result.category) {
            setCategoryList(prev => [...prev, result.category]);
            setValue('categoryId', result.category.id);
            setIsCategoryDialogOpen(false);
            setNewCategoryName('');
        } else {
            alert('Error creating category');
        }
    };

    const handleVariantImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            // Compress
            const options = { maxSizeMB: 0.5, maxWidthOrHeight: 600, useWebWorker: true };
            const compressedFile = await imageCompression(file, options);

            // Upload
            const data = new FormData();
            data.append('file', compressedFile);

            const result = await uploadProductImage(data, slug);

            if (result.success && result.url) {
                setValue(`variants.${index}.image_url`, result.url);
            } else {
                alert('Error uploading variant image: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error uploading variant image', error);
        }
    };

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);

        const result = await updateProduct(product.id, {
            ...data,
            distributor_id: distributorId
        });

        if (result.success) {
            router.push(`/dashboard/${slug}/products`);
            router.refresh();
        } else {
            alert('Error updating product: ' + result.error);
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-5xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button type="button" variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Editar Producto</h1>
                        <p className="text-muted-foreground text-sm">Gestiona detalles y stock</p>
                    </div>
                </div>
                <Button type="submit" disabled={isLoading || uploadProgress > 0 && uploadProgress < 100}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Guardar Cambios
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Image & Basic Info */}
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Imagen del Producto</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center">
                            <div className="relative group w-48 h-48 mb-4 border-2 border-dashed rounded-lg flex items-center justify-center overflow-hidden bg-muted/20 hover:bg-muted/40 transition-colors">
                                {previewUrl || watchedImageUrl ? (
                                    <img src={previewUrl || watchedImageUrl} alt="Preview" className="w-full h-full object-contain" />
                                ) : (
                                    <Camera className="w-12 h-12 text-muted-foreground" />
                                )}

                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <p className="text-white text-sm font-medium flex items-center">
                                        <UploadCloud className="w-4 h-4 mr-2" /> Cambiar
                                    </p>
                                </div>
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                            />

                            <div className="w-full space-y-2">
                                <Label htmlFor="imageUrl" className="text-xs">O pegar URL</Label>
                                <Input
                                    id="imageUrl"
                                    {...register('imageUrl')}
                                    placeholder="https://example.com/image.jpg"
                                    className="text-xs"
                                    onChange={async (e) => {
                                        const url = e.target.value;
                                        setValue('imageUrl', url);

                                        // If it's a valid URL, try to convert to Supabase storage
                                        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
                                            setUploadProgress(10);
                                            const convertedUrl = await handleUrlInput(url, slug);
                                            if (convertedUrl) {
                                                setValue('imageUrl', convertedUrl);
                                                setPreviewUrl(convertedUrl);
                                            }
                                            setUploadProgress(0);
                                        } else {
                                            setPreviewUrl(url);
                                        }
                                    }}
                                />
                            </div>

                            {uploadProgress > 0 && uploadProgress < 100 && (
                                <div className="w-full mt-2 h-1 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Organización</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Categoría</Label>
                                <div className="flex gap-2">
                                    <Select
                                        value={watch('categoryId') || 'uncategorized'}
                                        onValueChange={(val) => setValue('categoryId', val)}
                                    >
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Seleccionar..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="uncategorized">Sin Categoría</SelectItem>
                                            {categoryList.map(cat => (
                                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="icon">
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Nueva Categoría</DialogTitle>
                                            </DialogHeader>
                                            <div className="py-4">
                                                <Label>Nombre</Label>
                                                <Input
                                                    value={newCategoryName}
                                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                                    placeholder="Ej: Licores"
                                                />
                                            </div>
                                            <DialogFooter>
                                                <Button onClick={handleCreateCategory}>Crear</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Marca</Label>
                                <Input
                                    {...register('brand')}
                                    placeholder="Ej: Bavaria"
                                />
                            </div>

                        </CardContent>
                    </Card>
                </div>

                {/* Center & Right: Details & Variants */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalles Generales</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nombre del Producto</Label>
                                <Input
                                    {...register('productName')}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Descripción</Label>
                                <Textarea
                                    {...register('description')}
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>


                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Variantes y Stock</CardTitle>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        append({
                                            name: '',
                                            sku: '',
                                            price: 0,
                                            stock_virtual: 0,
                                            target_stock: 0,
                                            image_url: '',
                                            is_new: false,
                                            is_on_sale: false,
                                            sale_price: 0
                                        })
                                    }
                                    className="gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Agregar Variante
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex items-start gap-4 p-4 border rounded-lg bg-card/50 relative">
                                        {/* Remove button */}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => remove(index)}
                                            className="absolute top-2 right-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>

                                        {/* Variant Image */}
                                        <div className="relative group w-16 h-16 border rounded bg-muted/20 flex-shrink-0 flex items-center justify-center overflow-hidden cursor-pointer"
                                            onClick={() => document.getElementById(`variant-image-${index}`)?.click()}>
                                            {watch(`variants.${index}.image_url`) ? (
                                                <img src={watch(`variants.${index}.image_url`)} alt={watch(`variants.${index}.name`)} className="w-full h-full object-contain" />
                                            ) : (
                                                <Camera className="w-6 h-6 text-muted-foreground" />
                                            )}
                                            <input
                                                id={`variant-image-${index}`}
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => handleVariantImageUpload(index, e)}
                                            />
                                        </div>

                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs">Nombre</Label>
                                                <Input
                                                    {...register(`variants.${index}.name`)}
                                                    placeholder="Ej: Lata 330ml"
                                                    className="h-8"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs">SKU</Label>
                                                <Input
                                                    {...register(`variants.${index}.sku`)}
                                                    placeholder="Ej: CC-330ML"
                                                    className="h-8"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs">Precio</Label>
                                                <Input
                                                    type="number"
                                                    {...register(`variants.${index}.price`, { valueAsNumber: true })}
                                                    className="h-8"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs">Stock Actual</Label>
                                                <Input
                                                    type="number"
                                                    {...register(`variants.${index}.stock_virtual`, { valueAsNumber: true })}
                                                    className="h-8"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-blue-600 font-medium">Límite Diario (Target)</Label>
                                                <Input
                                                    type="number"
                                                    {...register(`variants.${index}.target_stock`, { valueAsNumber: true })}
                                                    className="h-8 border-blue-200 focus-visible:ring-blue-500"
                                                />
                                            </div>

                                            {/* Promotions Section */}
                                            <div className="col-span-full border-t pt-4 mt-2">
                                                <p className="text-sm font-medium mb-3 text-gray-700">Promociones y Marketing</p>
                                                <div className="flex flex-wrap items-center gap-6">
                                                    <div className="flex items-center space-x-2 border p-2 rounded-md bg-gray-50">
                                                        <Checkbox
                                                            id={`is-new-${index}`}
                                                            checked={watch(`variants.${index}.is_new`)}
                                                            onCheckedChange={(checked) => setValue(`variants.${index}.is_new`, checked as boolean)}
                                                        />
                                                        <Label htmlFor={`is-new-${index}`} className="cursor-pointer">Es Nuevo</Label>
                                                    </div>

                                                    <div className="flex items-center space-x-2 border p-2 rounded-md bg-gray-50">
                                                        <Checkbox
                                                            id={`is-sale-${index}`}
                                                            checked={watch(`variants.${index}.is_on_sale`)}
                                                            onCheckedChange={(checked) => {
                                                                setValue(`variants.${index}.is_on_sale`, checked as boolean);
                                                                if (!checked) {
                                                                    setValue(`variants.${index}.sale_price`, 0);
                                                                }
                                                            }}
                                                        />
                                                        <Label htmlFor={`is-sale-${index}`} className="cursor-pointer">En Oferta</Label>
                                                    </div>

                                                    {watch(`variants.${index}.is_on_sale`) && (
                                                        <div className="flex-1 min-w-[150px] animate-in fade-in slide-in-from-left-2 duration-300">
                                                            <Label className="text-xs text-green-600 font-bold mb-1 block">Precio de Oferta</Label>
                                                            <Input
                                                                type="number"
                                                                placeholder="0"
                                                                {...register(`variants.${index}.sale_price`, { valueAsNumber: true })}
                                                                className="h-9 border-green-200 focus-visible:ring-green-500 bg-green-50/50"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {fields.length === 0 && (
                                    <p className="text-center text-muted-foreground text-sm py-4">Este producto no tiene variantes configuradas.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </form >
    );
}
