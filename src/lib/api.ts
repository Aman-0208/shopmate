import { InventoryItem, Bill } from '@/types/inventory';

const BASE = '/api';

// ─── Generic fetch helper ─────────────────────────────────────────────────────
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    headers: { ...headers, ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ─── Adapter: MongoDB doc → InventoryItem ─────────────────────────────────────
// MongoDB uses _id; our frontend uses id
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptItem(doc: any): InventoryItem {
  return {
    ...doc,
    id: doc._id ?? doc.id,
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc.updatedAt),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptBill(doc: any): Bill {
  return {
    ...doc,
    id: doc._id ?? doc.id,
    createdAt: new Date(doc.createdAt),
    items: (doc.items ?? []).map((ci: any) => ({
      quantity: ci.quantity,
      item: {
        id: ci.itemId ?? ci._id ?? '',
        name: ci.name,
        sku: ci.sku ?? '',
        hsn: ci.hsn ?? '',
        category: '',
        price: ci.price,
        quantity: 0,
        minStock: 0,
        unit: ci.unit ?? 'pcs',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })),
  };
}

// ─── Items API ────────────────────────────────────────────────────────────────
export const itemsApi = {
  getAll: () =>
    request<unknown[]>('/items').then((docs) => docs.map(adaptItem)),

  create: (data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) =>
    request<unknown>('/items', {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(adaptItem),

  update: (id: string, data: Partial<InventoryItem>) =>
    request<unknown>(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }).then(adaptItem),

  delete: (id: string) =>
    request<{ message: string }>(`/items/${id}`, { method: 'DELETE' }),
};

// ─── Bills API ────────────────────────────────────────────────────────────────
export interface SalePayload {
  cart: Array<{
    itemId: string;
    name: string;
    sku: string;
    hsn: string;
    price: number;
    quantity: number;
    unit: string;
  }>;
  customerName?: string;
  customerGstin?: string;
  customerBank?: string;
  customerAccountNo?: string;
  customerIfsc?: string;
}

export const billsApi = {
  getAll: () =>
    request<unknown[]>('/bills').then((docs) => docs.map(adaptBill)),

  create: (payload: SalePayload) =>
    request<unknown>('/bills', {
      method: 'POST',
      body: JSON.stringify(payload),
    }).then(adaptBill),

  delete: (id: string) =>
    request<{ message: string }>(`/bills/${id}`, { method: 'DELETE' }),

  /** Triggers a PDF download of the last 30 days of bills */
  downloadMonthly: async () => {
    const res = await fetch(`${BASE}/bills/download/monthly`);
    if (!res.ok) throw new Error('Failed to generate PDF');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billing-report-${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
