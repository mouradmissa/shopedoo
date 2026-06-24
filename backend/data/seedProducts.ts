export interface SeedProductTemplate {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
}

export const SEED_PRODUCTS: SeedProductTemplate[] = [
  {
    name: 'Samsung Galaxy A15 5G',
    description: 'Smartphone 5G, écran 6.5", 128 Go, double SIM.',
    price: 899.0,
    category: 'smartphones',
    stock: 25,
  },
  {
    name: 'iPhone 15',
    description: 'Apple iPhone 15, 128 Go, caméra 48 Mpx, USB-C.',
    price: 4299.0,
    category: 'smartphones',
    stock: 10,
  },
  {
    name: 'Modem 4G Huawei B535',
    description: 'Box 4G LTE, WiFi dual-band, jusqu’à 64 appareils.',
    price: 349.0,
    category: 'modems',
    stock: 30,
  },
  {
    name: 'Clé 4G ZTE MF920',
    description: 'Modem USB portable 4G, plug & play.',
    price: 129.0,
    category: 'modems',
    stock: 40,
  },
  {
    name: 'Routeur TP-Link Archer C6',
    description: 'Routeur AC1200 dual-band, 4 ports Gigabit.',
    price: 189.0,
    category: 'routeurs',
    stock: 35,
  },
  {
    name: 'Routeur WiFi 6 Huawei AX3',
    description: 'WiFi 6, couverture jusqu’à 90 m², mesh ready.',
    price: 279.0,
    category: 'routeurs',
    stock: 20,
  },
  {
    name: 'Chargeur rapide 25W USB-C',
    description: 'Charge rapide compatible smartphones USB-C.',
    price: 45.0,
    category: 'accessoires',
    stock: 80,
  },
  {
    name: 'Écouteurs Bluetooth Shopedoo',
    description: 'Écouteurs sans fil, autonomie 24 h avec boîtier.',
    price: 79.0,
    category: 'accessoires',
    stock: 60,
  },
  {
    name: 'Carte SIM Ooredoo 4G',
    description: 'Carte SIM prépayée 4G, activation immédiate en boutique.',
    price: 5.0,
    category: 'cartes-sim',
    stock: 200,
  },
  {
    name: 'Carte SIM Orange 4G',
    description: 'Carte SIM prépayée 4G, forfait au choix.',
    price: 5.0,
    category: 'cartes-sim',
    stock: 200,
  },
  {
    name: 'eSIM Shopedoo Data 20 Go',
    description: 'eSIM data 20 Go valable 30 jours, activation QR.',
    price: 25.0,
    category: 'cartes-sim',
    stock: 100,
  },
  {
    name: 'Montre connectée Shopedoo Fit',
    description: 'Suivi activité, notifications, étanchéité IP68.',
    price: 199.0,
    category: 'objets-connectes',
    stock: 30,
  },
  {
    name: 'Caméra WiFi intérieure HD',
    description: 'Surveillance HD, vision nocturne, alertes mobile.',
    price: 149.0,
    category: 'objets-connectes',
    stock: 25,
  },
];
