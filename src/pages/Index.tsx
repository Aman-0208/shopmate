import { useState } from 'react';
import { Package, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';
import { Header } from '@/components/Header';
import { StatsCard } from '@/components/StatsCard';
import { InventoryTable } from '@/components/InventoryTable';
import { BillingPanel } from '@/components/BillingPanel';
import { SalesHistory } from '@/components/SalesHistory';
import { BillReceiptDialog } from '@/components/BillReceiptDialog';
import { useInventory } from '@/hooks/useInventory';
import { useLanguage } from '@/contexts/LanguageContext';
import { Bill } from '@/types/inventory';

const Index = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'billing' | 'history'>('inventory');
  const [lastBill, setLastBill] = useState<Bill | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const { t } = useLanguage();
  
  const {
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
  } = useInventory();

  const handleCompleteSale = async (customerName?: string, customerGstin?: string) => {
    const bill = await completeSale(customerName, customerGstin);
    if (bill) {
      setLastBill(bill);
      setReceiptOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t('loading.inventory')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        cartItemCount={cartItemCount}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      <main className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title={t('stats.totalProducts')}
            value={items.length}
            subtitle={`${items.reduce((sum, i) => sum + i.quantity, 0)} ${t('stats.unitsInStock')}`}
            icon={Package}
            variant="default"
          />
          <StatsCard
            title={t('stats.inventoryValue')}
            value={`₹${totalInventoryValue.toFixed(2)}`}
            subtitle={t('stats.totalStockValue')}
            icon={DollarSign}
            variant="success"
          />
          <StatsCard
            title={t('stats.lowStockItems')}
            value={lowStockItems.length}
            subtitle={lowStockItems.length > 0 ? t('stats.needsAttention') : t('stats.allStocked')}
            icon={AlertTriangle}
            variant={lowStockItems.length > 0 ? 'warning' : 'default'}
          />
          <StatsCard
            title={t('stats.cartTotal')}
            value={`₹${cartTotal.toFixed(2)}`}
            subtitle={`${cartItemCount} ${t('stats.itemsInCart')}`}
            icon={TrendingUp}
            variant="default"
          />
        </div>

        {/* Main Content */}
        {activeTab === 'inventory' ? (
          <InventoryTable
            items={items}
            onAddItem={addItem}
            onUpdateItem={updateItem}
            onDeleteItem={deleteItem}
          />
        ) : activeTab === 'billing' ? (
          <BillingPanel
            items={items}
            cart={cart}
            cartTotal={cartTotal}
            onAddToCart={addToCart}
            onUpdateCartQuantity={updateCartQuantity}
            onRemoveFromCart={removeFromCart}
            onClearCart={clearCart}
            onCompleteSale={handleCompleteSale}
          />
        ) : (
          <SalesHistory bills={bills} onDeleteBill={deleteBill} />
        )}
      </main>

      <BillReceiptDialog
        bill={lastBill}
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
      />
    </div>
  );
};

export default Index;
