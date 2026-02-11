import { redirect, notFound } from 'next/navigation';
import { Home, Package, Route, Users, Settings, FolderTree, ShoppingBag, ExternalLink, LogOut, DollarSign, Users2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  getCurrentUser,
  getDistributorBySlug,
  hasDistributorAccess,
  getUserRoleForDistributor
} from '@/lib/supabase/server';
import { MobileMenu } from '@/components/dashboard/MobileMenu';
import { signOutAction } from '@/lib/actions/auth';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{
    slug: string;
  }>;
}

/**
 * Dashboard layout with authentication and authorization checks.
 */
export default async function DashboardLayout({ children, params }: LayoutProps) {
  const { slug } = await params;

  // Guard clause: Verify authentication
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // Guard clause: Get distributor
  const distributor = await getDistributorBySlug(slug);
  if (!distributor) {
    notFound();
  }

  // Guard clause: Verify authorization
  const hasAccess = await hasDistributorAccess(user.id, distributor.id);
  if (!hasAccess) {
    redirect('/unauthorized');
  }

  // Guard clause: Check user role - block drivers from admin dashboard
  const userRole = await getUserRoleForDistributor(user.id, distributor.id);
  if (userRole === 'driver') {
    console.log('[Dashboard] Driver attempted to access admin dashboard, redirecting to delivery routes');
    redirect('/delivery/routes');
  }

  const menuItems = [
    { icon: Home, label: 'Dashboard', href: `/dashboard/${slug}` },
    ...(userRole === 'admin' ? [{ icon: Users2, label: 'Clientes CRM', href: `/dashboard/${slug}/customers` }] : []),
    { icon: Package, label: 'Productos', href: `/dashboard/${slug}/products` },
    { icon: FolderTree, label: 'Categorías', href: `/dashboard/${slug}/categories` },
    { icon: ShoppingBag, label: 'Pedidos', href: `/dashboard/${slug}/orders` },
    ...(userRole === 'admin' ? [{ icon: DollarSign, label: 'Finanzas', href: `/dashboard/${slug}/finance` }] : []),
    { icon: Route, label: 'Rutas', href: `/dashboard/${slug}/routes` },
    ...(userRole === 'admin' ? [
      { icon: Users, label: 'Equipo', href: `/dashboard/${slug}/team` },
      { icon: Settings, label: 'Configuración', href: `/dashboard/${slug}/settings` },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 h-screen bg-white border-r border-gray-200 flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">{distributor.name}</h1>
          <p className="text-sm text-gray-500 mt-1">Dashboard</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}

          {/* Ver mi Tienda Online Button */}
          <Link
            href={`/shop/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors mt-4"
          >
            <ExternalLink className="w-5 h-5" />
            <span className="font-medium">Ver mi Tienda Online</span>
          </Link>

          {/* Modo Conductor Button */}
          <Link
            href="/delivery/routes"
            className="flex items-center gap-3 px-4 py-3 text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
            <span className="font-medium">📱 Modo Conductor</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.email}
              </p>
              <p className="text-xs text-gray-500">Miembro</p>
            </div>
          </div>

          <form action={signOutAction}>
            <Button type="submit" variant="outline" className="w-full">
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </form>
        </div>
      </aside>

      {/* Mobile Menu */}
      <MobileMenu
        distributorName={distributor.name}
        userEmail={user.email || ''}
        slug={slug}
        userRole={userRole}
      />

      {/* Main Content */}
      <main className="md:ml-64 pt-16 md:pt-0">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
