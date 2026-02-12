import { createSupabaseServerClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { CategoryListClient } from '@/components/categories/CategoryListClient';
import { adminClient } from '@/lib/supabase/admin';

interface PageProps {
    params: {
        slug: string;
    };
}

export default async function CategoriesPage({ params }: PageProps) {
    const { slug } = params;
    const supabase = await createSupabaseServerClient();

    // Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // Get Distributor
    const { data: distributor } = await adminClient
        .from('distributors')
        .select('id')
        .eq('slug', slug)
        .single();

    if (!distributor) notFound();

    // Fetch Categories
    const { data: categories } = await adminClient
        .from('categories')
        .select('*')
        .eq('distributor_id', distributor.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

    return (
        <div className="p-6">
            <CategoryListClient
                categories={categories || []}
                distributorId={distributor.id}
                slug={slug}
            />
        </div>
    );
}
