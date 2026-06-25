'use client';

import Link from 'next/link';
import { Globe, Package, ShoppingBag, Users } from 'lucide-react';

const CARDS = [
  {
    href: '/online-manager/products',
    title: 'Catalogue en ligne',
    text: 'Ajoutez et gérez les produits visibles sur la boutique en ligne.',
    icon: Package,
  },
  {
    href: '/online-manager/orders',
    title: 'Commandes en ligne',
    text: 'Suivez les commandes livraison et assignez-les aux livreurs.',
    icon: ShoppingBag,
  },
  {
    href: '/online-manager/drivers',
    title: 'Livreurs',
    text: 'Consultez la liste des livreurs disponibles pour les livraisons.',
    icon: Users,
  },
] as const;

export default function OnlineManagerDashboardPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Globe className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold">Espace boutique en ligne</h1>
        </div>
        <p className="text-muted-foreground">
          Gérez le catalogue en ligne, les commandes à livrer et l&apos;affectation aux livreurs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CARDS.map(({ href, title, text, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 hover:shadow-md transition"
          >
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Icon className="w-5 h-5" />
            </div>
            <h2 className="font-bold mb-2">{title}</h2>
            <p className="text-sm text-muted-foreground">{text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
