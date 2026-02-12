import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, CreditCard } from 'lucide-react';
import { CustomerSummary } from '@/lib/queries/customer';

interface QuickSummaryProps {
    summary: CustomerSummary;
}

export function QuickSummary({ summary }: QuickSummaryProps) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
            pending: { label: 'Pendiente', variant: 'secondary' },
            confirmed: { label: 'Confirmado', variant: 'default' },
            delivered: { label: 'Entregado', variant: 'outline' },
            cancelled: { label: 'Cancelado', variant: 'destructive' },
        };

        const config = statusMap[status] || { label: status, variant: 'outline' };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Last Order */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Package className="w-5 h-5 text-blue-600" />
                        Último Pedido
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {summary.lastOrder ? (
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">Estado:</span>
                                {getStatusBadge(summary.lastOrder.status)}
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">Total:</span>
                                <span className="font-semibold text-gray-900">{formatPrice(summary.lastOrder.total_amount)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">Fecha:</span>
                                <span className="text-sm text-gray-700">
                                    {summary.lastOrder.created_at ? new Date(summary.lastOrder.created_at).toLocaleDateString('es-CO') : 'N/A'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="py-2 text-center">
                            <p className="text-sm text-gray-500 mb-2">No tienes pedidos aún</p>
                            <p className="text-xs text-gray-400">¡Explora productos para realizar tu primera compra!</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Total Debt */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <CreditCard className="w-5 h-5 text-green-600" />
                        Saldo Pendiente
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Total:</span>
                            <span className={`font-bold text-2xl ${summary.totalDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatPrice(summary.totalDebt)}
                            </span>
                        </div>
                        {summary.totalDebt > 0 && (
                            <p className="text-xs text-gray-500 mt-2">
                                Tienes pedidos pendientes de pago
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
