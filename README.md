# MeetInfluencers App

Application web pour détecter et analyser les partenariats Instagram des influenceurs algériens.

## Stack Technique

- **TypeScript** - Type safety et meilleure DX
- **React 19** - Framework UI moderne
- **TanStack Router** - Routing file-based avec type safety
- **TanStack Query** - Data fetching & caching
- **TanStack Table** - Tables interactives avec filtres
- **Tailwind CSS v4** + **shadcn/ui** - Composants UI modernes
- **Hono** - Framework serveur léger et performant
- **tRPC** - APIs end-to-end type-safe
- **Bun** - Runtime JavaScript rapide
- **Drizzle ORM** - ORM TypeScript-first
- **SQLite (libSQL)** - Base de données locale
- **Better Auth** - Authentification moderne
- **Turborepo** - Monorepo optimisé

## Installation

### 1. Lier instaloader-ts

**Important** : Ce projet dépend de `instaloader-ts`, un repo git séparé situé dans `../instaloader-ts/`.

```bash
# Depuis la racine du projet (meetinfluencers/)
cd ../instaloader-ts
bun install
bun link

# Retourner dans app/
cd ../meetinfluencers/app
```

### 2. Installer les dépendances

```bash
bun install
```

Bun va automatiquement utiliser le lien créé pour `instaloader-ts`.

**Note** : Si vous supprimez `node_modules` ou réinstallez les dépendances, vous devrez re-lier :
```bash
bun link instaloader-ts
```

### 3. Configuration

Créer un fichier `.env` dans `apps/server/`:

```env
# Database
DATABASE_URL=file:./local.db

# Auth
BETTER_AUTH_SECRET=your-secret-key-here-minimum-32-chars
BETTER_AUTH_URL=http://localhost:3000

# CORS
CORS_ORIGIN=http://localhost:5173

# Python Scraper API (optionnel)
PYTHON_API_URL=http://localhost:8083
```

### 4. Initialiser la base de données

```bash
bun run db:push
```

### 5. Lancer l'application

```bash
bun run dev
```

- **Frontend**: http://localhost:3001
- **Backend**: http://localhost:3000

## Structure du Projet

```
app/
├── apps/
│   ├── web/              # Frontend React
│   │   ├── src/
│   │   │   ├── routes/   # Pages (TanStack Router)
│   │   │   ├── components/
│   │   │   ├── lib/
│   │   │   └── utils/
│   │   └── public/
│   │
│   └── server/           # Backend Hono + tRPC
│       ├── src/
│       │   ├── index.ts  # Point d'entrée serveur
│       │   └── server.ts
│       └── .env
│
├── packages/
│   ├── api/              # Routers tRPC
│   │   └── src/
│   │       ├── routers/
│   │       │   ├── influencer.ts
│   │       │   ├── post.ts
│   │       │   ├── scrape.ts
│   │       │   └── scrapeLog.ts
│   │       ├── services/
│   │       ├── context.ts
│   │       └── index.ts
│   │
│   ├── db/               # Schema Drizzle
│   │   └── src/
│   │       ├── schema/
│   │       │   ├── auth.ts
│   │       │   └── influencer.ts
│   │       └── index.ts
│   │
│   ├── auth/             # Configuration Better Auth
│   ├── config/           # Configuration partagée
│   └── env/              # Variables d'environnement
```

## Schéma de Base de Données

### Influencer
- `id`, `username`, `fullName`, `bio`
- `followers`, `following`, `postsCount`
- `profilePicUrl`, `isVerified`, `isBusiness`
- `createdAt`, `updatedAt`

### Post
- `id`, `influencerId`, `shortcode`, `url`
- `caption`, `date`, `isVideo`
- `taggedUsers` (JSON array)
- `captionMentions` (JSON array)
- `coauthors` (JSON array)
- `isSponsored` (boolean)
- `sponsorUsers` (JSON array)
- `createdAt`

### ScrapeLog
- `id`, `influencerId`
- `scrapedAt`, `dateFrom`, `dateTo`
- `postsCount`, `status`, `errorMessage`

## Scripts Disponibles

### Développement
```bash
bun run dev              # Lancer tous les services
bun run dev:web          # Frontend uniquement
bun run dev:server       # Backend uniquement
```

### Build & Types
```bash
bun run build            # Build tous les packages
bun run check-types      # Vérifier TypeScript
```

