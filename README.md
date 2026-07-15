# Maktaba Gestion — Cloudflare/D1

Application française de gestion cash-only pour une papeterie mono-boutique. Architecture : Next.js App Router, OpenNext Cloudflare Workers, Cloudflare D1, Drizzle ORM, Better Auth, PWA et ZXing. Les montants sont des centimes entiers. Les seuls modes de vente sont `cash`, `credit` et `partial_cash_credit`.

## Installation locale

```powershell
npm install
Copy-Item .dev.vars.example .dev.vars
# Remplacer les placeholders de .dev.vars par un secret local fort
npm run cf-typegen
npm run db:migrate:local
npm run db:seed:local
```

Créer une seule fois le premier administrateur global (aucun mot de passe par défaut) :

```powershell
$env:OWNER_NAME='Nom du propriétaire'
$env:OWNER_EMAIL='proprietaire@example.ma'
$env:OWNER_PASSWORD='REMPLACEZ_PAR_UN_SECRET_FORT_UNIQUE'
npm run onboard:owner
```

Le mot de passe exige 12 caractères, une majuscule, une minuscule et un chiffre. Le script refuse une adresse dupliquée et un second administrateur global, initialise les paramètres/la séquence barcode et ne journalise jamais le secret. Ajouter `$env:OWNER_REMOTE='1'` pour cibler D1 distant.

## Développement et vérification

```powershell
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

## Routes fonctionnelles

- Authentification : `/login`, `/api/auth/[...all]`
- Tableaux de bord : `/dashboard`, `/dashboard/admin`, `/dashboard/admin/backup`
- Employés : `/dashboard/workers`, `/dashboard/workers/new`, `/dashboard/workers/[id]`, `/dashboard/workers/[id]/edit`, `/dashboard/workers/[id]/activity`
- Produits : `/dashboard/products`, `/dashboard/products/new`, `/dashboard/products/[id]`, `/dashboard/products/[id]/edit`, `/dashboard/products/[id]/label`
- Catégories : `/dashboard/categories`, `/dashboard/categories/new`, `/dashboard/categories/[id]/edit`
- POS/ventes : `/dashboard/pos`, `/dashboard/sales`, `/dashboard/sales/[id]/receipt`, `/dashboard/sales/[id]/return`
- Stock : `/dashboard/stock`, `/dashboard/stock/adjust`, `/dashboard/stock/history`, `/dashboard/stock/inventory`, `/dashboard/stock/inventory/scan`
- Clients/crédit : `/dashboard/customers`
- Fournisseurs : `/dashboard/suppliers`, `/dashboard/suppliers/[id]`, `/dashboard/suppliers/[id]/payment`
- Achats : `/dashboard/purchases` (panier multi-lignes)
- Trésorerie : `/dashboard/expenses`, `/dashboard/registers`, `/dashboard/registers/[id]`, `/dashboard/registers/[id]/closing-report`
- Contrôle : `/dashboard/reports`, `/dashboard/audit`, `/dashboard/settings`
- CSV : `/api/export/[entity]` pour les 19 jeux proposés par `/dashboard/admin/backup`

Le POS conserve le panier dans le navigateur, prend les scanners USB et la caméra iPhone/Android. L’inventaire mobile accepte caméra, USB et saisie manuelle. Les flux vente, retour, achat, paiement fournisseur, paiement client, dépense, stock et caisse utilisent des lots D1 et écrivent les mouvements/audits associés.

## Migrations et données

```powershell
npm run db:generate
npm run db:migrate:local
npm run db:seed:local
npm run db:migrate:remote
npm run db:seed:remote
```

Les migrations incrémentales sont `0001_worker_operations.sql` (employés, permissions, prix, paiements fournisseurs, inventaires et index) et `0002_daily_closing_sessions.sql` (clôture unique par session de caisse).

## Déploiement Cloudflare

```powershell
npx wrangler d1 create stationery-db
# Copier le database_id retourné dans wrangler.jsonc
npm run db:migrate:remote
npm run db:seed:remote
npx wrangler secret put BETTER_AUTH_SECRET
$env:OWNER_NAME='Nom du propriétaire'
$env:OWNER_EMAIL='proprietaire@example.ma'
$env:OWNER_PASSWORD='REMPLACEZ_PAR_UN_SECRET_FORT_UNIQUE'
$env:OWNER_REMOTE='1'
npm run onboard:owner
npm run deploy
```

Configurer `BETTER_AUTH_URL` avec l’URL HTTPS finale du Worker. Aucun Supabase, PostgreSQL, Neon, Vercel, stockage externe ou paiement électronique n’est utilisé.

Documentation complémentaire : [architecture](docs/ARCHITECTURE.md), [base D1](docs/DATABASE.md), [sécurité](docs/SECURITY.md), [déploiement](docs/DEPLOYMENT.md), [POS](docs/POS_WORKFLOW.md), [stock](docs/STOCK_SYSTEM.md), [crédit](docs/CREDIT_SYSTEM.md) et [barcodes](docs/BARCODE_SYSTEM.md).
