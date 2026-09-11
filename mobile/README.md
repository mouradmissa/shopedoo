# Shop-Edoo Mobile

Application React Native (Expo SDK **57**) alignée sur le site web Shop-Edoo.

## Design

- Couleurs : rouge `#ff3131`, jaune offre `#f5c400`, fond blanc
- Hero, filtres catégories, cartes produits, header boutique (Accueil, Catalogue, Scanner, Panier)

## Fonctionnalités

| Zone | Contenu |
|------|---------|
| **Client** | Catalogue, détail produit + **QR**, panier, checkout, scanner QR, auth |
| **Admin** | Dashboard, boutiques, produits, commandes |
| **Manager** | Dashboard magasin, paiements, produits, caissiers |
| **Caissier** | Produits, confirmation facture QR |
| **Gestionnaire en ligne** | Catalogue, commandes livraison, livreurs |
| **Livreur** | Livraisons actives + archives |

Popup de remerciement et export PDF du reçu après checkout (comme sur le web).

## Développement (Expo Go)

```bash
cd mobile
cp .env.example .env
npm install
npm start
```

- **Android** : touche `a` ou QR Expo Go
- **iOS** : scanner le QR avec **Expo Go** (SDK 57 requis sur l'App Store)

### Configuration réseau

Dans `mobile/.env` :

```env
EXPO_PUBLIC_API_URL=http://IP_DE_VOTRE_PC:5000
```

| Appareil | URL API typique |
|----------|-----------------|
| Émulateur Android | `http://10.0.2.2:5000` |
| Simulateur iOS | `http://localhost:5000` |
| Téléphone (Wi-Fi) | `http://192.168.x.x:5000` |

Optionnel dans `mobile/.env.local` :

```env
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.x.x
```

Backend requis à la racine du projet :

```bash
npm run dev:backend
```

## Scripts utiles

```bash
npm start              # LAN, port 8081
npm run start:tunnel   # tunnel (iPhone hors LAN)
npm run start:iphone   # tunnel + cache clear
```

## Build production (EAS)

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview   # APK test
eas build -p android --profile production
eas build -p ios --profile production    # compte Apple Developer
```

Identifiants : `com.shopedoo.app` (Android & iOS).
