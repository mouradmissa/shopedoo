import { buildOrderReceiptHtml, OrderReceiptData } from './orderReceipt';

/** Ouvre la boîte d'impression du navigateur pour enregistrer le reçu en PDF */
export function downloadOrderReceiptPdf(receipt: OrderReceiptData): void {
  const html = buildOrderReceiptHtml(receipt);
  const frame = document.createElement('iframe');
  frame.style.position = 'fixed';
  frame.style.right = '0';
  frame.style.bottom = '0';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = 'none';
  document.body.appendChild(frame);

  const doc = frame.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(frame);
    throw new Error('Impossible de générer le PDF.');
  }

  doc.open();
  doc.write(html);
  doc.close();

  frame.contentWindow?.focus();
  frame.contentWindow?.print();

  window.setTimeout(() => {
    document.body.removeChild(frame);
  }, 1000);
}
