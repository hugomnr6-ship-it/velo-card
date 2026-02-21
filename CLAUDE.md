# CLAUDE.md — VeloCard MVP

## Identité du Projet

VeloCard transforme les sorties vélo en cartes FIFA dynamiques. Chaque cycliste a une carte avec 6 stats recalculées chaque lundi à partir de ses données Strava. L'app combine gamification (duels, quêtes, skins, économie VeloCoins) et centralisation des courses (calendrier, parcours GPX, résultats, Ghost Cards).

**Objectif MVP** : faire revenir les utilisateurs **tous les jours** et les convaincre de **payer un abonnement Pro**.

---

## Stack Technique

- **Framework** : Next.js 15 (App Router) + React 19 + TypeScript 5.7 strict
- **Base de données** : Supabase (PostgreSQL) via `supabaseAdmin` (service role)
- **Auth** : NextAuth v5 beta (Strava OAuth + Google OAuth)
- **Paiements** : Stripe (abonnement Pro + achat de VeloCoins)
- **Cache/Rate Limit** : Upstash Redis
- **State client** : TanStack React Query
- **Styling** : Tailwind CSS 4 + Framer Motion
- **Analytics** : PostHog + Sentry
- **i18n** : next-intl (français principal)
- **Tests** : Vitest (unit) + Playwright (E2E)
- **Deploy** : Vercel

---

## Conventions de Code

### Nommage
- **Variables/fonctions** : camelCase (`getUserStats`, `coinBalance`)
- **Colonnes DB** : snake_case (`strava_id`, `avatar_url`, `total_elevation_gain`)
- **Stats** : codes 3 lettres — `pac`, `mon`, `val`, `spr`, `end`, `res`, `ovr`
- **Tiers** : `"bronze" | "argent" | "platine" | "diamant" | "legende"`
- **Commentaires** : français

### Imports
- Toujours utiliser l'alias `@/` (ex: `import { ECONOMY } from "@/lib/economy"`)
- Imports relatifs interdits

### Types
- Définir avec `type` pour les unions, `interface` pour les objets structurés
- Tous les types centralisés dans `src/types/index.ts`
- Pas de `any` — utiliser `unknown` si nécessaire

