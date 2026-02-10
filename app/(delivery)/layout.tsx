"use client";

import { ReactNode } from 'react';
import { Phone, Home, Map, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOutAction } from '@/lib/actions/auth';

export default function DeliveryLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col">
            {/* Dark Header - MODO REPARTO */}
            <header className="bg-gray-950 border-b border-gray-800 sticky top-0 z-50">
                <div className="px-4 py-5">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-black text-white tracking-wider">
                            MODO REPARTO
                        </h1>
                        <div className="flex items-center gap-2">
                            {/* Logout Button */}
                            <form action={signOutAction}>
                                <button
                                    type="submit"
                                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg font-bold text-sm transition-colors border border-gray-700"
                                    title="Cerrar Sesión"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span className="hidden sm:inline">Salir</span>
                                </button>
                            </form>
                            {/* Panic Button */}
                            <a
                                href="tel:+1234567890"
                                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-red-600/30"
                            >
                                <Phone className="h-4 w-4" />
                                <span className="hidden sm:inline">LLAMAR A BASE</span>
                                <span className="sm:hidden">BASE</span>
                            </a>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 pb-20">
                {children}
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800 z-50">
                <div className="flex items-center justify-around py-3">
                    <Link
                        href="/delivery/routes"
                        className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${pathname === '/delivery/routes' || pathname?.startsWith('/delivery/routes/')
                            ? 'text-blue-400 bg-gray-800'
                            : 'text-gray-400 hover:text-gray-200'
                            }`}
                    >
                        <Map className="h-6 w-6" />
                        <span className="text-xs font-medium">Rutas</span>
                    </Link>
                    <Link
                        href="/delivery"
                        className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${pathname === '/delivery'
                            ? 'text-blue-400 bg-gray-800'
                            : 'text-gray-400 hover:text-gray-200'
                            }`}
                    >
                        <Home className="h-6 w-6" />
                        <span className="text-xs font-medium">Inicio</span>
                    </Link>
                </div>
            </nav>
        </div>
    );
}
