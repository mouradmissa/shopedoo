import { formatPrice } from './currency';
import { PAYMENT_METHOD_LABELS } from './orderLabels';

export interface ReceiptLineItem {
  name: string;
  quantity: number;
  price: number;
}

export interface OrderReceiptData {
  orderId: string;
  orderRef: string;
  customerName: string;
  customerEmail?: string;
  paymentMethod: string;
  status: string;
  shippingAddress?: string;
  createdAt: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  invoiceQrCode?: string;
  items: ReceiptLineItem[];
}

function formatReceiptDate(iso: string) {
  return new Date(iso).toLocaleString('fr-TN', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
}

export function buildOrderReceiptText(data: OrderReceiptData): string {
  const paymentLabel =
    PAYMENT_METHOD_LABELS[data.paymentMethod] ?? data.paymentMethod;
  const isPaid = data.status === 'paid';
  const lines: string[] = [
    '══════════════════════════════',
    '         SHOP-EDOO',
    '      Reçu de commande',
    '══════════════════════════════',
    '',
    `Référence : #${data.orderRef}`,
    `Date : ${formatReceiptDate(data.createdAt)}`,
    `Client : ${data.customerName}`,
  ];

  if (data.customerEmail) {
    lines.push(`Email : ${data.customerEmail}`);
  }

  lines.push(
    `Paiement : ${paymentLabel}`,
    `Statut : ${isPaid ? 'Payé' : 'En attente'}`,
    ''
  );

  if (data.shippingAddress) {
    lines.push(`Adresse : ${data.shippingAddress}`, '');
  }

  lines.push('── Articles ──', '');

  for (const item of data.items) {
    lines.push(
      `${item.name}`,
      `  ${item.quantity} × ${formatPrice(item.price)} = ${formatPrice(item.price * item.quantity)}`
    );
  }

  lines.push(
    '',
    '── Totaux ──',
    `Sous-total : ${formatPrice(data.subtotal)}`,
    `TVA (10%) : ${formatPrice(data.taxAmount)}`,
    `TOTAL TTC : ${formatPrice(data.totalAmount)}`,
    ''
  );

  if (data.invoiceQrCode) {
    lines.push(`Code facture : ${data.invoiceQrCode}`, '');
  }

  lines.push(
    isPaid
      ? 'Merci pour votre confiance !'
      : 'Merci pour votre commande Shop-Edoo.',
    '══════════════════════════════'
  );

  return lines.join('\n');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildOrderReceiptHtml(data: OrderReceiptData): string {
  const paymentLabel =
    PAYMENT_METHOD_LABELS[data.paymentMethod] ?? data.paymentMethod;
  const isPaid = data.status === 'paid';
  const statusLabel = isPaid ? 'Payé' : 'En attente';
  const statusColor = isPaid ? '#16a34a' : '#b45309';

  const itemRows = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;">${escapeHtml(item.name)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${escapeHtml(formatPrice(item.price))}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;font-weight:600;">${escapeHtml(formatPrice(item.price * item.quantity))}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Helvetica, Arial, sans-serif; color: #111; margin: 0; padding: 24px; }
    .brand { color: #ff3131; font-size: 28px; font-weight: 800; letter-spacing: 1px; }
    .subtitle { color: #666; font-size: 13px; margin-top: 4px; }
    .card { border: 1px solid #e5e5e5; border-radius: 12px; padding: 16px; margin-top: 20px; }
    .row { display: flex; justify-content: space-between; margin: 6px 0; font-size: 13px; }
    .label { color: #666; }
    .value { font-weight: 600; text-align: right; max-width: 60%; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
    th { text-align: left; color: #666; font-size: 11px; text-transform: uppercase; padding-bottom: 8px; border-bottom: 2px solid #eee; }
    .totals { margin-top: 16px; background: #f8f8f8; border-radius: 8px; padding: 12px; }
    .grand { font-size: 18px; font-weight: 800; color: #ff3131; }
    .thanks { margin-top: 24px; text-align: center; color: #444; font-size: 13px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; color: ${statusColor}; background: ${isPaid ? '#dcfce7' : '#fef3c7'}; }
  </style>
</head>
<body>
  <div class="brand">SHOP-EDOO</div>
  <div class="subtitle">Reçu de commande · Réf. #${escapeHtml(data.orderRef)}</div>

  <div class="card">
    <div class="row"><span class="label">Date</span><span class="value">${escapeHtml(formatReceiptDate(data.createdAt))}</span></div>
    <div class="row"><span class="label">Client</span><span class="value">${escapeHtml(data.customerName)}</span></div>
    ${data.customerEmail ? `<div class="row"><span class="label">Email</span><span class="value">${escapeHtml(data.customerEmail)}</span></div>` : ''}
    <div class="row"><span class="label">Paiement</span><span class="value">${escapeHtml(paymentLabel)}</span></div>
    <div class="row"><span class="label">Statut</span><span class="value"><span class="badge">${statusLabel}</span></span></div>
    ${data.shippingAddress ? `<div class="row"><span class="label">Adresse</span><span class="value">${escapeHtml(data.shippingAddress)}</span></div>` : ''}
    ${data.invoiceQrCode ? `<div class="row"><span class="label">Code facture</span><span class="value">${escapeHtml(data.invoiceQrCode)}</span></div>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>Article</th>
        <th style="text-align:center;">Qté</th>
        <th style="text-align:right;">Prix</th>
        <th style="text-align:right;">Total</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="totals">
    <div class="row"><span class="label">Sous-total</span><span class="value">${escapeHtml(formatPrice(data.subtotal))}</span></div>
    <div class="row"><span class="label">TVA (10%)</span><span class="value">${escapeHtml(formatPrice(data.taxAmount))}</span></div>
    <div class="row grand"><span>Total TTC</span><span>${escapeHtml(formatPrice(data.totalAmount))}</span></div>
  </div>

  <p class="thanks">${isPaid ? 'Merci pour votre confiance !' : 'Merci pour votre commande Shop-Edoo.'}</p>
</body>
</html>`;
}

export function getThankYouMessage(
  customerName: string,
  paymentMethod: string,
  isPaid: boolean
): { title: string; message: string } {
  const firstName = customerName.trim().split(/\s+/)[0] || 'cher client';

  if (isPaid && paymentMethod === 'online') {
    return {
      title: `Merci ${firstName} !`,
      message:
        'Votre paiement en ligne a été enregistré avec succès. Nous vous remercions chaleureusement pour votre achat chez Shop-Edoo.',
    };
  }

  if (isPaid && paymentMethod === 'cash_register') {
    return {
      title: `Merci ${firstName} !`,
      message:
        'Votre paiement en magasin a bien été encaissé. Toute l\'équipe Shop-Edoo vous remercie et vous souhaite une excellente journée !',
    };
  }

  if (paymentMethod === 'cash_register') {
    return {
      title: `Merci ${firstName} !`,
      message:
        'Votre commande est enregistrée. Présentez le QR code à la caisse pour finaliser le paiement.',
    };
  }

  if (paymentMethod === 'cash_delivery') {
    return {
      title: `Merci ${firstName} !`,
      message:
        'Votre commande est confirmée. Vous réglerez en espèces à la livraison. Merci de votre confiance !',
    };
  }

  return {
    title: `Merci ${firstName} !`,
    message: 'Votre commande Shop-Edoo a bien été enregistrée. Merci pour votre achat !',
  };
}
