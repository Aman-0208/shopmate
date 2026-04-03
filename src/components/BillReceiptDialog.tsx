import { useRef } from 'react';
import { Bill } from '@/types/inventory';
import { X, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';

interface BillReceiptDialogProps {
  bill: Bill | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BillReceiptDialog({ bill, open, onOpenChange }: BillReceiptDialogProps) {
  const { t } = useLanguage();
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!bill) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const billDate = new Date(bill.createdAt).toLocaleDateString();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${t('receipt.taxInvoice')} - ${bill.id.toUpperCase()}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 700px; margin: 0 auto; font-size: 13px; }
            .header { text-align: center; border: 2px solid #000; padding: 10px; margin-bottom: 0; }
            .header h1 { font-size: 22px; margin-bottom: 2px; }
            .header .subtitle { font-size: 11px; color: #666; }
            .header .tax-label { font-size: 14px; font-weight: bold; margin-top: 5px; color: #c00; }
            .info-row { display: flex; border: 1px solid #000; border-top: none; }
            .info-cell { flex: 1; padding: 5px 8px; border-right: 1px solid #000; }
            .info-cell:last-child { border-right: none; }
            .info-cell label { font-weight: bold; font-size: 11px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 6px 8px; text-align: left; font-size: 12px; }
            th { background: #f5f5f5; font-weight: bold; text-align: center; }
            td.num { text-align: right; }
            td.center { text-align: center; }
            .total-section { border: 1px solid #000; border-top: none; }
            .total-row { display: flex; justify-content: flex-end; padding: 4px 8px; border-bottom: 1px solid #000; }
            .total-row:last-child { border-bottom: none; font-weight: bold; font-size: 15px; }
            .total-row label { width: 120px; }
            .total-row span { width: 120px; text-align: right; }
            .footer { display: flex; border: 1px solid #000; border-top: none; padding: 10px; justify-content: space-between; font-size: 11px; }
            .signature { text-align: right; margin-top: 30px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${t('app.title')}</h1>
            <div class="subtitle">${t('receipt.shopAddress')}<br/>GSTIN: 22BROPS0771E1ZR</div>
            <div class="tax-label">${t('receipt.taxInvoice')}</div>
          </div>

          <div class="info-row">
            <div class="info-cell"><label>${t('receipt.billNo')}:</label> ${bill.id.toUpperCase().slice(-8)}</div>
            <div class="info-cell"><label>${t('receipt.date')}:</label> ${billDate}</div>
          </div>
          <div class="info-row">
            <div class="info-cell"><label>${t('receipt.customer')}:</label> ${bill.customerName || '-'}</div>
            <div class="info-cell"><label>GSTIN:</label> ${bill.customerGstin || '-'}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width:40px">${t('receipt.sno')}</th>
                <th>${t('receipt.particulars')}</th>
                <th style="width:80px">HSN</th>
                <th style="width:80px">${t('receipt.qty')}</th>
                <th style="width:80px">${t('receipt.rate')}</th>
                <th style="width:100px">${t('receipt.amount')}</th>
              </tr>
            </thead>
            <tbody>
              ${bill.items.map(({ item, quantity }, idx) => `
                <tr>
                  <td class="center">${idx + 1}</td>
                  <td>${item.name}</td>
                  <td class="center">${item.hsn || '-'}</td>
                  <td class="center">${quantity} ${item.unit || 'pcs'}</td>
                  <td class="num">₹${item.price.toFixed(2)}/${item.unit || 'pcs'}</td>
                  <td class="num">₹${(item.price * quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">
              <label>${t('billing.total')}:</label>
              <span>₹${bill.total.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <label>CGST @ 9%:</label>
              <span>₹${bill.cgst.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <label>SGST @ 9%:</label>
              <span>₹${bill.sgst.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <label>${t('receipt.grandTotal')}:</label>
              <span>₹${bill.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div class="footer">
            <div>
              <strong>${t('receipt.bankDetails')}</strong><br/>
              BANK: S.B.I. RAJHARA<br/>
              A/C NO: 35922017430<br/>
              IFSC: SBIN0002887
            </div>
            <div class="signature">
              <br/><br/><br/>
              ${t('receipt.forShop')}
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const billDate = new Date(bill.createdAt).toLocaleDateString();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('receipt.taxInvoice')}</DialogTitle>
        </DialogHeader>

        <div ref={receiptRef} className="space-y-0 border border-border rounded-lg overflow-hidden">
          {/* Header */}
          <div className="text-center p-4 border-b border-border bg-muted/30">
            <h2 className="text-2xl font-bold text-foreground">{t('app.title')}</h2>
            <p className="text-xs text-muted-foreground whitespace-pre-line">{t('receipt.shopAddress')}</p>
            <p className="text-xs text-muted-foreground font-medium mt-1">GSTIN: 22BROPS0771E1ZR</p>
            <p className="text-sm font-bold text-destructive mt-1">{t('receipt.taxInvoice')}</p>
          </div>

          {/* Bill Info */}
          <div className="grid grid-cols-2 border-b border-border text-sm">
            <div className="p-2 px-3 border-r border-border">
              <span className="font-semibold">{t('receipt.billNo')}:</span> {bill.id.toUpperCase().slice(-8)}
            </div>
            <div className="p-2 px-3">
              <span className="font-semibold">{t('receipt.date')}:</span> {billDate}
            </div>
          </div>
          <div className="grid grid-cols-2 border-b border-border text-sm">
            <div className="p-2 px-3 border-r border-border">
              <span className="font-semibold">{t('receipt.customer')}:</span> {bill.customerName || '-'}
            </div>
            <div className="p-2 px-3">
              <span className="font-semibold">GSTIN:</span> {bill.customerGstin || '-'}
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground">
                  <th className="p-2 border-b border-r border-border text-center w-10">{t('receipt.sno')}</th>
                  <th className="p-2 border-b border-r border-border text-left">{t('receipt.particulars')}</th>
                  <th className="p-2 border-b border-r border-border text-center w-20">HSN</th>
                  <th className="p-2 border-b border-r border-border text-center w-20">{t('receipt.qty')}</th>
                  <th className="p-2 border-b border-r border-border text-right w-24">{t('receipt.rate')}</th>
                  <th className="p-2 border-b border-border text-right w-24">{t('receipt.amount')}</th>
                </tr>
              </thead>
              <tbody>
                {bill.items.map(({ item, quantity }, idx) => (
                  <tr key={item.id || idx} className="border-b border-border">
                    <td className="p-2 border-r border-border text-center">{idx + 1}</td>
                    <td className="p-2 border-r border-border font-medium">{item.name}</td>
                    <td className="p-2 border-r border-border text-center">{item.hsn || '-'}</td>
                    <td className="p-2 border-r border-border text-center">
                      {quantity} <span className="text-muted-foreground text-xs">{item.unit || 'pcs'}</span>
                    </td>
                    <td className="p-2 border-r border-border text-right">
                      ₹{item.price.toFixed(2)}<span className="text-muted-foreground text-xs">/{item.unit || 'pcs'}</span>
                    </td>
                    <td className="p-2 text-right font-medium">₹{(item.price * quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t border-border">
            <div className="flex justify-end items-center p-2 px-3 border-b border-border text-sm">
              <span className="w-28 font-semibold">{t('billing.total')}:</span>
              <span className="w-28 text-right">₹{bill.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-end items-center p-2 px-3 border-b border-border text-sm">
              <span className="w-28 font-semibold">CGST @ 9%:</span>
              <span className="w-28 text-right">₹{bill.cgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-end items-center p-2 px-3 border-b border-border text-sm">
              <span className="w-28 font-semibold">SGST @ 9%:</span>
              <span className="w-28 text-right">₹{bill.sgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-end items-center p-2 px-3 text-base font-bold">
              <span className="w-28">{t('receipt.grandTotal')}:</span>
              <span className="w-28 text-right text-primary">₹{bill.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="grid grid-cols-2 border-t border-border text-xs">
            <div className="p-3 border-r border-border">
              <p className="font-semibold mb-1">{t('receipt.bankDetails')}</p>
              <p className="text-muted-foreground">BANK: S.B.I. RAJHARA</p>
              <p className="text-muted-foreground">A/C NO: 35922017430</p>
              <p className="text-muted-foreground">IFSC: SBIN0002887</p>
            </div>
            <div className="p-3 text-right flex flex-col justify-end">
              <p className="text-muted-foreground font-bold">{t('receipt.forShop')}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            {t('receipt.close')}
          </Button>
          <Button className="flex-1" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            {t('receipt.print')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