### API Routes
Format de réponse erreur standardisé :
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "field": "..." } }
```
- Validation avec Zod
- Auth via `getAuthenticatedUser()` de `@/lib/api-utils`
- Codes HTTP : 400 (validation), 401 (auth), 404 (not found), 429 (rate limit), 500 (interne)
- Ne jamais exposer les détails DB dans les erreurs

### Composants
- Mobile-first (bottom tab bar)
- Framer Motion pour les animations (respecter `prefers-reduced-motion`)
- Skeleton loading pour tous les états de chargement
- Hooks custom dans `src/hooks/` (prefixe `use`)

---

## Économie VeloCoins (src/lib/economy.ts)

**IMPORTANT** : Toute valeur de coins DOIT venir de `ECONOMY.*`. Zéro magic number.

### Sources (gains)
| Action | Coins | Constante |
|--------|-------|-----------|
| Kilomètre pédalé | 5 | `COINS_PER_KM` |
| Duel gagné | 50 | `COINS_DUEL_WIN` |
| Guerre gagnée | 100 | `COINS_WAR_WIN` |
| TOTW sélectionné | 200 | `COINS_TOTW_SELECTED` |
| Badge obtenu | 25 | `COINS_BADGE_EARNED` |
| Quête complétée | 20-200 | via `quest_definitions` |

### Sinks (dépenses)
| Action | Coins | Constante |
|--------|-------|-----------|
| Skin common | 300 | `SKIN_PRICE.common` |
| Skin rare | 500 | `SKIN_PRICE.rare` |
| Skin epic | 900 | `SKIN_PRICE.epic` |
| Skin legendary | 1500 | `SKIN_PRICE.legendary` |
| Mise de duel | 5-100 | variable |

### Règle d'équilibre
Un cycliste actif (~150km/semaine) doit mettre **3-4 semaines** pour acheter un skin legendary. Si c'est plus rapide, les sinks sont trop faibles. Toujours vérifier le ratio source/sink quand tu modifies l'économie.

---

## Calcul des Stats (src/lib/stats.ts)

Formule OVR :
```
OVR = PAC×0.15 + MON×0.20 + VAL×0.10 + SPR×0.10 + END×0.15 + RES×0.30
```

- Chaque stat va de 0 à 99
- Calculé uniquement à partir des activités Strava de type `"Ride"` avec `distance > 0`
- Recalcul chaque lundi via cron (`/api/cron/monday-update`)
- L'historique est sauvegardé dans `stats_history` pour les charts de progression

---

## Architecture des Features MVP

### KEEP (lancer tel quel)
Ces features sont prêtes. Ne pas les casser, les améliorer à la marge :

- **Carte dynamique** — 6 stats, 5 tiers, animation tier-up, gyroscope/parallax tilt, QR code
- **Monday Update** — Cron Vercel qui recalcule toutes les stats chaque lundi
- **Duels 1v1** — 10 catégories, modes instant/weekly, système de mise
- **Shop rotatif** — Rotation hebdo, countdown, featured + regular items
- **Badges & Showcase** — Catégories, raretés, showcase 3 favoris
- **Leaderboard** — Régional, national, global, materialized view
- **Feed social** — 8 types d'events, likes, commentaires, pagination
- **Analyse GPX** — Upload, carte MapLibre, altitude Recharts, RDI, météo
- **Ghost Cards** — Auto-générées depuis résultats de course, claim token
- **Profil & Compare** — Comparaison de cartes entre utilisateurs
- **Onboarding** — Flow Strava connect → première carte

### FIX (corriger avant le launch)
- **VeloCoins économie** — `COINS_PER_KM` doit passer de 10 à 5, ajouter des skins premium-only
- **Quêtes** — Remplacer les quêtes passives ("10km") par des quêtes contextuelles ("Défie un membre de ton club", "Consulte le leaderboard")
- **Calendrier courses** — Remplacer la vue liste par une vue mois, ajouter des filtres (région, fédé, distance)
- **Clubs** — Garder création/join, masquer les features avancées

### CUT (masquer, ne PAS supprimer le code)
- **Tournaments** — `src/app/tournaments/` → afficher "Coming Soon" avec inscription
- **Fantasy Leagues** — `src/app/fantasy/` → afficher "Coming Soon"
- **Marketplace** — `src/app/marketplace/` → afficher "Coming Soon"
- **Wars (clubs)** — `src/app/wars/` → afficher "Coming Soon"
- **Packs (lootbox)** — Déjà déprécié. Ne pas réactiver.

Pour masquer une feature CUT :
```tsx
// src/app/[feature]/page.tsx
export default function FeaturePage() {
  return <ComingSoonTeaser feature="Tournaments" />;
}
```

### BUILD (nouvelles features MVP)
- **Système de favoris** — Table `favorites`, endpoint CRUD, composant BookmarkButton, section "Mes Favoris" au dashboard
- **Daily Quest Reset** — Cron midnight pour reset les quêtes quotidiennes
- **Duel of the Day** — Matchmaking automatique (OVR ±5) qui propose un duel chaque jour
- **Gates Free/Pro** — Implémenter les différences entre free et Pro

---

## Système de Favoris (À CONSTRUIRE)

### Table SQL
```sql
CREATE TABLE favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('race', 'route', 'profile')),
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, entity_type, entity_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_entity ON favorites(entity_type, entity_id);
```

### API
- `GET /api/favorites` — Liste les favoris de l'user (filtrable par entity_type)
- `POST /api/favorites` — Ajouter un favori `{ entity_type, entity_id }`
- `DELETE /api/favorites/[id]` — Retirer un favori

### Composant
```tsx
// src/components/BookmarkButton.tsx
// Cœur/étoile toggle, réutilisable partout
// Props: entityType, entityId, initialFavorited
// Hook: useFavorites() avec TanStack Query + optimistic update
```

---

## Gates Free vs Pro (src/lib/requirePro.ts)

| Feature | Free | Pro |
|---------|------|-----|
| Voir ses stats | Lundi uniquement | 24/7 avec mini-chart |
| Duels actifs | 1 max | Illimités |
| Leaderboard | Top 20 | Complet + position exacte |
| Quêtes/jour | 3 | Illimitées + double rewards |
| Share carte | Avec watermark | Sans watermark |
| Analyse GPX | Basique (distance, D+) | Complète (climbs, météo, RDI) |

Le gate doit être subtil : **montrer** la feature, flouter/limiter l'accès, afficher un CTA "Passer Pro" contextuel. Ne jamais cacher complètement une feature Pro — l'utilisateur doit voir ce qu'il rate.

---

## Boucle de Rétention (7 jours)

Chaque jour de la semaine doit donner une raison d'ouvrir l'app :

| Jour | Trigger | Implémentation |
|------|---------|---------------|
| Lundi | Monday Update — nouvelles stats | Cron existant `/api/cron/monday-update` |
| Mardi | Daily Quest reset + Duel of the Day | Nouveau cron midnight + matchmaking auto |
| Mercredi | Shop rotatif teaser | Déjà en place (countdown) |
| Jeudi | Leaderboard refresh | Redis cache invalidation |
| Vendredi | Résolution duels weekly | Cron existant |
| Samedi | Rappel parcours favoris du weekend | Requiert système de favoris |
| Dimanche | Feed social actif après les sorties | Feed existant |

---

## Structure Projet (rappel)

```
src/
  app/                    # Pages + API routes (App Router)
    api/                  # 50+ endpoints
    [feature]/            # Pages par feature
  components/             # Composants réutilisables
  hooks/                  # Hooks custom (use*)
  services/               # Logique métier backend
  lib/                    # Utilitaires (economy, stats, strava, cache...)
  types/                  # Types TypeScript centralisés
  schemas/                # Schémas Zod
  contexts/               # React Context providers
  messages/               # Traductions i18n
