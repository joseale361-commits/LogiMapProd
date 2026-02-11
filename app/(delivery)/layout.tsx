"use client";

import { ReactNode, useEffect, useState } from 'react';
import { Phone, Home, Map, LogOut, ArrowLeft, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOutAction } from '@/lib/actions/auth';
import { createClient } from '@/lib/supabase/client';

interface UserInfo {
    role: string;
    distributorSlug: string;
    distributorName: string;
}

export default function DeliveryLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

    useEffect(() => {
        const getUserInfo = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) return;

            // Get user's distributor info from distributor_users
            const { data: distributorUser } = await supabase
                .from('distributor_users')
                .select(`
                    role,
                    distributors!inner (
                        slug,
                        name
                    )
                `)
                .eq('user_id', user.id)
                .eq('is_active', true)
                .single();

            if (distributorUser?.distributors) {
                setUserInfo({
                    role: distributorUser.role,
                    distributorSlug: (distributorUser.distributors as any).slug,
                    distributorName: (distributorUser.distributors as any).name
                });
            }
        };

        getUserInfo();
    }, []);

    const isStaff = userInfo?.role === 'admin' || userInfo?.role === 'staff' || userInfo?.role === 'owner';

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header - LogiMap Brand */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
                <div className="px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {/* Dashboard Back Button (for staff) */}
                            {isStaff && userInfo?.distributorSlug && (
                                <Link
                                    href={`/dashboard/${userInfo.distributorSlug}`}
                                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium text-sm transition-colors border border-gray-200"
                                    title="Volver al Dashboard"
                                >
                                    <LayoutDashboard className="h-4 w-4" />
                                    <span className="hidden sm:inline">Dashboard</span>
                                </Link>
                            )}
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                                LogiMap <span className="text-blue-600">Reparto</span>
                            </h1>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Logout Button */}
                            <form action={signOutAction}>
                                <button
                                    type="submit"
                                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium text-sm transition-colors border border-gray-200"
                                    title="Cerrar Sesión"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span className="hidden sm:inline">Salir</span>
                                </button>
                            </form>
                            {/* Panic Button */}
                            <a
                                href="tel:+1234567890"
                                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm"
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
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
                <div className="flex items-center justify-around py-3">
                    <Link
                        href="/delivery/routes"
                        className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${pathname === '/delivery/routes' || pathname?.startsWith('/delivery/routes/')
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <Map className="h-6 w-6" />
                        <span className="text-xs font-medium">Rutas</span>
                    </Link>
                    <Link
                        href="/delivery"
                        className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${pathname === '/delivery'
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
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
