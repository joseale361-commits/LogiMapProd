"use client";

import { useState, useCallback, useRef } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Button } from './button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Label } from './label';
import { ZoomIn, ZoomOut, Check, X } from 'lucide-react';

interface CropModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageSrc: string | null;
    onCropComplete: (croppedFile: Blob) => void;
}

export function CropModal({
    isOpen,
    onClose,
    imageSrc,
    onCropComplete,
}: CropModalProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const imageRef = useRef<HTMLImageElement | null>(null);

    const onCropCompleteCallback = useCallback(
        (croppedArea: Area, croppedAreaPixels: Area) => {
            setCroppedAreaPixels(croppedAreaPixels);
        },
        []
    );

    const getCroppedImg = async (
        imageSrc: string,
        pixelCrop: Area
    ): Promise<Blob | null> => {
        const image = new Image();
        image.src = imageSrc;
        await new Promise((resolve) => (image.onload = resolve));

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) return null;

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Canvas is empty'));
                    }
                },
                'image/jpeg',
                0.95
            );
        });
    };

    const handleConfirm = async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        setIsProcessing(true);
        try {
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (croppedBlob) {
                onCropComplete(croppedBlob);
                onClose();
            }
        } catch (error) {
            console.error('Error cropping image:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClose = () => {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        onClose();
    };

    if (!imageSrc) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Ajusta la imagen</DialogTitle>
                </DialogHeader>

                <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropCompleteCallback}
                    />
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <ZoomIn className="w-4 h-4" />
                            Zoom
                        </Label>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setZoom(Math.max(1, zoom - 0.1))}
                                disabled={zoom <= 1}
                            >
                                <ZoomOut className="w-4 h-4" />
                            </Button>
                            <input
                                type="range"
                                min={1}
                                max={3}
                                step={0.1}
                                value={zoom}
                                onChange={(e) => setZoom(parseFloat(e.target.value))}
                                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                                disabled={zoom >= 3}
                            >
                                <ZoomIn className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isProcessing}
                        >
                            <X className="w-4 h-4 mr-2" />
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={handleConfirm}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4 mr-2" />
                                    Listo
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
