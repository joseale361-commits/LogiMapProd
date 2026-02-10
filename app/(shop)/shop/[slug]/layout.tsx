import { notFound } from 'next/navigation';
import { CartProvider } from '@/lib/contexts/CartContext';
import { ShopNavbar } from '@/components/shop/ShopNavbar';
import { getDistributorBySlug } from '@/lib/queries/shop';

interface LayoutProps {
    children: React.ReactNode;
    params: Promise<{
        slug: string;
    }>;
}

/**
 * Shop layout with navbar and cart context.
 * Fetches distributor by slug and provides cart state management.
 */
export default async function ShopLayout({ children, params }: LayoutProps) {
    const { slug } = await params;

    // Get distributor by slug
    const distributor = await getDistributorBySlug(slug);

    // Return 404 if distributor not found
    if (!distributor) {
        notFound();
    }

    return (
        <CartProvider>
            <div className="min-h-screen bg-gray-50">
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
