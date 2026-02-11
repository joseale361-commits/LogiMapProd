'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
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

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      console.log('=== FRONTEND LOGIN START ===');
      console.log('Submitting login request for email:', email);

      // Call the login API endpoint
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        console.error('Login failed:', data.error);
        throw new Error(data.error || 'Ocurrió un error inesperado. Por favor, intenta nuevamente.');
      }

      console.log('Login successful, redirecting based on role...');
      console.log('Distributor slug:', data.data.distributorSlug);
      console.log('User role:', data.data.role);

      // Cookies are set by the API, no need to call setSession
      // The middleware will handle session refresh on the next request

      // Redirect based on role
      const { distributorSlug, role } = data.data;

      // Handle redirect logic - Staff/Admin go to Dashboard, Customers go to Shop
      let redirectPath: string;

      if (distributorSlug) {
        // User is Staff or Admin - redirect to their dashboard
        redirectPath = `/dashboard/${distributorSlug}`;
      } else {
        // User is a Customer - redirect to shop
        redirectPath = '/shop';
      }

      console.log('Redirecting to:', redirectPath);
      router.push(redirectPath);
      console.log('=== FRONTEND LOGIN END ===');
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado. Por favor, intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <LogIn className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
          <CardDescription>
            Ingresa tus credenciales para acceder a tu dashboard
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                  Iniciando sesión...
                </>
              ) : (
                'Ingresar'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center text-sm text-muted-foreground">
          <p>
            <a href="/forgot-password" className="text-primary hover:underline font-medium">
              Recuperar contraseña
            </a>
          </p>
          <p>
            ¿No tienes una cuenta?{' '}
            <a href="/register/distributor" className="text-primary hover:underline font-medium">
              Regístrate como distribuidor
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
