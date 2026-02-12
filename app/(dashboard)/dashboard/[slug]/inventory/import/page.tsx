import InventoryImportClient from './InventoryImportClient';

interface PageProps {
    params: {
        slug: string;
    };
}

export default async function InventoryImportPage({ params }: PageProps) {
    const { slug } = params;

    return <InventoryImportClient slug={slug} />;
}
