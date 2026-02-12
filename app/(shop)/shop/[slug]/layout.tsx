import { notFound } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Eye, ArrowRight } from 'lucide-react';
import { CartProvider } from '@/lib/contexts/CartContext';
import { ShopNavbar } from '@/components/shop/ShopNavbar';
import { getDistributorBySlug } from '@/lib/queries/shop';
import { createClient } from '@/lib/supabase/server';
import { Suspense } from 'react';

interface LayoutProps {
    children: React.ReactNode;
    params: {
        slug: string;
    };
}

/**
 * Staff banner component for admin/staff users
 * Shows "Modo Vendedor / Vista Cliente" and link to Dashboard
 */
function StaffBanner({ distributorSlug }: { distributorSlug: string }) {
    return (
        <div className="bg-gray-900 text-white border-b border-gray-800">
            <div className="max-w-7xl mx-auto px-4 py-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                        <LayoutDashboard className="h-4 w-4 text-yellow-400" />
                        <span className="font-medium">Modo Vendedor / Vista Cliente</span>
                    </div>
                    <Link
                        href={`/dashboard/${distributorSlug}`}
                        className="flex items-center gap-1 text-xs bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-3 py-1.5 rounded-full font-bold transition-colors"
                    >
                        <ArrowRight className="h-3 w-3" />
                        Ir al Admin
                    </Link>
                </div>
            </div>
        </div>
    );
}

/**
 * Server component to check user role
 */
async function StaffBannerWrapper({ distributorSlug }: { distributorSlug: string }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    // Get distributor to check if user has access
    const { data: distributor } = await supabase
        .from('distributors')
        .select('id')
        .eq('slug', distributorSlug)
        .single();

    if (!distributor) {
        return null;
    }

    // Check user role
    const { data: distributorUser } = await supabase
        .from('distributor_users')
        .select('role')
        .eq('user_id', user.id)
        .eq('distributor_id', distributor.id)
        .eq('is_active', true)
        .single();

    const role = distributorUser?.role;
    const isStaff = role === 'admin' || role === 'staff' || role === 'owner';

    if (!isStaff) {
        return null;
    }

    return <StaffBanner distributorSlug={distributorSlug} />;
}

/**
 * Shop layout with navbar and cart context.
 * Fetches distributor by slug and provides cart state management.
 */
export default async function ShopLayout({ children, params }: LayoutProps) {
    const { slug } = params;

    // Get distributor by slug
    const distributor = await getDistributorBySlug(slug);

    // Return 404 if distributor not found
    if (!distributor) {
        notFound();
    }

    return (
        <CartProvider>
            <div className="min-h-screen bg-gray-50">
                {/* Staff/Admin Banner */}
                <Suspense fallback={null}>
                    <StaffBannerWrapper distributorSlug={slug} />
                </Suspense>

                <ShopNavbar
                    distributorName={distributor.name}
                    distributorLogo={distributor.logo_url}
                    distributorSlug={distributor.slug}
                />
                <main className="max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8">
                    {children}
                </main>
            </div>
        </CartProvider>
    );
}
