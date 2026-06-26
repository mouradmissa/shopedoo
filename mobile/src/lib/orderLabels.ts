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
  pending: '#b45309',
  paid: '#15803d',
  shipped: '#7c3aed',
  delivered: '#1f2937',
  cancelled: '#dc2626',
};
