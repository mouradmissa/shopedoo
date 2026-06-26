'use client';

import { useState } from 'react';
import { CheckCircle2, Download, Heart, Loader2, X } from 'lucide-react';
import { formatPrice } from '@/lib/currency';
import { downloadOrderReceiptPdf } from '@/lib/downloadOrderReceiptPdf';
import { getThankYouMessage, OrderReceiptData } from '@/lib/orderReceipt';

interface Props {
  open: boolean;
  receipt: OrderReceiptData;
  onClose: () => void;
}

export function OrderThankYouModal({ open, receipt, onClose }: Props) {
  const [downloading, setDownloading] = useState(false);
  const isPaid = receipt.status === 'paid';
  const { title, message } = getThankYouMessage(
    receipt.customerName,
    receipt.paymentMethod,
    isPaid
  );

  if (!open) return null;

  const handleDownloadPdf = () => {
    setDownloading(true);
    try {
      downloadOrderReceiptPdf(receipt);
    } catch {
      alert('Impossible de générer le PDF.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="thank-you-title"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <div className="relative bg-gradient-to-b from-primary/10 to-card px-6 pb-6 pt-8 text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full p-2 text-muted-foreground hover:bg-muted/60 transition"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-background">
            {isPaid ? (
              <CheckCircle2 className="h-9 w-9 text-green-600" />
            ) : (
              <Heart className="h-9 w-9 text-primary" />
            )}
          </div>

          <h2 id="thank-you-title" className="text-2xl font-extrabold">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{message}</p>
        </div>

        <div className="space-y-3 border-t border-border p-5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Commande</span>
            <span className="font-bold">#{receipt.orderRef}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="text-lg font-extrabold text-primary">
              {formatPrice(receipt.totalAmount)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Statut</span>
            <span className={`font-bold ${isPaid ? 'text-green-700' : 'text-amber-700'}`}>
              {isPaid ? 'Payé' : 'En attente'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="mt-2 flex w-full min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Télécharger le reçu (PDF)
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition"
          >
            Continuer
          </button>
        </div>
      </div>
    </div>
  );
}
