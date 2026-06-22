'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Package, ScanLine, ArrowRight } from 'lucide-react';

export default function CaissierHomePage() {
  const { user } = useAuth();

  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">
      <div className="bg-card border border-border rounded-2xl p-6">
        <p className="text-muted-foreground text-sm">Bienvenue</p>
        <h1 className="text-2xl font-bold mt-1">{user?.name}</h1>
        <p className="text-muted-foreground text-sm mt-2">
          Espace caissier — consultez les stocks et encaissez les factures QR.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/caissier/scan"
          className="flex items-center gap-4 p-5 bg-primary text-primary-foreground hover:opacity-90 rounded-2xl transition group shadow-sm"
        >
          <div className="w-12 h-12 bg-primary-foreground/20 rounded-xl flex items-center justify-center shrink-0">
            <ScanLine className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg">Scanner une facture</h2>
            <p className="text-sm opacity-90 mt-0.5">
              Lisez le QR sur le téléphone du client et encaissez le paiement.
            </p>
          </div>
          <ArrowRight className="w-5 h-5 opacity-70 group-hover:translate-x-0.5 transition" />
        </Link>

        <Link
          href="/caissier/produits"
          className="flex items-center gap-4 p-5 bg-card border border-border hover:border-primary/40 rounded-2xl transition group shadow-sm"
        >
          <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center shrink-0">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg">Voir les produits</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Consultez le catalogue et la disponibilité en stock.
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-0.5 transition" />
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground space-y-2">
        <p className="font-medium text-foreground">Rappel</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Vous n&apos;avez pas accès à la boutique client ni au panier.</li>
          <li>Seules les commandes « paiement à la caisse » génèrent un QR facture.</li>
          <li>Après scan, vérifiez le montant puis appuyez sur Encaisser.</li>
        </ul>
      </div>
    </div>
  );
}
