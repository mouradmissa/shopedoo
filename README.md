# Shop-Edoo — Plateforme e-commerce

Plateforme e-commerce full-stack avec boutique web, API Express, application mobile Expo et gestion multi-rôles (admin, manager, caissier, livreur). Paiements Stripe, codes QR produits et factures, panier et checkout.

## Vue d'ensemble

| Composant | Stack |
|-----------|--------|
| **Web** | Next.js 16, React 19, Tailwind CSS v4, ShadCN |
| **Backend** | Node.js, Express 5, MongoDB, Mongoose, JWT |
| **Mobile** | Expo SDK 57, React Native, React Navigation |
| **Paiements** | Stripe (web + mobile) |

## Fonctionnalités

### Client (web & mobile)
- Authentification (inscription / connexion)
- Catalogue, filtres, détail produit avec **code QR**
- Panier, checkout (3 modes de paiement)
- Scanner QR pour ajouter un produit au panier
- Popup de remerciement + reçu PDF après commande

### Rôles métier
- **Admin** — boutiques, produits, commandes, utilisateurs
- **Manager magasin** — produits, commandes, caissiers, paiements
- **Caissier** — produits, scan facture QR
- **Gestionnaire en ligne** — catalogue, commandes livraison, livreurs
- **Livreur** — livraisons actives et archives

## Prérequis

- Node.js **≥ 20.15** (recommandé ≥ 20.19 pour Expo SDK 57)
- MongoDB Atlas (ou instance locale)
- Compte Stripe (mode test en développement)
- `npm` ou `pnpm`

## Installation

### 1. Cloner et installer

```bash
git clone https://github.com/mouradmissa/shopedoo.git
cd shopedoo
npm install
cd mobile && npm install && cd ..
```

### 2. Variables d'environnement

**Racine — `.env.local`**

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Backend — `backend/.env`**

```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/shopedoo
JWT_SECRET=votre_secret_jwt_min_32_caracteres
NODE_ENV=development
PORT=5000
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3000
```

**Mobile — `mobile/.env`** (copier depuis `mobile/.env.example`)

```env
EXPO_PUBLIC_API_URL=http://IP_DE_VOTRE_PC:5000
```

Pour un iPhone sur le même Wi-Fi, utilisez l'IP locale du PC (ex. `192.168.0.243`).  
Optionnel : `mobile/.env.local` avec `REACT_NATIVE_PACKAGER_HOSTNAME=IP_DE_VOTRE_PC`.

### 3. Lancer l'application

**Backend seul**

```bash
npm run dev:backend
```

**Web seul** (port 3000)

```bash
npm run dev
```

**Web + backend**

```bash
npm run dev:all
```

**Mobile** (Expo Go, port 8081)

```bash
npm run dev:mobile
# ou : cd mobile && npm start
```

URLs locales :
- Web : http://localhost:3000
- API : http://localhost:5000/api
- Santé : http://localhost:5000/health

## Structure du projet

```
shop-edoo/
├── app/                    # Pages Next.js (boutique, admin, manager, caissier…)
├── components/             # Composants UI et métier (web)
├── lib/                    # Client API, utilitaires
├── backend/
│   ├── server.ts
│   ├── routes/             # auth, products, cart, orders, payment…
│   ├── models/
│   └── utils/              # JWT, QR produits, images…
├── mobile/
│   ├── src/screens/        # Écrans par rôle
│   ├── src/components/     # ProductDetailView, ProductQrDisplay…
│   └── app.json            # Expo SDK 57
└── package.json
```

Documentation complémentaire :
- [Backend](backend/README.md)
- [Mobile](mobile/README.md)
- [API](backend/API_DOCUMENTATION.md)

## API (aperçu)

| Domaine | Exemples |
|---------|----------|
| Auth | `POST /api/auth/signup`, `POST /api/auth/signin`, `GET /api/auth/me` |
| Produits | `GET /api/products`, `GET /api/products/:id` (inclut QR), `GET /api/products/qr/:qrCode` |
| Panier | `GET /api/cart`, `POST /api/cart/add` |
| Commandes | `POST /api/orders/checkout`, `GET /api/orders` |
| Paiement | `POST /api/payment/create-payment-intent` |

## Déploiement

| Service | Hébergement suggéré |
|---------|---------------------|
| Frontend Next.js | Vercel |
| API Express | Render, Railway |
| MongoDB | MongoDB Atlas |

Sur Render, définir `MONGODB_URI`, `JWT_SECRET`, `STRIPE_*` et `FRONTEND_URL` dans les variables d'environnement (ne jamais committer les fichiers `.env`).

Build backend :

```bash
npm run build:api
npm run start:api
```

## Dépannage

**Backend ne démarre pas** — vérifier `MONGODB_URI`, `JWT_SECRET`, port 5000 libre.

**Mobile ne joint pas l'API** — même réseau Wi-Fi, IP correcte dans `EXPO_PUBLIC_API_URL`, backend sur `0.0.0.0:5000`.

**Expo Go (iPhone)** — projet en SDK 57 ; mettre à jour Expo Go depuis l'App Store.

**QR produit absent** — le détail produit charge `qrCode`, `qrCodeImage` et `qrCodePayload` depuis l'API ; le backend génère le QR via `ensureProductQr`.

## Licence

MIT
