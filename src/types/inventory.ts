export type Unit = string;

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  hsn: string;
  category: string;
  price: number;
  quantity: number;
  minStock: number;
  unit: Unit;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  item: InventoryItem;
  quantity: number;
}

export interface Bill {
  id: string;
  items: CartItem[];
  total: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
  createdAt: Date;
  customerName?: string;
  customerGstin?: string;
  customerBank?: string;
  customerAccountNo?: string;
  customerIfsc?: string;
}
