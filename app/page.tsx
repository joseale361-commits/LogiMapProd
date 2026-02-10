import { redirect } from 'next/navigation';
import { getUserRoleAndDistributor } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Truck, Package, Users, BarChart3, ArrowRight, CheckCircle } from 'lucide-react';

export default async function Home() {
  // Check if user is logged in and get their role
  const userRoleData = await getUserRoleAndDistributor();

  // If user is logged in, redirect based on role
  if (userRoleData) {
    const { role, distributor } = userRoleData;

    // Admin role -> redirect to dashboard
    if (role === 'admin') {
      redirect(`/dashboard/${distributor.slug}`);
    }

    // Driver role -> redirect to delivery routes
    if (role === 'driver') {
      redirect('/delivery/routes');
    }

    // Customer role -> redirect to shop
    if (role === 'customer') {
      redirect('/shop');
    }

    // Default fallback for other roles
    redirect(`/dashboard/${distributor.slug}`);
  }

  // User is not logged in - show landing page
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-5xl mx-auto text-center">
          {/* Logo/Brand */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
              <Truck className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              LogiMap
            </h1>
          </div>

          {/* Main Headline */}
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Tu plataforma de logística B2B
          </h2>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Gestiona tu distribuidora, optimiza rutas de entrega y conecta con tus clientes
            en una sola plataforma potente y fácil de usar.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button asChild size="lg" className="w-full sm:w-auto px-8 py-6 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all">
              <Link href="/login">
                Iniciar Sesión
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto px-8 py-6 text-lg font-semibold border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all">
              <Link href="/register/distributor">
                Registrar mi Distribuidora
              </Link>
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 dark:border-slate-700">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-6 mx-auto">
                <Package className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Gestión de Productos
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Administra tu catálogo de productos, categorías y variantes con una interfaz intuitiva.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 dark:border-slate-700">
              <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-6 mx-auto">
                <BarChart3 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Optimización de Rutas
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Planifica y optimiza rutas de entrega para maximizar eficiencia y reducir tiempos.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 dark:border-slate-700">
              <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-6 mx-auto">
                <Users className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Gestión de Equipo
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Administra choferes, asigna rutas y monitorea el desempeño de tu equipo.
              </p>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="mt-20 bg-white dark:bg-slate-800 rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 dark:border-slate-700">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-8">
              ¿Por qué elegir LogiMap?
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mt-1">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Fácil de usar
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Interfaz intuitiva diseñada para distribuidoras de todos los tamaños.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mt-1">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Tienda Online Integrada
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Tu catálogo disponible para clientes con pedidos en línea.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mt-1">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Seguro y Confiable
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Tus datos protegidos con la más alta seguridad y respaldos automáticos.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mt-1">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Soporte 24/7
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Equipo de soporte disponible para ayudarte cuando lo necesites.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Final CTA */}
          <div className="mt-16 text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">
              ¿Listo para transformar tu logística?
            </p>
            <Button asChild size="lg" className="px-10 py-6 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all">
              <Link href="/register/distributor">
                Comenzar Gratis
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-slate-800 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600 dark:text-gray-400 text-sm">
          <p>© 2024 LogiMap. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
