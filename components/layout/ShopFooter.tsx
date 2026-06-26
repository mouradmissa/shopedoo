import Link from 'next/link';
import { CreditCard, MapPin, QrCode, ShieldCheck, Truck } from 'lucide-react';
import { ShopEdooLogo } from '@/components/brand/ShopEdooLogo';

const TRUST_ITEMS = [
  { icon: MapPin, label: '24 gouvernorats couverts' },
  { icon: Truck, label: 'Livraison rapide en Tunisie' },
  { icon: CreditCard, label: 'Paiement en ligne sécurisé' },
  { icon: QrCode, label: 'Scan QR en boutique' },
] as const;

export function ShopFooter() {
  return (
    <footer className="shop-footer safe-bottom mt-auto">
      <div className="shop-footer-main border-t border-border/60">
        <div className="page-container py-10 sm:py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div className="sm:col-span-2 lg:col-span-1">
              <ShopEdooLogo variant="footer" className="mb-4" />
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                La boutique qui réunit forfaits, équipements et services — en ligne et en
                magasin, dans toute la Tunisie.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-sm uppercase tracking-wide mb-4">Boutique</h3>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <Link href="/#catalogue" className="hover:text-primary transition">
                    Catalogue produits
                  </Link>
                </li>
                <li>
                  <Link href="/cart" className="hover:text-primary transition">
                    Mon panier
                  </Link>
                </li>
                <li>
                  <Link href="/qr-scanner" className="hover:text-primary transition">
                    Scanner un QR
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-sm uppercase tracking-wide mb-4">Compte</h3>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <Link href="/auth/signin" className="hover:text-primary transition">
                    Connexion
                  </Link>
                </li>
                <li>
                  <Link href="/auth/signup" className="hover:text-primary transition">
                    Inscription gratuite
                  </Link>
                </li>
                <li>
                  <Link href="/checkout" className="hover:text-primary transition">
                    Paiement & commande
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Nos engagements
              </h3>
              <ul className="space-y-3">
                {TRUST_ITEMS.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="w-4 h-4" />
                    </span>
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} shopedoo — Tous droits réservés.</p>
            <p className="text-center sm:text-right">
              Paiement sécurisé · Disponibilité nationale · Service client réactif
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
