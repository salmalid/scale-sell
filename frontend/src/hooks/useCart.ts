import { useState, useCallback } from 'react';
import { CartItem, FruitData, Invoice } from '@/types/checkout';
import { TVA_RATE } from '@/data/fruits';

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((fruit: FruitData, weightKg: number, estimatedSize: 'small' | 'medium' | 'large') => {
    const totalPrice = weightKg * fruit.pricePerKg;
    const newItem: CartItem = {
      fruit,
      weightKg,
      estimatedSize,
      unitPrice: fruit.pricePerKg,
      totalPrice,
      timestamp: new Date(),
    };
    setItems(prev => [...prev, newItem]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateItemWeight = useCallback((index: number, newWeight: number) => {
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          weightKg: newWeight,
          totalPrice: newWeight * item.fruit.pricePerKg,
        };
      }
      return item;
    }));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const tva = subtotal * TVA_RATE;
  const total = subtotal + tva;
  const totalWeight = items.reduce((sum, item) => sum + item.weightKg, 0);

  const generateInvoice = useCallback((): Invoice => {
    return {
      id: `FAC-${Date.now().toString(36).toUpperCase()}`,
      items: [...items],
      subtotal,
      tva,
      tvaRate: TVA_RATE,
      total,
      timestamp: new Date(),
    };
  }, [items, subtotal, tva, total]);

  return {
    items,
    addItem,
    removeItem,
    updateItemWeight,
    clearCart,
    subtotal,
    tva,
    total,
    totalWeight,
    generateInvoice,
    itemCount: items.length,
  };
}
