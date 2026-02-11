'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, User, Mail, Lock, Building2, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';

// Validation schema
const registerSchema = z.object({
    fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    phone: z.string().min(10, 'Ingresa un número de teléfono válido'),
    email: z.string().email('Ingresa un correo electrónico válido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [distributorSlug, setDistributorSlug] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            fullName: '',
            phone: '',
            email: '',
            password: '',
        },
    });

    useEffect(() => {
        // Check URL params for distributor invite
        const distributor = searchParams.get('distributor');
        const email = searchParams.get('email');

        if (distributor) {
            setDistributorSlug(distributor);
        }

        if (email) {
            setValue('email', email);
        }
    }, [searchParams, setValue]);

    const onSubmit = async (data: RegisterFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            const body: RegisterFormData & { distributor_id?: string } = { ...data };

            if (distributorSlug) {
                body.distributor_id = distributorSlug;
            }

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Registration failed');
            }

            toast.success('Cuenta creada exitosamente');

            // Redirect to shop page of the distributor, or login if no distributor
            if (distributorSlug) {
                router.push(`/shop/${distributorSlug}`);
            } else {
                router.push('/login');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
            <Card className="w-full max-w-lg shadow-lg">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <User className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Crear tu Cuenta</CardTitle>
                    <CardDescription>
                        {distributorSlug
                            ? 'Regístrate para hacer pedidos con este distribuidor'
                            : 'Crea tu cuenta para comenzar a usar LogiMap'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Full Name */}
                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Nombre Completo
                            </Label>
                            <Input
                                id="fullName"
                                placeholder="Juan Pérez"
                                {...register('fullName')}
                                disabled={isLoading}
                            />
                            {errors.fullName && (
                                <p className="text-sm text-destructive">{errors.fullName.message}</p>
                            )}
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                Teléfono
                            </Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="3001234567"
                                {...register('phone')}
                                disabled={isLoading}
                            />
                            {errors.phone && (
                                <p className="text-sm text-destructive">{errors.phone.message}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                Correo Electrónico
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="juan@ejemplo.com"
                                {...register('email')}
                                disabled={isLoading}
                            />
                            {errors.email && (
                                <p className="text-sm text-destructive">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="flex items-center gap-2">
                                <Lock className="h-4 w-4" />
                                Contraseña
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                {...register('password')}
                                disabled={isLoading}
                            />
                            {errors.password && (
                                <p className="text-sm text-destructive">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creando cuenta...
                                </>
                            ) : (
                                'Crear Cuenta'
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2 text-center text-sm text-muted-foreground">
                    <p>
                        Al crear una cuenta, aceptas nuestros{' '}
                        <a href="/terms" className="text-primary hover:underline">
                            Términos de Servicio
                        </a>{' '}
                        y{' '}
                        <a href="/privacy" className="text-primary hover:underline">
                            Política de Privacidad
                        </a>
                    </p>
                    <p>
                        ¿Ya tienes una cuenta?{' '}
                        <a href="/login" className="text-primary hover:underline font-medium">
                            Iniciar Sesión
                        </a>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
