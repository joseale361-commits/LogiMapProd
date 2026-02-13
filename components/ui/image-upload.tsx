"use client";

import { useState, useRef, useCallback } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Upload, X, Image as ImageIcon, Loader2, CloudUpload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import imageCompression from 'browser-image-compression';
import { CropModal } from './crop-modal';

interface ImageUploadProps {
    value?: string;
    onChange?: (value: string) => void;
    onRemove?: () => void;
    label?: string;
    placeholder?: string;
    bucket?: string;
    folder?: string;
}

export function ImageUpload({
    value,
    onChange,
    onRemove,
    label = "Imagen",
    placeholder = "https://ejemplo.com/imagen.png",
    bucket = 'assets',
    folder = 'logos'
}: ImageUploadProps) {
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState(value || '');
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const createImageUrl = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        });
    };

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Por favor selecciona una imagen válida (JPEG, PNG, GIF o WebP)',
            });
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'La imagen no debe superar los 5MB',
            });
            return;
        }

        // Create preview URL and open crop modal
        const imageUrl = await createImageUrl(file);
        setImageSrc(imageUrl);
        setCropModalOpen(true);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [toast]);

    const handleCropComplete = useCallback(async (croppedBlob: Blob) => {
        setIsUploading(true);

        try {
            // Convert blob to file
            const croppedFile = new File([croppedBlob], `cropped-${Date.now()}.webp`, {
                type: 'image/webp',
            });

            // Compress the cropped image
            const options = {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 400,
                useWebWorker: true,
                fileType: 'image/webp'
            };
            const compressedFile = await imageCompression(croppedFile, options);

            const supabase = createClient();
            const fileExt = 'webp';
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${folder}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, compressedFile);

            if (uploadError) {
                throw uploadError;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            onChange?.(publicUrl);
            setInputValue(publicUrl);
            setIsEditing(false);

            toast({
                variant: 'default',
                title: 'Éxito',
                description: 'Imagen subida correctamente',
            });
        } catch (error: any) {
            console.error('Upload error:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Error al subir la imagen',
            });
        } finally {
            setIsUploading(false);
        }
    }, [bucket, folder, onChange, toast]);

    const handleSave = () => {
        if (inputValue.trim()) {
            onChange?.(inputValue.trim());
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setInputValue(value || '');
        setIsEditing(false);
    };

    const handleRemove = () => {
        onRemove?.();
        setInputValue('');
    };

    const handleDropzoneClick = () => {
        fileInputRef.current?.click();
    };

    if (!isEditing && value) {
        return (
            <div className="space-y-4">
                <Label>{label}</Label>
                <div className="relative border rounded-lg overflow-hidden bg-gray-50">
                    <img
                        src={value}
                        alt={label}
                        className="w-full h-48 object-contain"
                        onError={() => {
                            // Image failed to load, show placeholder
                        }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <img
                            src={value}
                            alt={label}
                            className="max-h-40 object-contain"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Cambiar Logo
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                    >
                        Cambiar URL
                    </Button>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isUploading}
                />
                <CropModal
                    isOpen={cropModalOpen}
                    onClose={() => setCropModalOpen(false)}
                    imageSrc={imageSrc}
                    onCropComplete={handleCropComplete}
                />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <Label>{label}</Label>

            {/* Dropzone */}
            <div
                onClick={handleDropzoneClick}
                className={`
                    relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                    transition-colors duration-200 ease-in-out
                    ${isUploading
                        ? 'border-gray-300 bg-gray-50 cursor-wait'
                        : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                    }
                `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isUploading}
                />

                {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                        <p className="text-sm text-gray-600">Subiendo imagen...</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <CloudUpload className="w-10 h-10 text-gray-400" />
                        <p className="text-sm text-gray-600">
                            Haz clic para seleccionar una imagen
                        </p>
                        <p className="text-xs text-gray-400">
                            JPEG, PNG, GIF o WebP (max 5MB)
                        </p>
                    </div>
                )}
            </div>

            {/* URL Input (alternative) */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ImageIcon className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                    id="image-url"
                    type="url"
                    placeholder={placeholder}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="pl-10"
                    disabled={isUploading}
                />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <Button
                    type="button"
                    onClick={handleSave}
                    disabled={!inputValue.trim() || isUploading}
                >
                    Guardar URL
                </Button>
                {value && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isUploading}
                    >
                        Cancelar
                    </Button>
                )}
            </div>

            {/* Preview */}
            {inputValue && inputValue.trim() && (
                <div className="border rounded-lg p-4 bg-gray-50">
                    <p className="text-xs text-gray-500 mb-2">Vista previa:</p>
                    <img
                        src={inputValue}
                        alt="Vista previa"
                        className="max-h-32 object-contain mx-auto"
                        onError={() => {
                            console.warn('Invalid image URL');
                        }}
                    />
                </div>
            )}

            {/* Crop Modal */}
            <CropModal
                isOpen={cropModalOpen}
                onClose={() => setCropModalOpen(false)}
                imageSrc={imageSrc}
                onCropComplete={handleCropComplete}
            />
        </div>
    );
}