supabase/
  migrations/             # 30+ migrations SQL ordonnées
```

---

## Règles Strictes

1. **Pas de magic numbers** — Tout passe par `ECONOMY.*` ou des constantes nommées
2. **Pas d'écrans vides** — Si une feature n'a pas de contenu, afficher un état vide explicatif ou un Coming Soon
3. **Pas de `any`** — TypeScript strict, `unknown` si nécessaire
4. **Validation Zod** — Chaque input d'API est validé avec un schéma Zod
5. **Optimistic updates** — TanStack Query avec `onMutate` pour les actions utilisateur
6. **Mobile-first** — Tester chaque composant en 375px de large minimum
7. **Français par défaut** — Commentaires, messages d'erreur utilisateur, UI en français
8. **Idempotence** — Les transactions de coins utilisent des clés d'idempotence
9. **Rate limiting** — Chaque route sensible est protégée par Upstash Redis
10. **Skeleton loading** — Jamais de spinner nu, toujours un Skeleton qui reflète la forme du contenu

---

## Commandes Utiles

```bash
npm run dev          # Lancer le dev server
npm run build        # Build production
npm run typecheck    # Vérifier les types
npm test             # Tests unitaires Vitest
npm run test:e2e     # Tests E2E Playwright
```

---

## Critères de Qualité Avant Chaque PR

- [ ] `npm run typecheck` passe sans erreur
- [ ] Les nouveaux endpoints ont un schéma Zod
- [ ] Les composants ont un état de loading (Skeleton)
- [ ] Les valeurs de coins utilisent `ECONOMY.*`
- [ ] Mobile responsive (testé en 375px)
- [ ] Pas de console.log oublié
- [ ] Les features CUT affichent "Coming Soon", jamais un écran vide
