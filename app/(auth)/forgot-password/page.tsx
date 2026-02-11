'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
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
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(false);

        try {
            console.log('=== FORGOT PASSWORD START ===');
            console.log('Submitting password reset request for email:', email);

            const supabase = createClient();

            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (resetError) {
                console.error('Password reset error:', resetError);
                throw new Error(resetError.message || 'Ocurrió un error inesperado. Por favor, intenta nuevamente.');
            }

            console.log('Password reset email sent successfully');
            setSuccess(true);
            console.log('=== FORGOT PASSWORD END ===');
        } catch (err) {
            console.error('Forgot password error:', err);
            setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado. Por favor, intenta nuevamente.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
                <Card className="w-full max-w-md shadow-lg">
                    <CardHeader className="space-y-1 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold">Correo Enviado</CardTitle>
                        <CardDescription>
                            Hemos enviado un enlace de recuperación a tu correo electrónico.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-sm text-muted-foreground">
                            Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
                        </p>
                    </CardContent>
                    <CardFooter className="justify-center">
                        <Button variant="outline" onClick={() => router.push('/login')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver al inicio de sesión
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <Lock className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Recuperar Contraseña</CardTitle>
                    <CardDescription>
                        Ingresa tu correo electrónico para recibir un enlace de recuperación
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                Correo Electrónico
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="tu@empresa.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-start gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                    Enviando...
                                </>
                            ) : (
                                'Enviar Link de Recuperación'
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center text-sm text-muted-foreground">
                    <a href="/login" className="flex items-center text-primary hover:underline font-medium">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver al inicio de sesión
                    </a>
                </CardFooter>
            </Card>
        </div>
    );
}
