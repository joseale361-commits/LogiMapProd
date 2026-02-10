"use client"

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Package, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface SuccessPageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default function OrderSuccessPage({ params }: SuccessPageProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [slug, setSlug] = useState<string>('');
    const [orderId, setOrderId] = useState<string>('');

    useEffect(() => {
        params.then(({ slug }) => {
            setSlug(slug);
        });
        const orderIdParam = searchParams.get('orderId');
        if (orderIdParam) {
            setOrderId(orderIdParam);
        }
    }, [params, searchParams]);

    const handleContinueShopping = () => {
        router.push(`/shop/${slug}`);
    };

    const handleGoHome = () => {
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
            <Card className="max-w-lg w-full">
                <CardContent className="pt-12 pb-8 text-center">
                    {/* Success Icon */}
                    <div className="mb-6">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>
                    </div>

                    {/* Success Message */}
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        ¡Pedido Exitoso!
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Tu pedido ha sido enviado y está pendiente de aprobación por el distribuidor.
                    </p>

                    {/* Order Info */}
                    {orderId && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <p className="text-sm text-gray-500 mb-1">Número de Pedido</p>
                            <p className="text-lg font-semibold text-gray-900">{orderId}</p>
                        </div>
                    )}

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-left">
                        <div className="flex items-start gap-3">
                            <Package className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-medium text-blue-900 mb-1">
                                    ¿Qué sigue?
                                </p>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>• El distribuidor revisará tu pedido</li>
                                    <li>• Recibirás una notificación cuando sea aprobado</li>
                                    <li>• Podrás hacer seguimiento desde tu perfil</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <Button
                            onClick={handleContinueShopping}
                            className="w-full"
                            size="lg"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Continuar Comprando
                        </Button>
                        <Button
                            onClick={handleGoHome}
                            variant="outline"
                            className="w-full"
                            size="lg"
                        >
                            <Home className="w-4 h-4 mr-2" />
                            Ir al Inicio
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
