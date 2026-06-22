'use client';

import {
  Banknote,
  Calendar,
  CheckCircle2,
  Loader2,
  ScanLine,
  User,
} from 'lucide-react';
import { formatPrice } from '@/lib/currency';
import type { CashierInvoiceView } from '@/lib/invoiceQr';
import { ShopEdooLogo } from '@/components/brand/ShopEdooLogo';

function paymentLabel(method: string) {
  if (method === 'cash_register') return 'Paiement à la caisse';
  if (method === 'cash_delivery') return 'Espèce à la livraison';
  if (method === 'online') return 'Paiement en ligne';
  return method;
}

function formatInvoiceDate(iso: string) {
  return new Date(iso).toLocaleString('fr-TN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

interface CashierInvoiceDisplayProps {
  invoice: CashierInvoiceView;
  confirmed: boolean;
  error?: string;
  isConfirming: boolean;
  onConfirm: () => void;
  onScanNext: () => void;
}

export function CashierInvoiceDisplay({
  invoice,
  confirmed,
  error,
  isConfirming,
  onConfirm,
  onScanNext,
}: CashierInvoiceDisplayProps) {
  const isPaid = invoice.status === 'paid' || confirmed;
  const itemCount = invoice.items.reduce((sum, i) => sum + i.quantity, 0);
  const orderRef = invoice._id.slice(-8).toUpperCase();

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {confirmed && (
        <div className="shrink-0 flex items-center gap-3 px-4 sm:px-6 py-3 bg-green-500/15 border-b border-green-500/25 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
          <div>
            <p className="font-semibold text-green-800">Paiement confirmé</p>
            <p className="text-xs text-green-700">La commande est enregistrée comme payée.</p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-lg mx-auto space-y-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
              {error}
            </p>
          )}

          {/* Montant à encaisser — mise en avant */}
          {!isPaid && (
            <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/85 text-primary-foreground p-6 text-center shadow-lg">
              <p className="text-sm font-medium opacity-90 uppercase tracking-wide">
                Montant à encaisser
              </p>
              <p className="text-3xl sm:text-4xl font-bold mt-2 tabular-nums">
                {formatPrice(invoice.totalAmount)}
              </p>
              <p className="text-xs opacity-80 mt-2">
                {itemCount} article{itemCount !== 1 ? 's' : ''} · Facture #{orderRef}
              </p>
            </div>
          )}

          {/* Facture détaillée */}
          <article className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/40">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ShopEdooLogo height={44} />
                  <div>
                    <p className="text-xs text-muted-foreground font-mono">#{orderRef}</p>
                  </div>
                </div>
                <span
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold ${
                    isPaid
                      ? 'bg-green-500/15 text-green-700 border border-green-500/30'
                      : 'bg-amber-500/15 text-amber-800 border border-amber-500/30'
                  }`}
                >
                  {isPaid ? 'PAYÉE' : 'EN ATTENTE'}
                </span>
              </div>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex gap-3 p-3 rounded-xl bg-muted/50 border border-border/60">
                  <User className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Client</p>
                    <p className="font-semibold truncate">{invoice.userId.name}</p>
                    {invoice.userId.email && (
                      <p className="text-xs text-muted-foreground truncate">{invoice.userId.email}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 p-3 rounded-xl bg-muted/50 border border-border/60">
                  <Calendar className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-medium text-sm">{formatInvoiceDate(invoice.createdAt)}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                  <Banknote className="w-3.5 h-3.5" />
                  {paymentLabel(invoice.paymentMethod)}
                </span>
                <span className="text-xs font-mono text-muted-foreground px-2.5 py-1 rounded-full bg-muted border border-border">
                  {invoice.invoiceQrCode}
                </span>
              </div>

              <div className="border-t border-dashed border-border pt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Détail des articles
                  </p>
                  <p className="text-xs text-muted-foreground">{itemCount} unité{itemCount !== 1 ? 's' : ''}</p>
                </div>

                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="hidden sm:grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-2 bg-muted/60 text-xs font-semibold text-muted-foreground border-b border-border">
                    <span>Produit</span>
                    <span className="w-16 text-center">Qté</span>
                    <span className="w-28 text-right">Total</span>
                  </div>
                  <ul className="divide-y divide-border">
                    {invoice.items.map((item, i) => (
                      <li
                        key={i}
                        className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-1 sm:gap-2 px-3 py-3 sm:items-center hover:bg-muted/30 transition"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-sm leading-snug">{item.productId.name}</p>
                          <p className="text-xs text-muted-foreground sm:hidden">
                            {item.quantity} × {formatPrice(item.price)}
                          </p>
                          <p className="text-xs text-muted-foreground hidden sm:block">
                            {formatPrice(item.price)} / unité
                          </p>
                        </div>
                        <span className="hidden sm:block w-16 text-center text-sm font-medium tabular-nums">
                          {item.quantity}
                        </span>
                        <span className="font-semibold text-sm text-right tabular-nums sm:w-28">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-xl bg-muted/40 border border-border p-4 space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Sous-total</span>
                  <span className="tabular-nums">{formatPrice(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>TVA (10%)</span>
                  <span className="tabular-nums">{formatPrice(invoice.taxAmount)}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-border">
                  <span className="font-bold text-base">Total TTC</span>
                  <span className="font-bold text-xl text-primary tabular-nums">
                    {formatPrice(invoice.totalAmount)}
                  </span>
                </div>
              </div>

              {isPaid && (
                <div className="flex items-center justify-center gap-2 py-2 text-green-700 text-sm font-medium">
                  <CheckCircle2 className="w-5 h-5" />
                  Transaction terminée
                </div>
              )}

              <p className="text-[11px] text-center text-muted-foreground">
                Données lues depuis le QR du téléphone client
              </p>
            </div>
          </article>
        </div>
      </div>

      <div className="shrink-0 p-4 sm:p-6 border-t border-border bg-background/95 backdrop-blur space-y-3">
        {!isPaid && (
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className="w-full max-w-lg mx-auto flex py-4 bg-green-600 hover:bg-green-500 text-white disabled:opacity-50 rounded-xl font-bold text-lg items-center justify-center gap-2 transition shadow-md shadow-green-600/20"
          >
            {isConfirming ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Validation en cours...
              </>
            ) : (
              <>
                <Banknote className="w-6 h-6" />
                Confirmer l&apos;encaissement · {formatPrice(invoice.totalAmount)}
              </>
            )}
          </button>
        )}
        <button
          type="button"
          onClick={onScanNext}
          className="w-full max-w-lg mx-auto flex py-3 border border-border hover:bg-muted rounded-xl font-semibold items-center justify-center gap-2 transition"
        >
          <ScanLine className="w-5 h-5" />
          Scanner un autre client
        </button>
      </div>
    </div>
  );
}
