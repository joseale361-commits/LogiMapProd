'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DollarSign, TrendingUp, Calendar, Eye, Plus } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Debtor {
    id: string;
    customer_id: string;
    customer_name: string;
    current_debt: number;
    last_payment_date: string | null;
    last_payment_amount: number | null;
    days_overdue: number;
}

interface FinanceSummary {
    total_cxc: number;
    recaudo_hoy: number;
    total_debtors: number;
}

interface PaymentHistory {
    id: string;
    amount: number;
    payment_date: string;
    payment_method: string;
    notes: string | null;
    created_at: string;
}

interface InvoiceHistory {
    id: string;
    order_number: string;
    total_amount: number;
    created_at: string;
    status: string;
}

interface FinanceClientProps {
    distributorId: string;
    distributorSlug: string;
}

export function FinanceClient({ distributorId, distributorSlug }: FinanceClientProps) {
    const [summary, setSummary] = useState<FinanceSummary | null>(null);
    const [debtors, setDebtors] = useState<Debtor[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCustomer, setSelectedCustomer] = useState<Debtor | null>(null);
    const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
    const [invoiceHistory, setInvoiceHistory] = useState<InvoiceHistory[]>([]);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [showDetailDialog, setShowDetailDialog] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentNotes, setPaymentNotes] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Fetch finance data
    useEffect(() => {
        fetchFinanceData();
    }, [distributorId]);

    const fetchFinanceData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/dashboard/${distributorSlug}/finance`);
            const data = await response.json();

            if (data.success) {
                setSummary(data.summary);
                setDebtors(data.debtors);
            }
        } catch (error) {
            console.error('Error fetching finance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomerHistory = async (customerId: string, customerName: string) => {
        try {
            const response = await fetch(`/api/dashboard/${distributorSlug}/finance/payments/${customerId}`);
            const data = await response.json();

            if (data.success) {
                setPaymentHistory(data.payments || []);
                setInvoiceHistory(data.invoices || []);
                setSelectedCustomer(debtors.find(d => d.customer_id === customerId) || null);
                setShowDetailDialog(true);
            }
        } catch (error) {
            console.error('Error fetching customer history:', error);
        }
    };

    const handleRegisterPayment = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedCustomerId || !paymentAmount) {
            alert('Por favor seleccione un cliente e ingrese el monto');
            return;
        }

        try {
            setSubmitting(true);
            const response = await fetch(`/api/dashboard/${distributorSlug}/finance/payments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_id: selectedCustomerId,
                    amount: parseFloat(paymentAmount),
                    notes: paymentNotes,
                    payment_method: 'office'
                })
            });

            const data = await response.json();

            if (data.success) {
                alert('Pago registrado exitosamente');
                setShowPaymentDialog(false);
                setPaymentAmount('');
                setPaymentNotes('');
                setSelectedCustomerId('');
                fetchFinanceData();
            } else {
                alert(data.error || 'Error al registrar el pago');
            }
        } catch (error) {
            console.error('Error registering payment:', error);
            alert('Error al registrar el pago');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-gray-500">Cargando datos financieros...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total CxC Card */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Total CxC
                        </CardTitle>
                        <DollarSign className="h-5 w-5 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900">
                            {formatCurrency(summary?.total_cxc || 0)}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Cuentas por cobrar totales
                        </p>
                    </CardContent>
                </Card>

                {/* Recaudo Hoy Card */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Recaudo Hoy
                        </CardTitle>
                        <TrendingUp className="h-5 w-5 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900">
                            {formatCurrency(summary?.recaudo_hoy || 0)}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Efectivo traído por choferes hoy
                        </p>
                    </CardContent>
                </Card>

                {/* Total Deudores Card */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Total Deudores
                        </CardTitle>
                        <Calendar className="h-5 w-5 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900">
                            {summary?.total_debtors || 0}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Clientes con deuda pendiente
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Register Payment Button */}
            <div className="flex justify-end">
                <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                    <DialogTrigger asChild>
                        <Button className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Registrar Abono
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Registrar Abono en Oficina</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleRegisterPayment} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cliente
                                </label>
                                <select
                                    value={selectedCustomerId}
                                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Seleccione un cliente</option>
                                    {debtors.map((debtor) => (
                                        <option key={debtor.customer_id} value={debtor.customer_id}>
                                            {debtor.customer_name} - {formatCurrency(debtor.current_debt)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Monto
                                </label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notas (opcional)
                                </label>
                                <Input
                                    value={paymentNotes}
                                    onChange={(e) => setPaymentNotes(e.target.value)}
                                    placeholder="Notas del pago"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowPaymentDialog(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? 'Registrando...' : 'Registrar Pago'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Debtors Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Tabla de Deudores</CardTitle>
                </CardHeader>
                <CardContent>
                    {debtors.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                            No hay deudores registrados
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                                            Nombre
                                        </th>
                                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                                            Deuda Total
                                        </th>
                                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                                            Último Pago
                                        </th>
                                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">
                                            Días de Mora
                                        </th>
                                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">
                                            Acción
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {debtors.map((debtor) => (
                                        <tr key={debtor.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4 text-sm text-gray-900">
                                                {debtor.customer_name}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-right text-gray-900">
                                                {formatCurrency(debtor.current_debt)}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-right text-gray-600">
                                                {debtor.last_payment_date
                                                    ? `${formatCurrency(debtor.last_payment_amount || 0)} - ${formatDate(debtor.last_payment_date)}`
                                                    : 'Sin pagos'
                                                }
                                            </td>
                                            <td className="py-3 px-4 text-sm text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${debtor.days_overdue === 0
                                                    ? 'bg-green-100 text-green-800'
                                                    : debtor.days_overdue <= 7
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : debtor.days_overdue <= 30
                                                            ? 'bg-orange-100 text-orange-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {debtor.days_overdue} días
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-center">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => fetchCustomerHistory(debtor.customer_id, debtor.customer_name)}
                                                    className="flex items-center gap-1"
                                                    aria-label={`Ver historial de ${debtor.customer_name}`}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    <span className="hidden sm:inline">Ver Detalle</span>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Customer Detail Dialog */}
            <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Historial de {selectedCustomer?.customer_name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                        {/* Current Debt Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Resumen Actual</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Deuda Total</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {formatCurrency(selectedCustomer?.current_debt || 0)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Días de Mora</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {selectedCustomer?.days_overdue || 0}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment History */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Historial de Pagos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {paymentHistory.length === 0 ? (
                                    <p className="text-gray-500 text-center py-4">
                                        No hay pagos registrados
                                    </p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">
                                                        Fecha
                                                    </th>
                                                    <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">
                                                        Monto
                                                    </th>
                                                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">
                                                        Método
                                                    </th>
                                                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">
                                                        Notas
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paymentHistory.map((payment) => (
                                                    <tr key={payment.id} className="border-b border-gray-100">
                                                        <td className="py-2 px-3 text-sm text-gray-900">
                                                            {formatDate(payment.payment_date)}
                                                        </td>
                                                        <td className="py-2 px-3 text-sm text-right text-green-600 font-medium">
                                                            {formatCurrency(payment.amount)}
                                                        </td>
                                                        <td className="py-2 px-3 text-sm text-gray-600">
                                                            {payment.payment_method === 'office' ? 'Oficina' : payment.payment_method}
                                                        </td>
                                                        <td className="py-2 px-3 text-sm text-gray-600">
                                                            {payment.notes || '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Invoice History */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Historial de Facturas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {invoiceHistory.length === 0 ? (
                                    <p className="text-gray-500 text-center py-4">
                                        No hay facturas registradas
                                    </p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">
                                                        Factura
                                                    </th>
                                                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">
                                                        Fecha
                                                    </th>
                                                    <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">
                                                        Total
                                                    </th>
                                                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">
                                                        Estado
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {invoiceHistory.map((invoice) => (
                                                    <tr key={invoice.id} className="border-b border-gray-100">
                                                        <td className="py-2 px-3 text-sm text-gray-900">
                                                            {invoice.order_number}
                                                        </td>
                                                        <td className="py-2 px-3 text-sm text-gray-600">
                                                            {formatDate(invoice.created_at)}
                                                        </td>
                                                        <td className="py-2 px-3 text-sm text-right text-gray-900">
                                                            {formatCurrency(invoice.total_amount)}
                                                        </td>
                                                        <td className="py-2 px-3 text-sm">
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${invoice.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                                invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                {invoice.status === 'delivered' ? 'Entregado' :
                                                                    invoice.status === 'pending' ? 'Pendiente' : invoice.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
