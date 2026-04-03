import { useState } from 'react';
import { Bill } from '@/types/inventory';
import { Search, Receipt, Calendar, User, Eye, Trash2, Download, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BillReceiptDialog } from '@/components/BillReceiptDialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { billsApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SalesHistoryProps {
  bills: Bill[];
  onDeleteBill: (billId: string) => void;
}

export function SalesHistory({ bills, onDeleteBill }: SalesHistoryProps) {
  const [search, setSearch] = useState('');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { t } = useLanguage();

  const filteredBills = bills.filter((bill) => {
    const searchLower = search.toLowerCase();
    const matchesId = bill.id.toLowerCase().includes(searchLower);
    const matchesCustomer = bill.customerName?.toLowerCase().includes(searchLower);
    const matchesItem = bill.items.some(({ item }) =>
      item.name.toLowerCase().includes(searchLower)
    );
    return matchesId || matchesCustomer || matchesItem;
  });

  const handleViewBill = (bill: Bill) => {
    setSelectedBill(bill);
    setReceiptOpen(true);
  };

  const handleDownloadMonthly = async () => {
    setDownloading(true);
    try {
      await billsApi.downloadMonthly();
      toast({
        title: 'Report Downloaded',
        description: 'Monthly billing report PDF has been saved.',
      });
    } catch {
      toast({
        title: 'Download Failed',
        description: 'Could not generate the monthly PDF. Make sure the server is running.',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalSales = bills.reduce((sum, bill) => sum + (bill.grandTotal || bill.total), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-elevated p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Receipt className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('history.totalBills')}</p>
              <p className="text-2xl font-bold">{bills.length}</p>
            </div>
          </div>
        </div>
        <div className="card-elevated p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <Receipt className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('history.totalSales')}</p>
              <p className="text-2xl font-bold">₹{totalSales.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="card-elevated p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Receipt className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('history.avgBillValue')}</p>
              <p className="text-2xl font-bold">
                ₹{bills.length > 0 ? (totalSales / bills.length).toFixed(2) : '0.00'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bills List */}
      <div className="card-elevated p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            {t('history.salesHistory')}
          </h2>
          {/* Monthly PDF Download Button */}
          <Button
            variant="outline"
            onClick={handleDownloadMonthly}
            disabled={downloading}
            className="flex items-center gap-2"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {downloading ? 'Generating PDF…' : 'Download Monthly Report'}
          </Button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('history.searchBills')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {filteredBills.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{bills.length === 0 ? t('history.noBills') : t('history.noMatch')}</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {filteredBills.map((bill) => (
              <div
                key={bill.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-medium text-foreground">
                      #{bill.id.toUpperCase().slice(-8)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {bill.items.length} {bill.items.length === 1 ? t('history.item') : t('history.items')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(bill.createdAt)}
                    </span>
                    {bill.customerName && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {bill.customerName}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-primary">
                    ₹{(bill.grandTotal || bill.total).toFixed(2)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewBill(bill)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    {t('history.view')}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('history.deleteBill')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('history.deleteConfirm')} #{bill.id.toUpperCase().slice(-8)}? {t('history.deleteWarning')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('inventory.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDeleteBill(bill.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {t('inventory.delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BillReceiptDialog
        bill={selectedBill}
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
      />
    </div>
  );
}
