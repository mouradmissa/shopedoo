export const PRODUCT_CATEGORIES = [
  'smartphones',
  'modems',
  'routeurs',
  'accessoires',
  'cartes-sim',
  'objets-connectes',
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  all: 'Tous',
  smartphones: 'Smartphones',
  modems: 'Modems',
  routeurs: 'Routeurs',
  accessoires: 'Accessoires',
  'cartes-sim': 'Cartes SIM',
  'objets-connectes': 'Objets connectés',
};

export function formatCategory(category: string) {
  return CATEGORY_LABELS[category] ?? category;
}
