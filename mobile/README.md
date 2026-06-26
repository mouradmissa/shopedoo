# Shop-Edoo Mobile

Application React Native (Expo) avec le **même design et les mêmes fonctionnalités** que le site web Shop-Edoo.

## Design aligné sur le web

- Couleurs : rouge `#ff3131`, jaune offre `#f5c400`, fond blanc
- Logo Shop-Edoo officiel
- Hero avec dégradé, statistiques, cartes fonctionnalités
- Bannière offre limitée
- Filtres catégories en pilules
- Cartes produits avec stock, disponibilité par gouvernorat
- Header boutique identique (Accueil, Catalogue, Scanner, Panier)
- Footer avec liens et engagements

## Fonctionnalités

| Zone | Fonctionnalités |
|------|-----------------|
| **Client** | Catalogue, détail produit, panier, checkout (3 paiements), QR scanner, auth |
| **Admin** | Dashboard, boutiques, produits, commandes |
| **Manager** | Dashboard magasin, paiements, produits |
| **Caissier** | Accueil, produits, confirmation facture QR |
| **Gestionnaire en ligne** | Catalogue, commandes livraison, livreurs |
| **Livreur** | Livraisons actives + archives |

## Android & iOS

### Développement (Expo Go)

```bash
cd mobile
cp .env.example .env
npm install
npm start
```

- Android : appuyez sur `a` ou scannez le QR avec Expo Go
- iOS : scannez le QR avec l'app **Expo Go** (iPhone)

Configurez `EXPO_PUBLIC_API_URL` :
- Émulateur Android : `http://10.0.2.2:5000`
- iPhone physique : `http://IP_DE_VOTRE_PC:5000`

### Build production (APK / IPA)

Installez EAS CLI puis construisez :

```bash
npm install -g eas-cli
eas login
eas build:configure
```

**Android (APK test)** :
```bash
eas build -p android --profile preview
```

**Android (Play Store)** :
```bash
eas build -p android --profile production
```

**iOS (App Store)** — nécessite un compte Apple Developer :
```bash
eas build -p ios --profile production
```

Identifiants configurés :
- Android : `com.shopedoo.app`
- iOS : `com.shopedoo.app`

## Backend requis

```bash
# À la racine du projet
npm run dev:backend
```

L'app mobile utilise la même API Express que le site web.
