'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { createCategory, updateCategory } from '@/lib/actions/categories';
import { Loader2, Plus, Pencil, Trash } from 'lucide-react';

interface Category {
    id: string;
    name: string;
    icon: string | null;
    display_order: number | null;
    is_active: boolean | null;
}

interface CategoryFormProps {
    distributorId: string;
    slug: string;
    category?: Category; // If present, it's edit mode
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

export function CategoryForm({ distributorId, slug, category, trigger, onSuccess }: CategoryFormProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState(category?.name || '');
    const [icon, setIcon] = useState(category?.icon || '');
    const [displayOrder, setDisplayOrder] = useState(category?.display_order?.toString() || '0');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData();
        formData.append('name', name);
        formData.append('icon', icon);
        formData.append('display_order', displayOrder);
        if (category) {
            formData.append('is_active', String(category.is_active));
        }

        const result = category
            ? await updateCategory(category.id, formData, slug)
            : await createCategory(formData, distributorId, slug);

        setIsLoading(false);

        if (result.success) {
            setOpen(false);
            if (!category) {
                // Reset form on create
                setName('');
                setIcon('');
                setDisplayOrder('0');
            }
            if (onSuccess) onSuccess();
        } else {
            alert(result.error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Categoría
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{category ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Nombre</Label>
                        <Input
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej: Licores"
                        />
                    </div>
                    <div className="space-y-3">
                        <Label>Icono (Visual)</Label>
                        <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/20">
                            {['🍺', '🥤', '💧', '⚡', '🥃', '🧃', '🍟', '🔥', '⭐', '🆕'].map((emoji) => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => setIcon(emoji)}
                                    className={`w-10 h-10 flex items-center justify-center text-2xl rounded-md transition-all ${icon === emoji
                                            ? 'bg-primary text-primary-foreground scale-110 shadow-md'
                                            : 'bg-background hover:bg-muted border border-border'
                                        }`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                        <div className="pt-1">
                            <Label className="text-xs text-muted-foreground mb-1 block italic">U otro emoji o texto:</Label>
                            <Input
                                value={icon}
                                onChange={(e) => setIcon(e.target.value)}
                                placeholder="Escribe un emoji..."
                                className="h-9"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Orden</Label>
                        <Input
                            type="number"
                            value={displayOrder}
                            onChange={(e) => setDisplayOrder(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
