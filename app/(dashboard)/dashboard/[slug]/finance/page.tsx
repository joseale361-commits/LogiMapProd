import { getDistributorBySlug } from '@/lib/supabase/server';
import { FinanceClient } from './FinanceClient';

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

/**
 * Finance and Portfolio page showing accounts receivable and payment management.
 * 
 * Features:
 * - Summary cards: Total CxC, Recaudo Hoy
 * - Debtors table with payment history
 * - Payment registration form
 */
export default async function FinancePage({ params }: PageProps) {
    const { slug } = await params;

    // Guard clause: Get distributor
    const distributor = await getDistributorBySlug(slug);
    if (!distributor) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-gray-500">Distribuidora no encontrada</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">
                    Finanzas y Cartera
                </h1>
                <p className="text-gray-600 mt-2">
                    Gestión de cuentas por cobrar y pagos
                </p>
            </div>

            {/* Finance Client Component */}
            <FinanceClient distributorId={distributor.id} distributorSlug={slug} />
        </div>
    );
}
