"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, MapPin, CreditCard, Truck, ShoppingBag, Plus, User, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Store } from 'lucide-react';
import { useCart, CartItem } from '@/lib/contexts/CartContext';
import { createOrderAction } from './actions';
import { Database } from '@/types/supabase';
import { getCreditInfoAction } from '@/lib/actions/checkout';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { saveAddressAction } from '@/lib/actions/address';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import type { AddressFormData } from '@/components/shop/AddressModal';
import { getStateName, getCountryName } from '@/lib/utils/location';
import { haversineDistance, parsePostGISPoint } from '@/lib/utils/location';
import { CustomerSelector } from '@/components/shop/CustomerSelector';
import { CustomerOption, getUserRoleAction } from '@/lib/actions/pos';

// Dynamically import AddressModal to avoid SSR issues with Leaflet
const AddressModal = dynamic(
    () => import('@/components/shop/AddressModal').then((mod) => mod.AddressModal),
    { ssr: false }
);

type Address = Database['public']['Tables']['addresses']['Row'];

interface CheckoutPageProps { }

interface DeliverySettings {
    free_radius_km: number;
    max_radius_km: number;
    delivery_fee: number;
    min_order_amount: number;
}

export default function CheckoutPage() {
    const router = useRouter();
    const params = useParams();
    const { items, clearCart } = useCart();
    const slug = params?.slug as string;
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'credit'>('cash');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [distributorId, setDistributorId] = useState<string>('');
    const [creditInfo, setCreditInfo] = useState<{
        hasCredit: boolean;
        creditLimit: number;
        currentDebt: number;
        availableCredit: number;
    }>({ hasCredit: false, creditLimit: 0, currentDebt: 0, availableCredit: 0 });

    // POS Mode State
    const [userRole, setUserRole] = useState<'admin' | 'staff' | 'client' | null>(null);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);

    // Delivery Settings & Distance Calculation
    const [deliverySettings, setDeliverySettings] = useState<DeliverySettings | null>(null);
    const [warehouseLocation, setWarehouseLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [distanceKm, setDistanceKm] = useState<number | null>(null);
    const [deliveryFee, setDeliveryFee] = useState<number>(0);
    const [deliveryStatus, setDeliveryStatus] = useState<'valid' | 'too_far' | 'min_order' | null>(null);

    // New State for Evolution
    const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
    const [pickupTime, setPickupTime] = useState<string>('');
    const [wantsInitialPayment, setWantsInitialPayment] = useState(false);
    const [initialPayment, setInitialPayment] = useState<string>(''); // String for input handling

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalAmount = subtotal + (deliveryType === 'delivery' ? deliveryFee : 0);

    // Format price as Colombian Peso
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    // Load addresses for POS mode
    const loadAddressesForPOS = useCallback(async (distId: string) => {
        setAddresses([]);
        setSelectedAddressId('');
        setDistanceKm(null);
        setDeliveryFee(0);
        setDeliveryStatus(null);
    }, []);

    // Load credit info
    const loadCreditInfo = useCallback(async (customerId: string, distId: string) => {
        const credit = await getCreditInfoAction(distId);
        setCreditInfo(credit);
    }, []);

    // Handle customer change
    const handleCustomerChange = useCallback(async (customerId: string | null, customer: CustomerOption | null) => {
        setSelectedCustomerId(customerId);
        setSelectedCustomer(customer);

        if (customerId && customer && distributorId) {
            // Load addresses for the selected customer
            await loadAddresses(customerId);

            // Update credit info for the selected customer
            setCreditInfo({
                hasCredit: customer.credit_limit > 0,
                creditLimit: customer.credit_limit,
                currentDebt: customer.current_debt,
                availableCredit: Math.max(0, customer.credit_limit - customer.current_debt)
            });
        } else {
            setAddresses([]);
            setSelectedAddressId('');
            setDistanceKm(null);
            setDeliveryFee(0);
            setDeliveryStatus(null);
            setCreditInfo({ hasCredit: false, creditLimit: 0, currentDebt: 0, availableCredit: 0 });
        }
    }, [distributorId]);

    // Load addresses
    const loadAddresses = useCallback(async (customerId?: string) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.push('/login');
            return;
        }

        // For POS mode, use the selected customer ID; otherwise use the logged-in user
        const targetUserId = customerId || user.id;

        const { data, error } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', targetUserId)
            .eq('is_active', true);

        if (error) {
            console.error('Error loading addresses:', error);
        } else {
            const typedData = (data as Address[]) || [];
            setAddresses(typedData);
            if (typedData.length > 0) {
                const defaultAddress = typedData.find(a => a.is_default) || typedData[0];
                setSelectedAddressId(defaultAddress.id);
            } else {
                setDistanceKm(null);
                setDeliveryFee(0);
                setDeliveryStatus(null);
            }
        }
    }, [router]);

    // Create address
    const handleCreateAddress = async (addressData: AddressFormData) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const result = await saveAddressAction(addressData);

            if (result.success) {
                toast.success('Dirección creada exitosamente');
                setIsAddressModalOpen(false);
                await loadAddresses(); // Reload addresses to refresh the list and select the new one
            } else {
                setError(result.error || 'Error al crear la dirección');
            }
        } catch (err) {
            console.error('Unexpected error creating address:', err);
            setError(`Error al crear la dirección: ${err instanceof Error ? err.message : 'Error desconocido'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculate delivery fee based on distance
    const calculateDeliveryFee = useCallback((address: Address | null) => {
        if (!address || !deliverySettings || !warehouseLocation) {
            setDistanceKm(null);
            setDeliveryFee(0);
            setDeliveryStatus(null);
            return;
        }

        // Get address coordinates from location JSONB
        const locationData = address.location as { lat?: number; lng?: number; latitude?: number; longitude?: number } | null;
        const addressLat = locationData?.lat ?? locationData?.latitude ?? null;
        const addressLng = locationData?.lng ?? locationData?.longitude ?? null;

        if (addressLat === null || addressLng === null) {
            // Address doesn't have coordinates
            setDistanceKm(null);
            setDeliveryFee(0);
            setDeliveryStatus(null);
            return;
        }

        // Calculate distance using Haversine formula
        const distance = haversineDistance(
            warehouseLocation.lat,
            warehouseLocation.lng,
            addressLat,
            addressLng
        );
        setDistanceKm(distance);

        // Case A: Too far - outside maximum radius
        if (deliverySettings.max_radius_km > 0 && distance > deliverySettings.max_radius_km) {
            setDeliveryStatus('too_far');
            setDeliveryFee(0);
            return;
        }

        // Case C: Minimum order not met
        if (subtotal < deliverySettings.min_order_amount) {
            setDeliveryStatus('min_order');
            setDeliveryFee(0);
            return;
        }

        // Case B: Distance fee applies
        if (deliverySettings.free_radius_km > 0 && distance > deliverySettings.free_radius_km) {
            setDeliveryFee(deliverySettings.delivery_fee);
        } else {
            setDeliveryFee(0);
        }

        setDeliveryStatus('valid');
    }, [deliverySettings, warehouseLocation, subtotal]);

    // Effect to calculate delivery fee when address changes
    useEffect(() => {
        if (selectedAddressId && addresses.length > 0) {
            const selectedAddress = addresses.find(a => a.id === selectedAddressId);
            calculateDeliveryFee(selectedAddress || null);
        } else {
            setDistanceKm(null);
            setDeliveryFee(0);
            setDeliveryStatus(null);
        }
    }, [selectedAddressId, addresses, calculateDeliveryFee]);

    // Fetch distributor settings
    useEffect(() => {
        if (!distributorId) return;

        const fetchDistributorSettings = async () => {
            const supabase = createClient();

            const { data: distributor } = await supabase
                .from('distributors')
                .select('location, delivery_settings')
                .eq('id', distributorId)
                .single();

            if (distributor) {
                // Use type assertion since these fields exist in DB but not in TypeScript types yet
                const distData = distributor as { location?: string; delivery_settings?: any };

                // Parse warehouse location from PostGIS format
                const warehouseLoc = parsePostGISPoint(distData.location);
                if (warehouseLoc) {
                    setWarehouseLocation(warehouseLoc);
                }

                // Parse delivery settings
                if (distData.delivery_settings) {
                    const settings = typeof distData.delivery_settings === 'string'
                        ? JSON.parse(distData.delivery_settings)
                        : distData.delivery_settings as DeliverySettings;
                    setDeliverySettings(settings);
                }
            }
        };

        fetchDistributorSettings();
    }, [distributorId]);

    // Initial load
    useEffect(() => {
        async function fetchInitialData() {
            if (!slug) return;

            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data: distributor } = await supabase
                    .from('distributors')
                    .select('id')
                    .eq('slug', slug)
                    .eq('is_active', true)
                    .single();

                if (distributor) {
                    setDistributorId(distributor.id);

                    const role = await getUserRoleAction(user.id, distributor.id);
                    setUserRole(role as 'admin' | 'staff' | 'client');

                    if (role === 'admin' || role === 'staff') {
                        loadAddressesForPOS(distributor.id);
                    } else {
                        loadAddresses();
                        loadCreditInfo(user.id, distributor.id);
                    }
                }
            }
        }

        fetchInitialData();
    }, [params, loadAddresses, loadAddressesForPOS, loadCreditInfo]);

    // Handle submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation for POS mode
        if ((userRole === 'admin' || userRole === 'staff') && !selectedCustomerId) {
            setError('Por favor selecciona un cliente para crear el pedido');
            return;
        }

        // Validation based on delivery type
        if (deliveryType === 'delivery') {
            if (!selectedAddressId) {
                setError('Por favor selecciona una dirección de entrega');
                return;
            }

            // Check if delivery is available
            if (deliveryStatus === 'too_far') {
                setError('Te encuentras fuera de zona de cobertura. Solo disponible para recogida.');
                return;
            }

            if (deliveryStatus === 'min_order') {
                setError(`Mínimo ${formatPrice(deliverySettings?.min_order_amount || 0)} para domicilio`);
                return;
            }
        }

        if (deliveryType === 'pickup') {
            if (!pickupTime) {
                setError('Por favor selecciona una fecha y hora de retiro');
                return;
            }
        }

        if (items.length === 0) {
            setError('El carrito está vacío');
            return;
        }

        // Validate initial payment
        let initialPaymentValue = 0;
        if (wantsInitialPayment && paymentMethod === 'credit') {
            const parsed = parseFloat(initialPayment.replace(/[^0-9.]/g, ''));
            if (isNaN(parsed) || parsed <= 0) {
                setError('El abono inicial debe ser mayor a 0');
                return;
            }
            if (parsed >= totalAmount) {
                setError('El abono inicial debe ser menor al total del pedido');
                return;
            }
            initialPaymentValue = parsed;
        }

        setIsSubmitting(true);

        try {
            const result = await createOrderAction({
                items,
                addressId: deliveryType === 'delivery' ? selectedAddressId : undefined,
                paymentMethod,
                distributorSlug: slug,
                deliveryType,
                pickupTime: deliveryType === 'pickup' ? new Date(pickupTime).toISOString() : undefined,
                initialPayment: initialPaymentValue,
                deliveryFee: deliveryType === 'delivery' ? deliveryFee : 0,
                customerId: (userRole === 'admin' || userRole === 'staff') ? selectedCustomerId || undefined : undefined
            });

            if (result.error) {
                setError(result.error);
            } else {
                clearCart();
                router.push(`/shop/${slug}/order-confirmation/${result.orderId}`);
            }
        } catch (err) {
            console.error('Error submitting order:', {
                message: err instanceof Error ? err.message : 'Unknown error',
                stack: err instanceof Error ? err.stack : undefined,
                fullError: JSON.stringify(err, null, 2)
            });
            setError('Error al procesar el pedido');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Check if delivery is disabled
    const isDeliveryDisabled = deliveryType === 'delivery' && (
        deliveryStatus === 'too_far' ||
        deliveryStatus === 'min_order' ||
        !selectedAddressId ||
        !warehouseLocation
    );

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="max-w-md w-full">
                    <CardContent className="pt-6 text-center">
                        <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Carrito vacío</h2>
                        <p className="text-gray-500 mb-4">No tienes productos en tu carrito</p>
                        <Button onClick={() => router.push(`/shop/${slug}`)}>
                            Volver a la tienda
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => router.push(`/shop/${slug}`)}
                        className="mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver a la tienda
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900">Finalizar Pedido</h1>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Left Column - Forms */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* POS Mode: Customer Selector (Only for Admin/Staff) */}
                            {(userRole === 'admin' || userRole === 'staff') && (
                                <Card className="border-blue-200 bg-blue-50">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-blue-900">
                                            <User className="w-5 h-5" />
                                            Mode POS: Crear Pedido para Cliente
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <CustomerSelector
                                            distributorSlug={slug}
                                            distributorId={distributorId}
                                            value={selectedCustomerId}
                                            onChange={handleCustomerChange}
                                        />
                                    </CardContent>
                                </Card>
                            )}

                            {/* Address Selection */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Truck className="w-5 h-5" />
                                        Detalles de Entrega
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Delivery Type Selection */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div
                                            onClick={() => !isDeliveryDisabled && setDeliveryType('delivery')}
                                            className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center justify-center gap-2 transition-all ${deliveryType === 'delivery'
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                                } ${isDeliveryDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <Truck className="w-6 h-6" />
                                            <span className="font-medium">A Domicilio</span>
                                        </div>
                                        <div
                                            onClick={() => setDeliveryType('pickup')}
                                            className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center justify-center gap-2 transition-all ${deliveryType === 'pickup'
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                                }`}
                                        >
                                            <Store className="w-6 h-6" />
                                            <span className="font-medium">Retiro en Bodega</span>
                                        </div>
                                    </div>

                                    {/* Delivery Alerts */}
                                    {deliveryType === 'delivery' && deliveryStatus === 'too_far' && (
                                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                            <div className="flex items-start gap-3">
                                                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                                                <div>
                                                    <p className="font-medium text-red-800">Fuera de zona de cobertura</p>
                                                    <p className="text-sm text-red-600 mt-1">
                                                        Te encuentras a {distanceKm?.toFixed(1)} km de la bodega.
                                                        Máximo permitido: {deliverySettings?.max_radius_km} km.
                                                    </p>
                                                    <p className="text-sm text-red-600 mt-1">
                                                        Solo disponible para recogida en bodega.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {deliveryType === 'delivery' && deliveryStatus === 'min_order' && (
                                        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                            <div className="flex items-start gap-3">
                                                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                                                <div>
                                                    <p className="font-medium text-orange-800">Mínimo no alcanzado</p>
                                                    <p className="text-sm text-orange-600 mt-1">
                                                        El mínimo para domicilio es {formatPrice(deliverySettings?.min_order_amount || 0)}.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Distance Info */}
                                    {deliveryType === 'delivery' && distanceKm !== null && deliveryStatus === 'valid' && (
                                        <div className="p-3 bg-gray-50 rounded-lg text-sm">
                                            <p className="text-gray-600">
                                                <span className="font-medium">Distancia:</span> {distanceKm.toFixed(1)} km
                                                {deliveryFee > 0 && (
                                                    <span className="ml-2 text-orange-600">
                                                        (+ {formatPrice(deliveryFee)} envío)
                                                    </span>
                                                )}
                                                {deliveryFee === 0 && (
                                                    <span className="ml-2 text-green-600">Envío gratis</span>
                                                )}
                                            </p>
                                        </div>
                                    )}

                                    {deliveryType === 'delivery' && deliveryType === 'delivery' && (
                                        <div className="space-y-4">
                                            <Label>Selecciona una dirección:</Label>
                                            {addresses.length > 0 ? (
                                                <RadioGroup value={selectedAddressId} onValueChange={setSelectedAddressId}>
                                                    <div className="space-y-3">
                                                        {addresses.map((address) => (
                                                            <div
                                                                key={address.id}
                                                                className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedAddressId === address.id
                                                                    ? 'border-blue-500 bg-blue-50'
                                                                    : 'border-gray-200 hover:border-gray-300'
                                                                    }`}
                                                                onClick={() => setSelectedAddressId(address.id)}
                                                            >
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex-1">
                                                                        <p className="font-medium text-gray-900">
                                                                            {address.label}
                                                                        </p>
                                                                        <p className="text-sm text-gray-600 mt-1">
                                                                            {address.street_address}
                                                                        </p>
                                                                        <p className="text-sm text-gray-600">
                                                                            {address.city}, {getStateName(address.state || '')}
                                                                        </p>
                                                                        {address.additional_info && (
                                                                            <p className="text-sm text-gray-500 mt-1">
                                                                                {address.additional_info}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <RadioGroupItem
                                                                        value={address.id}
                                                                        id={address.id}
                                                                    />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </RadioGroup>
                                            ) : (
                                                <div className="text-center py-8 text-gray-500">
                                                    <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                                    <p>No tienes direcciones guardadas</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {deliveryType === 'pickup' && (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="pickup-time">Fecha y Hora de Retiro</Label>
                                                <Input
                                                    id="pickup-time"
                                                    type="datetime-local"
                                                    value={pickupTime}
                                                    onChange={(e) => setPickupTime(e.target.value)}
                                                    className="w-full"
                                                />
                                                <p className="text-sm text-gray-500">
                                                    Selecciona cuándo pasarás a recoger tu pedido.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => setIsAddressModalOpen(true)}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Agregar Nueva Dirección
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Payment Method */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="w-5 h-5" />
                                        Método de Pago
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <RadioGroup
                                        value={paymentMethod}
                                        onValueChange={(value) => setPaymentMethod(value as 'cash' | 'transfer' | 'credit')}
                                    >
                                        <div className="flex items-center space-x-2 p-4 border rounded-lg">
                                            <RadioGroupItem value="cash" id="cash" />
                                            <Label htmlFor="cash" className="flex-1 cursor-pointer">
                                                <div className="font-medium">Efectivo contra entrega</div>
                                                <div className="text-sm text-gray-500">Paga al recibir tu pedido</div>
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2 p-4 border rounded-lg">
                                            <RadioGroupItem value="transfer" id="transfer" />
                                            <Label htmlFor="transfer" className="flex-1 cursor-pointer">
                                                <div className="font-medium">Transferencia Bancaria</div>
                                                <div className="text-sm text-gray-500">Realiza el pago antes del envío</div>
                                            </Label>
                                        </div>
                                        <div className={`flex items-center space-x-2 p-4 border rounded-lg ${!creditInfo.hasCredit || subtotal > creditInfo.availableCredit
                                            ? 'opacity-50 cursor-not-allowed bg-gray-50'
                                            : 'cursor-pointer'
                                            }`}>
                                            <RadioGroupItem
                                                value="credit"
                                                id="credit"
                                                disabled={!creditInfo.hasCredit || subtotal > creditInfo.availableCredit}
                                            />
                                            <Label htmlFor="credit" className="flex-1 cursor-pointer">
                                                <div className="font-medium">Crédito / Fiado</div>
                                                {creditInfo.hasCredit ? (
                                                    <div className="text-sm text-gray-500">
                                                        Disponible: {formatPrice(creditInfo.availableCredit)}
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-gray-500">No disponible</div>
                                                )}
                                            </Label>
                                        </div>
                                        {creditInfo.hasCredit && subtotal > creditInfo.availableCredit && (
                                            <div className="text-sm text-red-600 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                ⚠️ Cupo insuficiente (Disponible: {formatPrice(creditInfo.availableCredit)})
                                            </div>
                                        )}

                                        {/* Initial Payment Option (Only for Credit) */}
                                        {paymentMethod === 'credit' && creditInfo.hasCredit && (
                                            <div className="mt-6 pt-6 border-t space-y-4">
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id="initial-payment"
                                                        checked={wantsInitialPayment}
                                                        onCheckedChange={(checked) => {
                                                            setWantsInitialPayment(checked as boolean);
                                                            if (!checked) setInitialPayment('');
                                                        }}
                                                    />
                                                    <Label htmlFor="initial-payment" className="cursor-pointer">
                                                        ¿Deseas dar un abono inicial?
                                                    </Label>
                                                </div>

                                                {wantsInitialPayment && (
                                                    <div className="space-y-2 pl-6 animate-in fade-in slide-in-from-top-2">
                                                        <Label htmlFor="payment-amount">Monto del Abono</Label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                                            <Input
                                                                id="payment-amount"
                                                                type="text"
                                                                placeholder="0"
                                                                className="pl-7"
                                                                value={initialPayment}
                                                                onChange={(e) => {
                                                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                                                    setInitialPayment(val);
                                                                }}
                                                            />
                                                        </div>
                                                        {initialPayment && !isNaN(parseFloat(initialPayment)) && (
                                                            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border text-right">
                                                                Restante a deber: <strong>{formatPrice(Math.max(0, totalAmount - parseFloat(initialPayment)))}</strong>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </RadioGroup>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column - Order Summary */}
                        <div className="lg:col-span-1">
                            <Card className="sticky top-4">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Truck className="w-5 h-5" />
                                        Resumen del Pedido
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Order Items */}
                                    <div className="space-y-3 max-h-64 overflow-y-auto">
                                        {items.map((item) => (
                                            <div key={item.variantId} className="flex gap-3">
                                                <div className="relative w-16 h-16 flex-shrink-0 bg-gray-200 rounded-md overflow-hidden">
                                                    {item.imageUrl ? (
                                                        <Image
                                                            src={item.imageUrl}
                                                            alt={item.productName}
                                                            fill
                                                            className="object-cover"
                                                            sizes="64px"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <ShoppingBag className="w-6 h-6 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 line-clamp-1">
                                                        {item.productName}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{item.variantName}</p>
                                                    <div className="flex justify-between items-center mt-1">
                                                        <span className="text-sm text-gray-600">x{item.quantity}</span>
                                                        <span className="text-sm font-semibold">
                                                            {formatPrice(item.price * item.quantity)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Totals */}
                                    <div className="border-t pt-4 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Subtotal</span>
                                            <span className="font-medium">{formatPrice(subtotal)}</span>
                                        </div>
                                        {deliveryType === 'delivery' ? (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Envío</span>
                                                {deliveryFee === 0 ? (
                                                    <span className="font-medium text-green-600">
                                                        {distanceKm !== null ? 'Gratis' : 'Calculando...'}
                                                    </span>
                                                ) : (
                                                    <span className="font-medium text-orange-600">
                                                        {formatPrice(deliveryFee)}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Retiro en Bodega</span>
                                                <span className="font-medium text-green-600">Sin costo</span>
                                            </div>
                                        )}

                                        {/* Financial Breakdown */}
                                        {wantsInitialPayment && paymentMethod === 'credit' && initialPayment && (
                                            <>
                                                <div className="flex justify-between text-sm pt-2 border-t mt-2">
                                                    <span className="text-gray-600">Abono Inicial</span>
                                                    <span className="font-medium text-green-600">
                                                        - {formatPrice(parseFloat(initialPayment) || 0)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-lg font-bold pt-2 text-orange-600">
                                                    <span>Restante a Deber</span>
                                                    <span>
                                                        {formatPrice(Math.max(0, totalAmount - parseFloat(initialPayment)))}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-base font-bold pt-2 border-t">
                                                    <span>Pagas Hoy</span>
                                                    <span className="text-blue-600">
                                                        {formatPrice(parseFloat(initialPayment) || 0)}
                                                    </span>
                                                </div>
                                            </>
                                        )}

                                        {!wantsInitialPayment && (
                                            <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                                <span>Total a Pagar</span>
                                                <span className="text-blue-600">{formatPrice(totalAmount)}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Submit Button */}
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        size="lg"
                                        disabled={isSubmitting || (deliveryType === 'delivery' && isDeliveryDisabled) || (deliveryType === 'pickup' && !pickupTime)}
                                    >
                                        {isSubmitting ? 'Procesando...' : 'Enviar Pedido'}
                                    </Button>

                                    {error && (
                                        <div className="text-sm text-red-600 text-center">
                                            {error}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>

                {/* Address Modal */}
                <AddressModal
                    isOpen={isAddressModalOpen}
                    onClose={() => setIsAddressModalOpen(false)}
                    onSave={handleCreateAddress}
                />
            </div>
        </div>
    );
}
