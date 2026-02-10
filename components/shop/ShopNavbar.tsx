"use client"

import { Search, User, Menu, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CartSheet } from './CartSheet';
import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

interface ShopNavbarProps {
    distributorName: string;
    distributorLogo: string | null;
    distributorSlug: string;
}

export function ShopNavbar({ distributorName, distributorLogo, distributorSlug }: ShopNavbarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const supabase = createClient();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [isRedirecting, setIsRedirecting] = useState(false);

    // Sync state with URL when it changes
    useEffect(() => {
        setSearchQuery(searchParams.get('q') || '');
    }, [searchParams]);

    const handleSearch = (value: string) => {
        setSearchQuery(value);
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set('q', value);
        } else {
            params.delete('q');
        }

        // Use replace to avoid polluting history on every keystroke
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Just for mobile close or final focus
        setIsMobileMenuOpen(false);
    };

    const handleProfileClick = async () => {
        setIsRedirecting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                router.push('/login');
                return;
            }

            // 1. Get distributor ID first
            const { data: distributor } = await supabase
                .from('distributors')
                .select('id')
                .eq('slug', distributorSlug)
                .single();

            if (!distributor) {
                router.push('/login');
                return;
            }

            // 2. Check user role for this distributor
            const { data: userDistributor } = await supabase
                .from('distributor_users')
                .select('role')
                .eq('user_id', session.user.id)
                .eq('distributor_id', distributor.id)
                .single();

            // Redirect based on role
            if (userDistributor?.role === 'admin') {
                router.push(`/dashboard/${distributorSlug}`);
            } else {
                // For customers, redirect to customer profile
                router.push('/shop/profile');
            }
        } catch (error) {
            console.error('Error in profile redirection:', error);
            router.push('/login');
        } finally {
            setIsRedirecting(false);
        }
    };

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
            {/* Desktop Navbar */}
            <nav className="hidden md:flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    {distributorLogo ? (
                        <Image
                            src={distributorLogo}
                            alt={distributorName}
                            width={44}
                            height={44}
                            className="rounded-lg object-cover"
                        />
                    ) : (
                        <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">
                                {distributorName.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                    <div>
                        <h1 className="font-bold text-gray-900 text-lg leading-tight">{distributorName}</h1>
                        <p className="text-xs text-gray-500">Tienda B2B</p>
                    </div>
                </div>

                {/* Search */}
                <form onSubmit={handleSubmit} className="flex-1 max-w-lg mx-12">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            type="search"
                            placeholder="Buscar productos por nombre o SKU..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-12 h-11 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors text-base"
                        />
                    </div>
                </form>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    <CartSheet distributorSlug={distributorSlug} />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="w-11 h-11"
                        onClick={handleProfileClick}
                        disabled={isRedirecting}
                    >
                        {isRedirecting ? (
                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        ) : (
                            <User className="w-6 h-6 text-gray-700" />
                        )}
                    </Button>
                </div>
            </nav>

            {/* Mobile Navbar */}
            <nav className="md:hidden">
                {/* Top Bar */}
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                        {distributorLogo ? (
                            <Image
                                src={distributorLogo}
                                alt={distributorName}
                                width={36}
                                height={36}
                                className="rounded-lg object-cover"
                            />
                        ) : (
                            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-base">
                                    {distributorName.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                        <div>
                            <h1 className="font-bold text-gray-900 text-sm leading-tight">{distributorName}</h1>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Tienda B2B</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <CartSheet distributorSlug={distributorSlug} />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-10 h-10"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </Button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="border-t border-gray-200 bg-gray-50 px-4 py-6 space-y-6 animate-in slide-in-from-top duration-300">
                        {/* Search */}
                        <form onSubmit={handleSubmit}>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <Input
                                    type="search"
                                    placeholder="Buscar productos..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="pl-12 h-12 bg-white border-gray-200 text-base"
                                />
                            </div>
                        </form>

                        {/* Profile Button */}
                        <Button
                            variant="outline"
                            className="w-full h-12 justify-start gap-3 bg-white border-gray-200 shadow-sm"
                            onClick={handleProfileClick}
                            disabled={isRedirecting}
                        >
                            {isRedirecting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <User className="w-5 h-5" />
                            )}
                            <span className="font-medium text-gray-700">Mi Perfil / Dashboard</span>
                        </Button>
                    </div>
                )}
            </nav>
        </header>
    );
}
