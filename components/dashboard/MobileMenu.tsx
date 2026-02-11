'use client';

import { useState } from 'react';
import { Home, Package, Route, Users, Settings, X, FolderTree, ShoppingBag, ExternalLink, LogOut, DollarSign, Users2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { signOutAction } from '@/lib/actions/auth';

interface MobileMenuProps {
    distributorName: string;
    userEmail: string;
    slug: string;
    userRole?: string;
}

export function MobileMenu({ distributorName, userEmail, slug, userRole }: MobileMenuProps) {
    const [isOpen, setIsOpen] = useState(false);

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
        <>
            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
                <div className="flex items-center justify-between p-4">
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">{distributorName}</h1>
                        <p className="text-xs text-gray-500">Dashboard</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </Button>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isOpen && (
                <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setIsOpen(false)}>
                    <div className="fixed left-0 top-0 bottom-0 w-64 h-screen bg-white flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                            <h1 className="text-lg font-bold text-gray-900">{distributorName}</h1>
                            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                                <X className="w-6 h-6" />
                            </Button>
                        </div>

                        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            ))}

                            {/* Ver mi Tienda Online Button - Mobile */}
                            <Link
                                href={`/shop/${slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-4 py-3 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors mt-4"
                            >
                                <ExternalLink className="w-5 h-5" />
                                <span className="font-medium">Ver mi Tienda Online</span>
                            </Link>

                            {/* Modo Conductor Button - Mobile */}
                            <Link
                                href="/delivery/routes"
                                onClick={() => setIsOpen(false)}
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
                                        {userEmail?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {userEmail}
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
                    </div>
                </div>
            )}
        </>
    );
}
