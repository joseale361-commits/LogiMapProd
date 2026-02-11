import { redirect, notFound } from 'next/navigation';
import { getCurrentUser, getDistributorBySlug, getUserRoleForDistributor } from '@/lib/supabase/server';

interface LayoutProps {
    children: React.ReactNode;
    params: Promise<{
        slug: string;
    }>;
}

/**
 * Layout for CRM/Customers pages with admin-only access control.
 * Only users with 'admin' role can access CRM functionality.
 */
export default async function CustomersLayout({ children, params }: LayoutProps) {
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

    // Guard clause: Check if user is admin - only admins can access CRM
    const userRole = await getUserRoleForDistributor(user.id, distributor.id);
    if (userRole !== 'admin') {
        console.log('[CRM] Non-admin user attempted to access CRM, redirecting to orders');
        redirect(`/dashboard/${slug}/orders`);
    }

    return (
        <>
            {children}
        </>
    );
}
