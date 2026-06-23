export const TUNISIA_GOVERNORATES = [
  'Ariana',
  'Béja',
  'Ben Arous',
  'Bizerte',
  'Gabès',
  'Gafsa',
  'Jendouba',
  'Kairouan',
  'Kasserine',
  'Kébili',
  'Kef',
  'Mahdia',
  'Manouba',
  'Médenine',
  'Monastir',
  'Nabeul',
  'Sfax',
  'Sidi Bouzid',
  'Siliana',
  'Sousse',
  'Tataouine',
  'Tozeur',
  'Tunis',
  'Zaghouan',
] as const;

export type TunisiaGovernorate = (typeof TUNISIA_GOVERNORATES)[number];

const EMAIL_SLUG_OVERRIDES: Partial<Record<TunisiaGovernorate, string>> = {
  Tataouine: 'tataouin',
};

/** Slug email : ahmed.gerant.{slug}@shopedoo.com */
export function governorateToEmailSlug(governorate: string): string {
  const override = EMAIL_SLUG_OVERRIDES[governorate as TunisiaGovernorate];
  if (override) return override;

  return governorate
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

export function managerEmailForGovernorate(governorate: string): string {
  return `ahmed.gerant.${governorateToEmailSlug(governorate)}@shopedoo.com`;
}

export function storeNameForGovernorate(governorate: string): string {
  return `shopedoo ${governorate}`;
}

export function storeAddressForGovernorate(governorate: string): string {
  return `Avenue Habib Bourguiba, ${governorate}`;
}

/** Prénoms des caissiers filler par boutique */
export const CASHIER_FILLER_NAMES = ['siwar', 'amira'] as const;

export function cashierEmailForGovernorate(firstName: string, governorate: string): string {
  const slug = firstName.toLowerCase().replace(/[^a-z]/g, '');
  return `${slug}.caissier.${governorateToEmailSlug(governorate)}@shopedoo.com`;
}

export function cashierDisplayName(firstName: string, governorate: string): string {
  const label = firstName.charAt(0).toUpperCase() + firstName.slice(1);
  return `${label} Caissier ${governorate}`;
}
