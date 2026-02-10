"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { createAddressAction } from '@/lib/actions/address';
import { toast } from 'sonner';
import { Loader2, MapPin } from 'lucide-react';

export function AddAddressDialog() {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        street_address: '',
        city: '',
        label: '',
        is_default: false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await createAddressAction(formData);

            if (result.success) {
                toast.success('Dirección agregada correctamente');
                setOpen(false);
                setFormData({
                    street_address: '',
                    city: '',
                    label: '',
                    is_default: false,
                });
            } else {
                toast.error(result.error || 'Error al agregar dirección');
            }
        } catch (error) {
            toast.error('Error inesperado');
            console.error('Error submitting address:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <MapPin className="w-4 h-4 mr-2" />
                    Agregar Dirección
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Agregar Nueva Dirección</DialogTitle>
                    <DialogDescription>
                        Completa los datos de tu dirección de entrega
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="street_address">Dirección *</Label>
                            <Input
                                id="street_address"
                                placeholder="Calle 123 #45-67"
                                value={formData.street_address}
                                onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="city">Ciudad *</Label>
                            <Input
                                id="city"
                                placeholder="Bogotá"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="label">Etiqueta (Opcional)</Label>
                            <Input
                                id="label"
                                placeholder="Casa, Oficina, etc."
                                value={formData.label}
                                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="is_default"
                                checked={formData.is_default}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, is_default: checked === true })
                                }
                            />
                            <Label
                                htmlFor="is_default"
                                className="text-sm font-normal cursor-pointer"
                            >
                                Establecer como dirección predeterminada
                            </Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                'Guardar'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
