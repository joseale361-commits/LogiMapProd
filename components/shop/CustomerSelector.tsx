"use client"

import { useState, useEffect, useRef } from 'react';
import { Search, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { searchCustomersAction, CustomerOption } from '@/lib/actions/pos';

interface CustomerSelectorProps {
    distributorSlug: string;
    distributorId: string;
    value: string | null;
    onChange: (customerId: string | null, customer: CustomerOption | null) => void;
    disabled?: boolean;
}

export type { CustomerOption };
export function CustomerSelector({
    distributorSlug,
    distributorId,
    value,
    onChange,
    disabled = false
}: CustomerSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [customers, setCustomers] = useState<CustomerOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Load initial customers on mount
    useEffect(() => {
        console.log('Fetching customers on mount...');
        loadCustomers('');
    }, []);

    // Load customers when dropdown opens
    useEffect(() => {
        if (isOpen && customers.length === 0 && !loading) {
            console.log('Fetching customers on dropdown open...');
            loadCustomers('');
        }
    }, [isOpen]);

    // Handle outside click to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadCustomers = async (search: string) => {
        console.log('Fetching customers...', { distributorId, distributorSlug, search });
        setLoading(true);
        try {
            // Prefer using distributorId directly if available, otherwise fall back to slug resolution
            const result = distributorId
                ? await searchCustomersAction(distributorId, search, true) // Pass flag to skip slug lookup
                : await searchCustomersAction(distributorSlug, search);
            console.log('Fetch customers result:', result);
            if (result.success) {
                console.log('Customers loaded:', result.customers.length);
                setCustomers(result.customers);

                // If we have a selected value, find the customer in the list
                if (value) {
                    const found = result.customers.find(c => c.id === value);
                    if (found) {
                        setSelectedCustomer(found);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectCustomer = (customer: CustomerOption) => {
        setSelectedCustomer(customer);
        setIsOpen(false);
        setSearchTerm('');
        onChange(customer.id, customer);
    };

    const handleClear = () => {
        setSelectedCustomer(null);
        setSearchTerm('');
        onChange(null, null);
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    const filteredCustomers = customers.filter(c =>
        c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4" ref={wrapperRef}>
            <div className="relative">
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Seleccionar Cliente
                </label>

                {selectedCustomer ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{selectedCustomer.full_name}</p>
                                    <p className="text-sm text-gray-500">
                                        {selectedCustomer.phone || 'Sin teléfono'}
                                        {selectedCustomer.address && ` • ${selectedCustomer.address.city || ''}`}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClear}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                Cambiar
                            </Button>
                        </div>

                        {/* Credit Info */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-gray-50 p-3 rounded-lg text-center">
                                <p className="text-xs text-gray-500">Cupro de Crédito</p>
                                <p className="font-semibold text-gray-900">{formatPrice(selectedCustomer.credit_limit)}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg text-center">
                                <p className="text-xs text-gray-500">Deuda Actual</p>
                                <p className="font-semibold text-red-600">{formatPrice(selectedCustomer.current_debt)}</p>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg text-center">
                                <p className="text-xs text-gray-500">Disponible</p>
                                <p className="font-semibold text-green-600">
                                    {formatPrice(Math.max(0, selectedCustomer.credit_limit - selectedCustomer.current_debt))}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="relative">
                        <Input
                            ref={inputRef}
                            placeholder="Buscar cliente por nombre, teléfono o email..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                if (!isOpen) setIsOpen(true);
                            }}
                            onFocus={() => setIsOpen(true)}
                            disabled={disabled}
                            className="pl-10"
                            autoComplete="off"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                        {loading && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                        )}
                    </div>
                )}

                {/* Dropdown */}
                {isOpen && !selectedCustomer && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {loading && customers.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                                Cargando clientes...
                            </div>
                        ) : filteredCustomers.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                No se encontraron clientes
                            </div>
                        ) : (
                            <div className="py-1">
                                {filteredCustomers.map((customer) => (
                                    <button
                                        key={customer.id}
                                        onClick={() => handleSelectCustomer(customer)}
                                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0 border-gray-100 flex items-center gap-3"
                                    >
                                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <User className="w-4 h-4 text-gray-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">
                                                {customer.full_name}
                                            </p>
                                            <p className="text-sm text-gray-500 truncate">
                                                {customer.phone || 'Sin teléfono'}
                                                {customer.email && ` • ${customer.email}`}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Warning if no customer selected and disabled */}
            {!selectedCustomer && !disabled && (
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                    ⚠️ Por favor selecciona un cliente para continuar
                </p>
            )}
        </div>
    );
}
