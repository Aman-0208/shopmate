import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { InventoryItem } from '@/types/inventory';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';

const UNITS = [
  { value: 'pcs', label: 'Pieces (pcs)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'g', label: 'Grams (g)' },
  { value: 'm', label: 'Metres (m)' },
  { value: 'L', label: 'Litres (L)' },
  { value: 'dozen', label: 'Dozen' },
];

const itemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  sku: z.string().min(1, 'SKU is required').max(50),
  hsn: z.string().max(20).default(''),
  category: z.string().min(1, 'Category is required').max(50),
  price: z.coerce.number().min(0, 'Price must be positive'),
  quantity: z.coerce.number().min(0, 'Quantity must be positive'),
  minStock: z.coerce.number().min(0, 'Minimum stock must be positive'),
  unit: z.string().min(1, 'Unit is required').max(20).default('pcs'),
});

type ItemFormData = z.infer<typeof itemSchema>;

interface ItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: InventoryItem;
  onSubmit: (data: ItemFormData) => void;
}

export function ItemFormDialog({ open, onOpenChange, item, onSubmit }: ItemFormDialogProps) {
  const { t } = useLanguage();
  const form = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: '',
      sku: '',
      hsn: '',
      category: '',
      price: 0,
      quantity: 0,
      minStock: 5,
      unit: 'pcs',
    },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        name: item.name,
        sku: item.sku,
        hsn: item.hsn || '',
        category: item.category,
        price: item.price,
        quantity: item.quantity,
        minStock: item.minStock,
        unit: item.unit ?? 'pcs',
      });
    } else {
      form.reset({
        name: '',
        sku: '',
        hsn: '',
        category: '',
        price: 0,
        quantity: 0,
        minStock: 5,
        unit: 'pcs',
      });
    }
  }, [item, form, open]);

  const handleSubmit = (data: ItemFormData) => {
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? t('form.editItem') : t('form.addNewItem')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.itemNameLabel')}</FormLabel>
                  <FormControl>
                    <Input placeholder="Wireless Mouse" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.skuLabel')}</FormLabel>
                    <FormControl>
                      <Input placeholder="WM-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hsn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.hsnLabel')}</FormLabel>
                    <FormControl>
                      <Input placeholder="8471" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.categoryLabel')}</FormLabel>
                    <FormControl>
                      <Input placeholder="Electronics" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Unit selection */}
            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit of Measurement</FormLabel>
                  <FormControl>
                    <Input placeholder="pcs" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.priceLabel')}</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="29.99" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.quantityLabel')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.minStockLabel')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('form.cancel')}
              </Button>
              <Button type="submit">
                {item ? t('form.saveChanges') : t('form.addItem')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
