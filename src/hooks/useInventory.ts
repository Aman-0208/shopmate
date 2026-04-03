import { useState, useEffect, useCallback } from 'react';
import { InventoryItem, CartItem, Bill } from '@/types/inventory';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { itemsApi, billsApi, SalePayload } from '@/lib/api';

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();

  // ── Initial load from API ──────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [fetchedItems, fetchedBills] = await Promise.all([
          itemsApi.getAll(),
          billsApi.getAll(),
        ]);
        setItems(fetchedItems);
        setBills(fetchedBills);
      } catch (err) {
        toast({
          title: 'Connection Error',
          description: 'Could not reach the backend server. Make sure it is running on port 5000.',
          variant: 'destructive',
        });
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // ── Items ─────────────────────────────────────────────────────────────────
  const addItem = useCallback(
    async (data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const newItem = await itemsApi.create(data);
        setItems((prev) => [newItem, ...prev]);
        toast({ title: t('toast.itemAdded'), description: `${data.name} ${t('toast.itemAddedDesc')}` });
      } catch (err: unknown) {
        toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
      }
    },
    [t]
  );

  const updateItem = useCallback(
    async (id: string, updates: Partial<InventoryItem>) => {
      try {
        const updated = await itemsApi.update(id, updates);
        setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
        toast({ title: t('toast.itemUpdated'), description: t('toast.itemUpdatedDesc') });
      } catch (err: unknown) {
        toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
      }
    },
    [t]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      try {
        await itemsApi.delete(id);
        setItems((prev) => prev.filter((item) => item.id !== id));
        toast({ title: t('toast.itemDeleted'), description: t('toast.itemDeletedDesc') });
      } catch (err: unknown) {
        toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
      }
    },
    [t]
  );

  // ── Cart ──────────────────────────────────────────────────────────────────
  const addToCart = useCallback(
    (item: InventoryItem, quantity: number = 1) => {
      if (quantity > item.quantity) {
        toast({
          title: t('toast.insufficientStock'),
          description: `${t('toast.only')} ${item.quantity} ${item.unit} ${t('toast.unitsAvailable')}`,
          variant: 'destructive',
        });
        return;
      }

      setCart((prev) => {
        const existing = prev.find((c) => c.item.id === item.id);
        if (existing) {
          const newQty = existing.quantity + quantity;
          if (newQty > item.quantity) {
            toast({
              title: t('toast.insufficientStock'),
              description: `${t('toast.only')} ${item.quantity} ${item.unit} ${t('toast.unitsAvailable')}`,
              variant: 'destructive',
            });
            return prev;
          }
          return prev.map((c) => (c.item.id === item.id ? { ...c, quantity: newQty } : c));
        }
        return [...prev, { item, quantity }];
      });
    },
    [t]
  );

  const updateCartQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((c) => c.item.id !== itemId));
      return;
    }
    setCart((prev) => prev.map((c) => (c.item.id === itemId ? { ...c, quantity } : c)));
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart((prev) => prev.filter((c) => c.item.id !== itemId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  // ── Complete Sale ─────────────────────────────────────────────────────────
  const completeSale = useCallback(
    async (
      customerName?: string,
      customerGstin?: string
    ) => {
      if (cart.length === 0) {
        toast({ title: t('toast.emptyCart'), description: t('toast.emptyCartDesc'), variant: 'destructive' });
        return null;
      }

      const payload: SalePayload = {
        cart: cart.map(({ item, quantity }) => ({
          itemId: item.id,
          name: item.name,
          sku: item.sku,
          hsn: item.hsn,
          price: item.price,
          quantity,
          unit: item.unit,
        })),
        customerName,
        customerGstin,
      };

      try {
        const bill = await billsApi.create(payload);

        // Deduct quantities from local state to match what the server did
        setItems((prev) =>
          prev.map((item) => {
            const ci = cart.find((c) => c.item.id === item.id);
            if (ci) return { ...item, quantity: item.quantity - ci.quantity, updatedAt: new Date() };
            return item;
          })
        );

        setBills((prev) => [bill, ...prev]);
        setCart([]);

        toast({
          title: t('toast.saleComplete'),
          description: `${t('receipt.billNo')} #${bill.id.toUpperCase().slice(-8)} — ${t('receipt.grandTotal')}: ₹${bill.grandTotal.toFixed(2)}`,
        });

        return bill;
      } catch (err: unknown) {
        toast({ title: 'Sale Failed', description: (err as Error).message, variant: 'destructive' });
        return null;
      }
    },
    [cart, t]
  );

  // ── Delete Bill ───────────────────────────────────────────────────────────
  const deleteBill = useCallback(
    async (billId: string) => {
      try {
        await billsApi.delete(billId);
        setBills((prev) => prev.filter((b) => b.id !== billId));
        toast({ title: t('toast.billDeleted'), description: t('toast.billDeletedDesc') });
      } catch (err: unknown) {
        toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
      }
    },
    [t]
  );

  // ── Derived values ─────────────────────────────────────────────────────────
  const cartTotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
  const cartItemCount = cart.reduce((sum, c) => sum + c.quantity, 0);
  const lowStockItems = items.filter((item) => item.quantity <= item.minStock);
  const totalInventoryValue = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return {
    items,
    bills,
    cart,
    isLoading,
    addItem,
    updateItem,
    deleteItem,
    deleteBill,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    completeSale,
    cartTotal,
    cartItemCount,
    lowStockItems,
    totalInventoryValue,
  };
}
