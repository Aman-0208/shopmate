import { useState } from 'react';
import { InventoryItem, CartItem } from '@/types/inventory';
import { Trash2, Search, ShoppingBag, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

interface BillingPanelProps {
  items: InventoryItem[];
  cart: CartItem[];
  cartTotal: number;
  onAddToCart: (item: InventoryItem, quantity?: number) => void;
  onUpdateCartQuantity: (itemId: string, quantity: number) => void;
  onRemoveFromCart: (itemId: string) => void;
  onClearCart: () => void;
  onCompleteSale: (customerName?: string, customerGstin?: string) => void;
}

export function BillingPanel({
  items,
  cart,
  cartTotal,
  onAddToCart,
  onUpdateCartQuantity,
  onRemoveFromCart,
  onClearCart,
  onCompleteSale,
}: BillingPanelProps) {
  const [search, setSearch] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');
  // Track per-item qty input string (for free-type)
  const [qtyInputs, setQtyInputs] = useState<Record<string, string>>({});
  const { t } = useLanguage();

  const availableItems = items.filter(
    (item) =>
      item.quantity > 0 &&
      (item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCompleteSale = () => {
    onCompleteSale(
      customerName || undefined,
      customerGstin || undefined
    );
    setCustomerName('');
    setCustomerGstin('');
  };

  const handleQtyChange = (itemId: string, raw: string) => {
    setQtyInputs((prev) => ({ ...prev, [itemId]: raw }));
  };

  const handleQtyBlur = (itemId: string) => {
    const raw = qtyInputs[itemId];
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed > 0) {
      onUpdateCartQuantity(itemId, parsed);
    }
    setQtyInputs((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  const getDisplayQty = (itemId: string, quantity: number) => {
    return itemId in qtyInputs ? qtyInputs[itemId] : String(quantity);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
      {/* Product Selection */}
      <div className="card-elevated p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          {t('billing.selectProducts')}
        </h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('billing.searchProducts')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {availableItems.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              {search ? t('billing.noProductsMatch') : t('billing.noProducts')}
            </p>
          ) : (
            availableItems.map((item) => {
              const cartItem = cart.find((c) => c.item.id === item.id);
              const remainingStock = item.quantity - (cartItem?.quantity || 0);

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">{item.sku}</span>
                      <Badge variant="outline" className="text-xs">
                        {remainingStock} {item.unit} {t('billing.left')}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-foreground">
                      ₹{item.price.toFixed(2)}<span className="text-xs text-muted-foreground">/{item.unit}</span>
                    </span>
                    <Button
                      size="sm"
                      onClick={() => onAddToCart(item)}
                      disabled={remainingStock <= 0}
                    >
                      + Add
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Cart / Bill */}
      <div className="card-elevated p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Receipt className="w-5 h-5" />
          {t('billing.currentBill')}
        </h2>

        <div className="mb-4 space-y-3">
          <Input
            placeholder={t('billing.customerName')}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
          <Input
            placeholder={t('billing.customerGstin')}
            value={customerGstin}
            onChange={(e) => setCustomerGstin(e.target.value)}
          />
        </div>

        <Separator className="my-4" />

        {cart.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{t('billing.cartEmpty')}</p>
            <p className="text-sm">{t('billing.addProducts')}</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {cart.map(({ item, quantity }) => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ₹{item.price.toFixed(2)} per {item.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Free-type quantity field with unit label */}
                    <div className="flex items-center gap-1 rounded-md border border-input bg-background overflow-hidden">
                      <Input
                        type="number"
                        step="any"
                        min="0.001"
                        value={getDisplayQty(item.id, quantity)}
                        onChange={(e) => handleQtyChange(item.id, e.target.value)}
                        onBlur={() => handleQtyBlur(item.id)}
                        className="w-20 border-0 text-center focus-visible:ring-0 h-8 px-2"
                        aria-label={`Quantity for ${item.name}`}
                      />
                      <span className="text-xs text-muted-foreground pr-2 font-medium">{item.unit}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onRemoveFromCart(item.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="w-24 text-right font-semibold">
                    ₹{(item.price * quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('billing.subtotal')}</span>
                <span>₹{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold">
                <span>{t('billing.total')}</span>
                <span className="text-primary">₹{cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={onClearCart}>
                {t('billing.clear')}
              </Button>
              <Button
                className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
                onClick={handleCompleteSale}
              >
                {t('billing.completeSale')}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
