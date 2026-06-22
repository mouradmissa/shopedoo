export const INVOICE_QR_PREFIX = 'SHOPEDOO:';

export interface InvoiceQrPayload {
  v: 1;
  orderId: string;
  ref: string;
  customer: string;
  email?: string;
  items: [string, number, number][];
  subtotal: number;
  tax: number;
  total: number;
  pm: string;
  at?: string;
  status: 'pending' | 'paid';
}

export function parseInvoiceQr(raw: string): InvoiceQrPayload | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith(INVOICE_QR_PREFIX)) return null;

  try {
    const parsed = JSON.parse(trimmed.slice(INVOICE_QR_PREFIX.length)) as InvoiceQrPayload;
    if (parsed.v !== 1 || !parsed.orderId || !parsed.ref || !Array.isArray(parsed.items)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export interface CashierInvoiceView {
  _id: string;
  invoiceQrCode: string;
  status: string;
  paymentMethod: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  createdAt: string;
  userId: { name: string; email: string };
  items: Array<{
    productId: { name: string };
    quantity: number;
    price: number;
  }>;
  fromQr: true;
}

export function buildInvoiceQrString(
  order: {
    _id: string;
    invoiceQrCode: string;
    subtotal?: number;
    taxAmount?: number;
    totalAmount: number;
    paymentMethod: string;
    status: string;
    createdAt?: string;
  },
  customer: { name: string; email?: string },
  items: Array<{ name: string; quantity: number; price: number }>
): string {
  const payload: InvoiceQrPayload = {
    v: 1,
    orderId: order._id,
    ref: order.invoiceQrCode,
    customer: customer.name,
    email: customer.email,
    items: items.map((item) => [item.name, item.quantity, item.price]),
    subtotal: order.subtotal ?? 0,
    tax: order.taxAmount ?? 0,
    total: order.totalAmount,
    pm: order.paymentMethod,
    at: order.createdAt ?? new Date().toISOString(),
    status: order.status === 'paid' ? 'paid' : 'pending',
  };
  return `${INVOICE_QR_PREFIX}${JSON.stringify(payload)}`;
}

export function qrPayloadToCashierView(payload: InvoiceQrPayload): CashierInvoiceView {
  return {
    _id: payload.orderId,
    invoiceQrCode: payload.ref,
    status: payload.status,
    paymentMethod: payload.pm,
    subtotal: payload.subtotal,
    taxAmount: payload.tax,
    totalAmount: payload.total,
    createdAt: payload.at ?? new Date().toISOString(),
    userId: { name: payload.customer, email: payload.email ?? '' },
    items: payload.items.map(([name, quantity, price]) => ({
      productId: { name },
      quantity,
      price,
    })),
    fromQr: true,
  };
}
