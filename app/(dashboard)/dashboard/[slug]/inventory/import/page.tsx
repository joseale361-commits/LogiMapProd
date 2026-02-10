import InventoryImportClient from './InventoryImportClient';

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function InventoryImportPage({ params }: PageProps) {
    const { slug } = await params;

    return <InventoryImportClient slug={slug} />;
}