### Database
```bash
bun run db:push          # Appliquer le schema
bun run db:studio        # Ouvrir Drizzle Studio
bun run db:generate      # Générer les migrations
```

## Fonctionnalités

### Dashboard (`/`)
- Vue d'ensemble avec statistiques globales
- Liste des derniers scrapes
- Graphiques de performance

### Influencers (`/influencers`)
- Liste de tous les influenceurs scrapés
- Recherche et filtres
- Statistiques par influenceur

### Détail Influenceur (`/influencers/:id`)
- Profil complet avec avatar, bio, stats
- **Tableau d'analyse des partenariats** avec:
  - Statistiques (posts, mentions, coauteurs, tagués, sponsorisés)
  - Recherche globale dans les posts
  - Filtre par statut (Sponsorisé/Organique)
  - Colonnes: Date, Post, Caption, Mentions, Coauteurs, Tagués, Statut
  - Tri par date
  - Pagination (20 posts/page)

### Scrape (`/scrape`)
- Formulaire pour scraper un nouveau profil
- Logs en temps réel (SSE)
- Options: username, dates, session Instagram

## Détection des Partenariats

L'application détecte automatiquement les partenariats via:

1. **Label Instagram officiel** (`isSponsored`)
2. **Hashtags**: #pub, #ad, #sponsored, #partenariat, #collab
3. **Mentions**: @marques dans les captions
4. **Users tagués**: Marques identifiées dans les photos

## Technologies Clés

### Frontend
- **TanStack Table 8** - Tables complexes avec filtres, tri, pagination
- **date-fns** - Manipulation de dates
- **Radix UI** - Composants accessibles (Popover, Slider, Select)
- **Lucide Icons** - Icônes modernes

### Backend
- **Hono tRPC Adapter** - Intégration tRPC dans Hono
- **Better Auth** - Authentification avec session cookies
- **Drizzle ORM** - Queries type-safe
- **libSQL Client** - Driver SQLite moderne

### Infrastructure
- **Turborepo** - Build system optimisé avec cache
- **Bun** - Runtime rapide, package manager, bundler
- **TypeScript 5.8** - Strict mode activé

## Architecture tRPC

```typescript
// Routers disponibles
trpc.influencer.list()
trpc.influencer.get({ id })
trpc.post.list({ influencerId?, limit, offset })
trpc.post.get({ id })
trpc.scrapeLog.list({ influencerId? })
trpc.scrape.start({ username, dateFrom?, dateTo?, sessionUsername? })
```

Tous les routers utilisent `protectedProcedure` (authentification requise).

## Dépendances Principales

```json
{
  "@tanstack/react-table": "^8.21.3",
  "@tanstack/react-router": "^1.103.3",
  "@tanstack/react-query": "^6.2.1",
  "@trpc/server": "11.x",
  "@trpc/client": "11.x",
  "hono": "^4.6.18",
  "drizzle-orm": "^0.39.4",
  "better-auth": "^2.0.4",
  "date-fns": "^4.1.0"
}
```

## Déploiement

1. Build de production:
```bash
bun run build
```

2. Lancer le serveur:
```bash
cd apps/server
bun run src/server.ts
```

3. Variables d'environnement à configurer:
   - `DATABASE_URL` - Chemin vers SQLite (ou URL Turso)
   - `BETTER_AUTH_SECRET` - Secret pour JWT (min 32 chars)
   - `BETTER_AUTH_URL` - URL publique de l'API
   - `CORS_ORIGIN` - URL du frontend

## Développement

### Ajouter un nouveau router tRPC

1. Créer `packages/api/src/routers/myRouter.ts`
2. Exporter depuis `packages/api/src/routers/index.ts`
3. Importer dans `packages/api/src/index.ts` (appRouter)

### Ajouter une table

1. Définir le schema dans `packages/db/src/schema/`
2. Exporter depuis `packages/db/src/schema/index.ts`
3. Générer: `bun run db:generate`
4. Appliquer: `bun run db:push`

### Ajouter un composant UI

```bash
bunx shadcn@latest add <component-name>
```

## Notes

- Les sessions utilisent des cookies HTTP-only (sécurisé)
- Le scraping Instagram se fait via `instaloader-ts` (dépendance liée)
- Les logs de scraping utilisent Server-Sent Events (SSE)
- Les posts sont stockés avec des champs JSON pour flexibilité

## Licence

MIT
