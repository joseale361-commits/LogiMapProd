"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface CartItem {
    productId: string;
    variantId: string;
    productName: string;
    variantName: string;
    price: number;
    packUnits: number;
    quantity: number;
    imageUrl: string | null;
}

interface CartContextType {
    items: CartItem[];
    totalItems: number;
    addItem: (item: Omit<CartItem, 'quantity'>) => void;
    updateQuantity: (variantId: string, quantity: number) => void;
    removeItem: (variantId: string) => void;
    clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'logimap_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load cart from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(CART_STORAGE_KEY);
            if (stored) {
                setItems(JSON.parse(stored));
            }
        } catch (error) {
            console.error('[Cart] Failed to load cart from localStorage:', error);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (isLoaded) {
            try {
                localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
            } catch (error) {
                console.error('[Cart] Failed to save cart to localStorage:', error);
            }
        }
    }, [items, isLoaded]);

    // Calculate total items count
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    // Add item to cart
    const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => {
        setItems((prevItems) => {
            const existingIndex = prevItems.findIndex((i) => i.variantId === item.variantId);

            if (existingIndex >= 0) {
                // Update quantity of existing item
                const updated = [...prevItems];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    quantity: updated[existingIndex].quantity + 1,
                };
                return updated;
            }

            // Add new item
            return [...prevItems, { ...item, quantity: 1 }];
        });
    }, []);

    // Update quantity of an item
    const updateQuantity = useCallback((variantId: string, quantity: number) => {
        if (quantity <= 0) {
            removeItem(variantId);
            return;
        }

        setItems((prevItems) =>
            prevItems.map((item) =>
                item.variantId === variantId ? { ...item, quantity } : item
            )
        );
    }, []);

    // Remove item from cart
    const removeItem = useCallback((variantId: string) => {
        setItems((prevItems) => prevItems.filter((item) => item.variantId !== variantId));
    }, []);

    // Clear all items from cart
    const clearCart = useCallback(() => {
        setItems([]);
    }, []);

    const value: CartContextType = {
        items,
        totalItems,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
