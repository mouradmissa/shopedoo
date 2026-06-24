export const ORDER_STATUS_LABELS: Record<string, string> = {
  all: 'Toutes',
  pending: 'En attente',
  paid: 'Payée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash_register: 'Paiement en boutique',
  cash_delivery: 'Espèces à la livraison',
  online: 'Carte en ligne',
  cash: 'Espèces',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-700',
  paid: 'bg-green-500/10 text-green-700',
  shipped: 'bg-purple-500/10 text-purple-700',
  delivered: 'bg-blue-500/10 text-blue-700',
  cancelled: 'bg-red-500/10 text-red-600',
};
