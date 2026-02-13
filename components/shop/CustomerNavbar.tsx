"use client"

import { useState } from 'react';
import { User, LogOut, Menu, X, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { signOutAction } from '@/lib/actions/auth';

export function CustomerNavbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                <Link href="/shop" className="group">
                    <h1 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Mi Portal B2B</h1>
                    <p className="text-sm text-gray-500">Gestiona tus proveedores y pedidos</p>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-3">
                    <Button asChild variant="outline" className="flex items-center gap-2 border-gray-200 hover:bg-gray-50">
                        <Link href="/shop/orders">
                            <Package className="w-4 h-4" />
                            Mis Pedidos
                        </Link>
                    </Button>

                    <Button asChild variant="outline" className="flex items-center gap-2 border-gray-200 hover:bg-gray-50">
                        <Link href="/shop/profile">
                            <User className="w-4 h-4" />
                            Mi Perfil
                        </Link>
                    </Button>

                    <form action={signOutAction}>
                        <Button variant="ghost" className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50">
                            <LogOut className="w-4 h-4" />
                            Cerrar Sesión
                        </Button>
                    </form>
                </div>

                {/* Mobile Menu Button */}
                <div className="md:hidden">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </Button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden border-t border-gray-200 bg-gray-50 px-6 py-4 space-y-4 animate-in slide-in-from-top duration-200">
                    <Button asChild variant="outline" className="w-full justify-start gap-3 bg-white">
                        <Link href="/shop/orders">
                            <Package className="w-4 h-4" />
                            Mis Pedidos
                        </Link>
                    </Button>

                    <Button asChild variant="outline" className="w-full justify-start gap-3 bg-white">
                        <Link href="/shop/profile">
                            <User className="w-4 h-4" />
                            Mi Perfil
                        </Link>
                    </Button>

                    <form action={signOutAction} className="w-full">
                        <Button variant="ghost" className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50">
                            <LogOut className="w-4 h-4" />
                            Cerrar Sesión
                        </Button>
                    </form>
                </div>
            )}
        </header>
    );
}
