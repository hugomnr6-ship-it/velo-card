# MEGA-PROMPT MVP — VeloCard : De l'App à la Licorne

> **INSTRUCTION** : Ce document est le guide complet pour transformer VeloCard en MVP premium prêt au lancement.
> Lis-le en entier AVANT de coder. Procède étape par étape, dans l'ordre. Ne saute aucune étape.
> À chaque étape, fais un `git commit` avant de passer à la suivante.
> **Teste le build** (`npm run build`) à la fin de chaque étape.

---

## CONTEXTE

VeloCard est l'app de référence pour les cyclistes amateurs. Elle repose sur **2 piliers** :

**PILIER 1 — Analyse de Course (Utilité)** : Centraliser TOUT ce qui concerne la préparation d'une course cycliste. Parcours interactif, profil d'élévation, vent, sections difficiles, indices de difficulté. L'outil que chaque cycliste ouvre la veille de sa course.

**PILIER 2 — Gamification (Émotion)** : Transformer chaque sortie vélo en progression visible. Cartes 3D style FIFA FUT, tiers, badges, duels, classements. Le truc qui fait que les gens partagent, reviennent, et finissent par payer.

**Stack** : Next.js 15 (App Router), React 19, Tailwind CSS 4, Supabase, Framer Motion, NextAuth (Strava OAuth), html-to-image, Recharts.

**CE QUI EXISTE DÉJÀ** (ne pas recréer) :
- Système de cartes 2D Design B Shield avec 5 tiers + 3 spéciales
- 6 stats (PAC/MON/VAL/SPR/END/RES) + OVR avec formule pondérée
- Duels 1v1 avec ego points
- Clubs avec logo + Squad Wars (Guerre des Pelotons)
- Courses avec OCR (Gemini) + Ghost Cards (growth hack)
- Échappée de la Semaine (TOTW) + cron Monday Update
- Leaderboard régional
- Composants UI : VeloCard, CardWidget, FlipCard, RadarChart, Podium, StoryCanvas, MondayUpdateBanner, LevelUpToast
- GPX parser basique + RDI (Route Difficulty Index) + météo OpenWeatherMap
- Badges PlayStyle (9 badges définis dans `src/lib/badges.ts`)

---

## NOUVELLES DÉPENDANCES À INSTALLER

```bash
npm install @react-three/fiber @react-three/drei three react-parallax-tilt maplibre-gl
npm install -D @types/three
```

| Package | Usage |
|---|---|
| `@react-three/fiber` | Rendu 3D React (carte 3D) |
| `@react-three/drei` | Helpers Three.js (Environment, Float, etc.) |
| `three` | Moteur 3D sous-jacent |
| `react-parallax-tilt` | Tilt gyroscope mobile + souris desktop |
| `maplibre-gl` | Carte interactive open-source WebGL |

---

# ÉTAPE 1 — Onboarding & First Card Reveal

**But** : Créer le moment "wow" quand un nouveau user voit sa carte pour la première fois. C'est LE moment le plus important de l'app. Si le user ne kiffe pas dans les 30 premières secondes, il part.

### 1.1 — Créer `src/app/onboarding/page.tsx`

Page dédiée au premier lancement. Le user est redirigé ici après son premier sync Strava (quand `user_stats` n'existe pas encore ou quand un flag `has_onboarded` est false).

**Flow en 4 phases** :

**Phase 1 — Sync animé** (3-5 secondes)
- Écran sombre avec le logo VeloCard
- Texte animé : "Analyse de tes sorties en cours..."
- Barre de progression ou particules qui tourbillonnent
- En arrière-plan : le vrai sync Strava se fait (`/api/strava/sync`)

**Phase 2 — Card Reveal** (le moment clé)
- L'écran devient noir complet
- Un paquet de carte apparaît au centre (comme un pack FIFA)
- Le user tape/clique pour ouvrir
- Animation d'ouverture : le paquet se déchire/s'ouvre avec des particules
- La carte se révèle avec un effet de lumière intense
- Les stats se remplissent une par une (utiliser `useCountUp` existant)
- L'OVR apparaît en dernier avec un flash
- Le tier s'affiche avec la couleur correspondante

**Phase 3 — Explication rapide** (swipeable, 3 slides max)
- Slide 1 : "Tes 6 stats — Chaque sortie les fait évoluer" (montrer les 6 icônes VIT/MON/TEC/SPR/END/PUI avec une phrase courte chacune)
- Slide 2 : "Ton tier — De Bronze à Légende" (montrer les 5 couleurs de tier avec les plages OVR)
- Slide 3 : "Chaque lundi — Tes stats sont recalculées. Reste actif pour progresser."

**Phase 4 — CTA**
- Bouton "Découvrir mon dashboard" → redirige vers `/dashboard`
- Bouton secondaire "Partager ma carte" → ouvre le flow de partage

### 1.2 — Modifier le flow de redirection

Dans `src/app/dashboard/page.tsx` (ou le layout) :
- Après login, vérifier si `has_onboarded` est true
- Si false → redirect vers `/onboarding`
- Si true → afficher le dashboard normal

### 1.3 — Migration Supabase

```sql
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS has_onboarded BOOLEAN DEFAULT false;
```

Mettre `has_onboarded = true` à la fin du flow onboarding via un appel API.

**Animations requises** :
- Framer Motion pour les transitions entre phases
- `useCountUp` pour les stats
- Particules CSS pour l'ouverture du pack
- Flash de lumière (radial-gradient animé en opacité)

**Commit** : `feat: onboarding flow with card reveal animation`

---

# ÉTAPE 2 — Carte 3D Interactive

**But** : Transformer la carte 2D actuelle en expérience 3D immersive. Quand le user incline son téléphone, la carte bouge. Quand il passe sa souris sur desktop, elle suit. Effet holographique qui donne envie de la montrer.

### 2.1 — Créer `src/components/VeloCard3D.tsx`

Ce composant WRAP le `VeloCard` existant (ne pas réécrire la carte, la réutiliser).

**Architecture** :
```
VeloCard3D (nouveau)
├── react-parallax-tilt (gère le tilt gyro/souris)
│   └── Canvas R3F (rendu 3D)
│       ├── Plane geometry avec la carte en texture
│       ├── Lighting dynamique (réagit au tilt)
│       ├── Particules 3D flottantes
│       └── Effet holographique (shader/material)
```

**Détails techniques** :

1. **Capture de la carte 2D en texture** :
   - Utiliser `html-to-image` (déjà installé) pour capturer le `VeloCard` en canvas/image
   - Appliquer cette image comme texture sur un `PlaneGeometry` Three.js
   - Dimensions du plane : ratio de la carte actuelle (260×380 = ratio ~0.684)

2. **Tilt avec react-parallax-tilt** :
   - Wrapper le Canvas R3F dans `<Tilt>`
   - Props : `gyroscope={true}` pour mobile, `tiltMaxAngleX={15}` `tiltMaxAngleY={15}`
   - `glareEnable={true}` `glareMaxOpacity={0.3}` pour l'effet brillant
   - `perspective={1000}` pour la profondeur

3. **Éclairage 3D** :
   - `ambientLight` intensity 0.4 (lumière de base)
   - `pointLight` qui bouge avec le tilt (donne l'effet de reflet qui suit le mouvement)
   - Pour Légende : ajouter un `spotLight` coloré qui tourne lentement

4. **Particules 3D** (pour Diamant et Légende) :
   - Utiliser `@react-three/drei` `<Sparkles>` ou custom Points
   - Particules qui flottent devant et derrière la carte
   - Couleurs selon le tier (utiliser les `particleColors` de `cardVisuals`)

5. **Effet holographique** :
   - Material avec `metalness: 0.3` `roughness: 0.4` pour Diamant
   - Pour Légende : shader custom avec un rainbow qui shift selon l'angle de vue
   - Utiliser `<meshPhysicalMaterial>` avec `clearcoat` et `iridescence` pour l'effet holo

### 2.2 — Fallback léger

Certains mobiles ne supportent pas bien WebGL. Prévoir un fallback :
- Détecter si WebGL est disponible (`document.createElement('canvas').getContext('webgl')`)
- Si non disponible : afficher la carte 2D normale avec un CSS 3D transform basique (perspective + rotateX/Y au touch)
- Si WebGL dispo mais performances faibles : utiliser `<PerformanceMonitor>` de drei pour réduire la qualité

### 2.3 — Intégration

- **Page profil** (`/profile`) : Remplacer le FlipCard actuel par VeloCard3D (front) + RadarChart (back)
- **Dashboard** : Garder le CardWidget compact (pas de 3D ici, trop lourd)
- **Page `/card/[userId]`** : VeloCard3D en mode plein écran

### 2.4 — Performance

- **Code-splitting** : Charger R3F uniquement sur les pages qui l'utilisent (`dynamic import` Next.js)
- **Lazy loading** : Ne rendre le Canvas que quand le composant est visible (IntersectionObserver)
- Le bundle Three.js fait ~462kb. Le charger en `next/dynamic` avec `ssr: false`

```tsx
import dynamic from 'next/dynamic';
const VeloCard3D = dynamic(() => import('@/components/VeloCard3D'), {
  ssr: false,
  loading: () => <VeloCardSkeleton />
});
```

**Commit** : `feat: 3D interactive card with gyroscope tilt and holographic effects`

---

# ÉTAPE 3 — Carte Interactive du Parcours

**But** : Permettre au cycliste d'uploader un GPX et de voir son parcours sur une carte interactive avec le code couleur de difficulté, le profil d'élévation synchronisé, et le vent.

### 3.1 — Créer `src/components/CourseMap.tsx`

Carte interactive plein écran utilisant MapLibre GL JS.

**Fonctionnalités** :

1. **Tracé du parcours coloré par difficulté** :
   - Parser le GPX (utiliser `parseGpx` existant dans `src/lib/gpx.ts`)
   - Calculer le gradient % entre chaque point : `gradient = (elevDiff / distance) * 100`
   - Appliquer un lissage (moyenne mobile sur 5 points) pour éviter le bruit GPS
   - Convertir en GeoJSON `LineString` avec le gradient en propriété de chaque segment
   - Couleurs du code gradient :
     ```
     0-3%   → #22C55E (vert — plat)
     3-5%   → #EAB308 (jaune — vallonné)
     5-8%   → #F97316 (orange — difficile)
     8-12%  → #EF4444 (rouge — très dur)
     12%+   → #9333EA (violet — mur)
     Descente → #3B82F6 (bleu)
     ```
   - Épaisseur de ligne : 4px, avec bordure sombre pour la lisibilité

2. **Marqueurs de sections clés** :
   - Identifier automatiquement les montées significatives (gain > 50m continu)
   - Pour chaque montée : afficher un marqueur avec "Col/Montée — X.X km à Y.Y%"
   - Identifier les descentes techniques (pente > -6% sur plus de 1km)
   - Marqueur départ (vert) et arrivée (damier)

3. **Style de carte** :
   - Utiliser un style sombre cohérent avec l'app (MapLibre Dark style ou custom)
   - Fond sombre `#0B1120` pour matcher le design system
   - Relief visible en mode terrain si disponible

### 3.2 — Créer `src/components/ElevationProfileSync.tsx`

Profil d'élévation interactif synchronisé avec la carte.

**Fonctionnalités** :

1. **Graphique** :
   - Axe X = distance (km), Axe Y = altitude (m)
   - Remplissage sous la courbe avec le même code couleur que la carte (gradient)
   - Utiliser Recharts `<AreaChart>` (déjà installé) ou SVG custom

2. **Synchronisation carte ↔ profil** :
   - Au survol du profil d'élévation → un marqueur se déplace sur la carte à la position correspondante
   - Au clic sur la carte → le curseur du profil d'élévation se déplace
   - Afficher un tooltip : "Km X.X — Alt. XXXm — Pente X.X%"

3. **Informations affichées** :
   - Distance totale, D+ total, D- total, altitude max/min
   - RDI (utiliser `computeRdi` existant)
   - Points clés annotés sur le profil (sommets des cols, points bas)

### 3.3 — Créer `src/components/WindOverlay.tsx`

Overlay de vent sur la carte du parcours.

**Fonctionnalités** :

1. **Récupération des données vent** :
   - API : Open-Meteo (gratuit, pas de clé API)
   - Endpoint : `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly=wind_speed_10m,wind_direction_10m`
   - Échantillonner 8-12 points équidistants le long du parcours
   - Requêtes parallèles pour chaque point

2. **Calcul vent relatif au parcours** :
   - Pour chaque segment du parcours, calculer le bearing (direction) du segment
   - Comparer avec la direction du vent :
     ```typescript
     const angleDiff = routeBearing - windDirection; // normaliser 0-360
     const headwind = windSpeed * Math.cos(angleDiff * Math.PI / 180);
     const crosswind = windSpeed * Math.abs(Math.sin(angleDiff * Math.PI / 180));
     // headwind > 0 = vent de face, < 0 = vent de dos
     ```
   - Classifier :
     ```
     Vent de face > 15 km/h → Rouge (très défavorable)
     Vent de face 5-15 km/h → Orange (défavorable)
     Vent faible < 5 km/h → Gris (neutre)
     Vent de dos 5-15 km/h → Vert clair (favorable)
     Vent de dos > 15 km/h → Vert vif (très favorable)
     ```

3. **Affichage sur la carte** :
   - Flèches directionnelles à intervalles réguliers sur le tracé
   - Couleur de la flèche = impact du vent (rouge/orange/gris/vert)
   - Direction de la flèche = direction du vent par rapport au parcours
   - Toggle on/off pour activer/désactiver l'overlay vent

4. **Affichage sur le profil d'élévation** :
   - Bande colorée sous le profil montrant les zones de vent favorable/défavorable
   - Résumé : "Vent de face dominant sur 60% du parcours"

### 3.4 — Créer `src/app/api/weather/route-wind/route.ts`

API route pour récupérer le vent le long d'un parcours.

```typescript
// Input : array de {lat, lon} (8-12 points)
// Output : array de {lat, lon, windSpeed, windDirection, windGust}
// Source : Open-Meteo API (gratuit)
// Cache : 2 heures (les prévisions ne changent pas toutes les minutes)
```

### 3.5 — Créer `src/app/course/page.tsx`

Page dédiée à l'analyse de course.

**Layout** :
```
┌─────────────────────────────────────┐
│         ANALYSE DE COURSE           │
│  [Drag & Drop GPX ici]             │
├─────────────────────────────────────┤
│                                     │
│     Carte interactive (70vh)        │
│     avec tracé coloré + vent        │
│                                     │
├─────────────────────────────────────┤
│  Profil d'élévation synchronisé     │
│  (200px height)                     │
├──────────┬──────────┬───────────────┤
│ Distance │ D+ Total │ RDI Score     │
│ XX.X km  │ XXXXm    │ X.X/10       │
├──────────┴──────────┴───────────────┤
│ Sections clés :                     │
│ 🏔 Col A — 3.2km à 7.4% (km 12)    │
│ 🏔 Côte B — 1.1km à 9.2% (km 28)   │
│ ⬇ Descente C — 4.5km à -6% (km 35) │
│ 💨 Vent de face fort km 40-55       │
└─────────────────────────────────────┘
```

**Fonctionnalités de la page** :
- Upload GPX via drag & drop (réutiliser `GpxDropZone` existant)
- Sélection de la date/heure de course (pour les prévisions vent)
- Toggle layers : Gradient | Vent | Sections clés
- Résumé automatique de la course (distance, D+, RDI, nombre de cols)

### 3.6 — Améliorer `src/lib/gpx.ts`

Ajouter au parser GPX existant :

```typescript
// Nouvelles fonctions à ajouter :

// Calcul du gradient entre 2 points avec lissage
export function computeSegmentGradients(points: GpxPoint[], smoothWindow?: number): GradientSegment[];

// Identification des montées significatives
export function identifyClimbs(points: GpxPoint[], minGain?: number): ClimbSegment[];

// Identification des descentes techniques
export function identifyDescents(points: GpxPoint[], minDrop?: number): DescentSegment[];

// Calcul du bearing (direction) entre 2 points GPS
export function computeBearing(lat1: number, lon1: number, lat2: number, lon2: number): number;

// Échantillonner N points équidistants le long du parcours
export function sampleEquidistantPoints(points: GpxPoint[], count: number): GpxPoint[];
```

### 3.7 — Nouveaux types dans `src/types/index.ts`

```typescript
export interface GradientSegment {
  startIndex: number;
  endIndex: number;
  gradient: number;          // en %
  distance: number;          // en km
  elevationGain: number;     // en m
  coordinates: [number, number][];  // [lng, lat] pour GeoJSON
}

export interface ClimbSegment {
  name?: string;
  startKm: number;
  endKm: number;
  lengthKm: number;
  elevationGain: number;
  avgGradient: number;
  maxGradient: number;
  startCoord: [number, number];
  summitCoord: [number, number];
  difficulty: number;        // score calculé
}

export interface DescentSegment {
  startKm: number;
  endKm: number;
  lengthKm: number;
  elevationLoss: number;
  avgGradient: number;       // négatif
  isTechnical: boolean;      // gradient variable = technique
}

export interface WindPoint {
  lat: number;
  lon: number;
  km: number;                // distance depuis le départ
  windSpeed: number;         // km/h
  windDirection: number;     // degrés (d'où vient le vent)
  windGust: number;          // km/h
  headwindComponent: number; // positif = face, négatif = dos
  crosswindComponent: number;// toujours positif
  impact: 'very_unfavorable' | 'unfavorable' | 'neutral' | 'favorable' | 'very_favorable';
}

export interface CourseAnalysis {
  route: GpxPoint[];
  totalDistanceKm: number;
  totalElevationGain: number;
  totalElevationLoss: number;
  maxElevation: number;
  minElevation: number;
  gradients: GradientSegment[];
  climbs: ClimbSegment[];
  descents: DescentSegment[];
  wind: WindPoint[] | null;
  rdi: RdiResult;
  summary: {
    climbCount: number;
    hardestClimb: ClimbSegment | null;
    longestClimb: ClimbSegment | null;
    headwindPercentage: number;      // % du parcours avec vent de face
    dominantWindImpact: string;
  };
}
```

**Commit** : `feat: interactive course map with gradient coloring, elevation sync, and wind overlay`

---

# ÉTAPE 4 — Feed Social & Activité

**But** : Transformer le dashboard d'un écran statique en hub social vivant. Le user doit voir ce qui se passe dans la communauté à chaque ouverture.

### 4.1 — Migration Supabase : Table `activity_feed`

```sql
CREATE TABLE activity_feed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  event_type TEXT NOT NULL,
  -- Types: 'tier_up', 'tier_down', 'totw_selected', 'duel_won', 'duel_lost',
  -- 'war_won', 'war_lost', 'badge_earned', 'race_result', 'legend_moment',
  -- 'in_form', 'streak_milestone', 'new_member'
  metadata JSONB DEFAULT '{}',
  -- Contient les détails selon le type :
  -- tier_up: { old_tier, new_tier }
  -- totw_selected: { category, stat_value }
  -- duel_won: { opponent_name, category, stake }
  -- badge_earned: { badge_id, badge_name }
  -- etc.
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_feed_created ON activity_feed(created_at DESC);
CREATE INDEX idx_feed_user ON activity_feed(user_id);
```

### 4.2 — Générer les events automatiquement

Modifier les API routes existantes pour insérer des events dans `activity_feed` :

| Quand | Event type | API à modifier |
|---|---|---|
| Sync change le tier | `tier_up` / `tier_down` | `/api/strava/sync` |
| Sélection TOTW | `totw_selected` | `/api/cron/monday-update` |
| Duel résolu | `duel_won` / `duel_lost` | `/api/duels/[id]/accept` + cron |
| Guerre terminée | `war_won` / `war_lost` | `/api/cron/monday-update` |
| Badge débloqué | `badge_earned` | `/api/strava/sync` (après recalcul badges) |
| Résultat de course | `race_result` | `/api/races/[id]/results` |
| Special card | `in_form` / `legend_moment` | `/api/cron/monday-update` |
| Streak milestone (5, 10, 20, 50 semaines) | `streak_milestone` | `/api/cron/monday-update` |

### 4.3 — Créer `src/app/api/feed/route.ts`

```typescript
// GET /api/feed?limit=20&offset=0
// Retourne les events récents avec les infos user (username, avatar, tier)
// Jointure avec profiles pour avoir les détails
// Ordre : created_at DESC
```

### 4.4 — Créer `src/components/DashboardFeed.tsx`

**Design** : Liste scrollable d'events avec icônes, couleurs et animations.

Chaque event a :
- Avatar du user (petit, rond)
- Texte descriptif : "**Marc** est passé **Diamant** 💎" / "**Léa** a gagné un duel contre **Hugo** en VIT (+25 ego)"
- Timestamp relatif ("il y a 2h", "hier")
- Couleur d'accent selon le type (tier_up = doré, duel = violet, totw = émeraude)
- Animation d'entrée avec Framer Motion (staggered)

**Layout du nouveau dashboard** :
```
┌─────────────────────────────┐
│  CardWidget (existant)      │
│  [Sync] [Partager]         │
├─────────────────────────────┤
│  MondayUpdateBanner         │
│  (si lundi et pas vu)       │
├─────────────────────────────┤
│  🏆 Activité récente        │
│  ─────────────────────────  │
│  Marc → Diamant     il y a 2h│
│  Léa a gagné vs Hugo  hier  │
│  TOTW: Sarah (MON)  lun.   │
│  Club X gagne la guerre lun.│
│  [Voir plus]                │
└─────────────────────────────┘
```

**Commit** : `feat: social activity feed on dashboard with auto-generated events`

---

# ÉTAPE 5 — Système de Badges Complet

**But** : Donner des micro-objectifs permanents au user. Les badges sont le moteur silencieux de la rétention — chaque semaine il y a un nouveau badge à débloquer.

### 5.1 — Migration Supabase : Table `user_badges`

```sql
CREATE TABLE user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_id)
);
```

### 5.2 — Définir les badges dans `src/lib/badges.ts`

Garder les 9 PlayStyle badges existants ET ajouter des badges de progression :

```typescript
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;           // nom de l'icône SVG
  category: 'playstyle' | 'progression' | 'social' | 'performance';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  condition: (stats: UserStats, extras: BadgeExtras) => boolean;
}

interface BadgeExtras {
  totalSyncs: number;
  weeklyKm: number;
  weeklyDplus: number;
  duelsWon: number;
  duelsPlayed: number;
  warWins: number;
  racesCompleted: number;
  clubMember: boolean;
  activeWeeksStreak: number;
  totals: { km: number; dplus: number; rides: number };
}
```

**15 badges MVP** :

| ID | Nom | Catégorie | Rareté | Condition |
|---|---|---|---|---|
| `first_sync` | Premier Tour de Roue | progression | common | Premier sync effectué |
| `week_streak_5` | Régulier | progression | common | 5 semaines consécutives actives |
| `week_streak_10` | Métronome | progression | rare | 10 semaines consécutives |
| `week_streak_25` | Machine | progression | epic | 25 semaines consécutives |
| `tier_argent` | Sortir du Peloton | progression | common | Atteindre Argent |
| `tier_platine` | Confirmer | progression | rare | Atteindre Platine |
| `tier_diamant` | L'Élite | progression | epic | Atteindre Diamant |
| `tier_legende` | Légende Vivante | progression | legendary | Atteindre Légende |
| `first_duel_win` | Premier Sang | social | common | Gagner son premier duel |
| `duel_master` | Maître Duelliste | social | rare | 10 duels gagnés |
| `club_member` | Esprit d'Équipe | social | common | Rejoindre un club |
| `war_winner` | Guerrier | social | rare | Gagner une Squad War |
| `totw_selected` | Star de la Semaine | performance | epic | Être sélectionné Échappée |
| `century_ride` | Centurion | performance | rare | Faire 100km en une sortie (via Strava) |
| `summit_hunter` | Chasseur de Cols | performance | rare | Cumuler 2000m de D+ en une semaine |

### 5.3 — Logique de vérification

Créer `src/lib/checkBadges.ts` :
- Fonction appelée après chaque sync + après le cron Monday
- Compare les badges déjà débloqués avec les conditions
- Si nouveau badge → insert dans `user_badges` + insert event dans `activity_feed`
- Retourne la liste des nouveaux badges (pour afficher un toast/animation)

### 5.4 — Affichage

- **Page profil** : Section badges sous la carte (grille de badges, grisés si non débloqués)
- **Dashboard** : Toast animé quand un nouveau badge est débloqué (après sync)
- **Profil public** : Badges visibles par les autres

**Commit** : `feat: badge system with 15 achievements and auto-unlock logic`

---

# ÉTAPE 6 — Partage Social Complet

**But** : Boucler le flow de partage pour que chaque user puisse montrer sa carte sur les réseaux. C'est la boucle virale #1.

### 6.1 — Créer `src/components/ShareModal.tsx`

Modal qui s'ouvre quand le user clique "Partager".

**Options** :
1. **Story Instagram/TikTok** (1080×1920) — utiliser `StoryCanvas` existant
2. **Image carte seule** (520×760) — utiliser `html-to-image` sur le VeloCard
3. **Copier le lien** — `https://velocard.app/card/{userId}`
4. **QR Code** — réutiliser `QRCode` existant

**Flow** :
- Le user choisit le format
- Prévisualisation instantanée
- Bouton "Télécharger" → génère l'image et la download
- Bouton "Copier le lien" → copie dans le presse-papier avec toast "Lien copié !"
- Sur mobile : utiliser l'API Web Share (`navigator.share`) si disponible pour partage natif

### 6.2 — Améliorer `StoryCanvas.tsx`

Le composant existe mais a besoin de polish :
- Ajouter les badges du user (2-3 principaux en bas)
- Ajouter le tier en texte ("DIAMANT" en lettres capitales sous la carte)
- Ajouter un CTA plus visible : "Crée ta carte sur velocard.app"
- Ajouter un watermark discret mais classy

### 6.3 — Créer `src/components/ShareButton.tsx`

Bouton réutilisable qui ouvre le ShareModal. À placer sur :
- Dashboard (à côté du bouton Sync)
- Page profil
- Page card publique
- Après l'onboarding (Phase 4 du flow)

**Commit** : `feat: share modal with Instagram story, image download, link copy, and web share API`

---

# ÉTAPE 7 — Profil Éditable

**But** : Permettre au user de personnaliser son identité. Un profil personnalisé = un user investi émotionnellement.

### 7.1 — Migration Supabase

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS region TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_climb TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bike_name TEXT DEFAULT '';
```

### 7.2 — Créer `src/app/api/profile/update/route.ts`

```typescript
// PUT /api/profile/update
// Body : { bio?, region?, favorite_climb?, bike_name? }
// Validation : bio max 160 chars, region dans FRENCH_REGIONS
```

### 7.3 — Upload photo de profil

Créer `src/app/api/profile/avatar/route.ts` :
- Accepte un FormData avec l'image
- Upload vers Supabase Storage bucket `avatars` (à créer)
- Resize/compress côté serveur si trop grand (max 500×500, < 500kb)
- Met à jour `custom_avatar_url` dans profiles
- Si `custom_avatar_url` existe, l'utiliser à la place de l'avatar Strava partout dans l'app

### 7.4 — Page d'édition du profil

Modifier `/profile` pour ajouter un bouton "Modifier" qui ouvre un formulaire :
- Photo : cercle cliquable avec icône caméra, ouvre le sélecteur de fichier
- Bio : textarea, 160 chars max, placeholder "Cycliste passionné depuis..."
- Région : dropdown avec `FRENCH_REGIONS` (existant)
- Mon vélo : input texte, placeholder "Canyon Aeroad CF SLX"
- Col préféré : input texte, placeholder "Col du Galibier"

### 7.5 — Affichage enrichi

Sur la page profil publique (`/profile/[userId]`) :
- Bio sous le nom
- Région + icône drapeau
- Vélo + col préféré si renseignés
- Badges débloqués

**Commit** : `feat: editable profile with custom avatar, bio, region, and personal details`

---

# ÉTAPE 8 — PWA (Progressive Web App)

**But** : Rendre l'app installable sur l'écran d'accueil des téléphones. Ça transforme "un site web" en "mon app VeloCard".

### 8.1 — Créer `public/manifest.json`

```json
{
  "name": "VeloCard",
  "short_name": "VeloCard",
  "description": "Ta carte de cycliste. Analyse tes courses. Progresse chaque semaine.",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#0B1120",
  "theme_color": "#0B1120",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### 8.2 — Créer les icônes

Générer les icônes de l'app dans `public/icons/` :
- `icon-192.png` (192×192)
- `icon-512.png` (512×512)
- `icon-maskable-512.png` (512×512 avec zone de sécurité pour Android)
- Design : Le logo VeloCard (V stylisé ou bouclier de la carte) sur fond `#0B1120`

### 8.3 — Créer `public/sw.js` (Service Worker basique)

```javascript
// Service worker minimal pour l'installation PWA
// Cache les assets statiques (fonts, icons)
// Pas de cache offline complet pour le MVP — juste l'enveloppe
const CACHE_NAME = 'velocard-v1';
const STATIC_ASSETS = ['/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)));
});

self.addEventListener('fetch', (event) => {
  // Network-first strategy pour le MVP
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
```

### 8.4 — Mettre à jour `src/app/layout.tsx`

Ajouter dans le `<head>` :
```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#0B1120" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
```

Enregistrer le service worker :
```typescript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

**Commit** : `feat: PWA setup with manifest, icons, and basic service worker`

---

# ÉTAPE 9 — Brancher les Notifications In-App

**But** : Donner vie aux composants existants `LevelUpToast` et `MondayUpdateBanner`. Ce sont des hooks de rétention gratuits — le code est là, faut juste le câbler.

### 9.1 — LevelUpToast

Le composant existe. Il faut le déclencher quand :
- Après un sync, si le tier a changé (comparer `prev_tier` et `tier`)
- Le trigger se fait dans `VeloCardSection.tsx` ou `VeloCardClient.tsx` après le sync

### 9.2 — MondayUpdateBanner

Le composant existe. Il faut :
- L'afficher sur le dashboard le lundi (ou la première fois que le user ouvre l'app après le Monday Update)
- Stocker dans `localStorage` la dernière semaine vue : `velocard_last_monday_seen`
- Si la semaine courante ≠ semaine vue → afficher le banner avec les deltas

### 9.3 — Badge Toast

Créer un toast pour les badges :
- Après sync, si `checkBadges()` retourne des nouveaux badges → afficher un toast par badge
- Animation : badge icon qui apparaît avec un éclat doré + nom du badge

### 9.4 — Améliorer `ToastContext.tsx`

Le context existe mais est basique. L'améliorer pour supporter :
- Différents types de toast : `success`, `info`, `badge`, `tier_up`
- Queue de toasts (si plusieurs en même temps)
- Auto-dismiss après 5 secondes
- Animation d'entrée/sortie avec Framer Motion

**Commit** : `feat: wire up LevelUpToast, MondayUpdateBanner, and badge notifications`

---

# ÉTAPE 10 — Analytics & Monitoring

**But** : Savoir ce qui se passe dans l'app. Sans data, tu navigues à l'aveugle.

### 10.1 — Posthog (ou Vercel Analytics)

Installer Posthog (open-source, gratuit jusqu'à 1M events/mois) :

```bash
npm install posthog-js
```

Tracker les events clés :
- `onboarding_started`, `onboarding_completed`
- `card_synced`
- `card_shared` (+ canal : story/image/link)
- `duel_created`, `duel_accepted`
- `course_analyzed` (GPX uploaded)
- `badge_earned`
- `page_view` (chaque page)

### 10.2 — Sentry (error monitoring)

```bash
npm install @sentry/nextjs
```

Config basique pour capturer :
- Erreurs JavaScript non catchées
- Erreurs API (status 500)
- Promesses rejetées

### 10.3 — Créer `src/lib/analytics.ts`

```typescript
// Wrapper pour ne pas coupler l'app directement à Posthog
export function trackEvent(event: string, properties?: Record<string, unknown>) { ... }
export function identifyUser(userId: string, traits?: Record<string, unknown>) { ... }
```

**Commit** : `feat: analytics (Posthog) and error monitoring (Sentry) setup`

---

## CHECKLIST FINALE MVP

### Pilier 1 — Analyse de Course
- [ ] Carte interactive MapLibre avec tracé GPX coloré par gradient
- [ ] Profil d'élévation synchronisé avec la carte
- [ ] Overlay vent (direction + impact) via Open-Meteo
- [ ] Identification automatique des montées et descentes
- [ ] Page `/course` avec upload GPX et résumé complet
- [ ] RDI amélioré avec données vent

### Pilier 2 — Gamification
- [ ] Onboarding avec animation de card reveal
- [ ] Carte 3D interactive (Three.js + gyroscope/souris)
- [ ] Effet holographique sur Diamant et Légende
- [ ] Feed social sur le dashboard
- [ ] 15 badges avec logique de déblocage automatique
- [ ] Partage social complet (Story, Image, Lien, QR)
- [ ] Profil éditable (bio, photo, région, vélo, col)

### Infra & UX
- [ ] PWA installable (manifest + service worker + icônes)
- [ ] Notifications in-app branchées (tier up, monday update, badges)
- [ ] Analytics (Posthog) + Error monitoring (Sentry)
- [ ] Build Next.js sans erreur à chaque étape

---

## ORDRE D'IMPLÉMENTATION RECOMMANDÉ

1. **Onboarding** (Étape 1) — Premier truc que le user voit
2. **Carte 3D** (Étape 2) — Le wow factor
3. **Analyse de course** (Étape 3) — Le pilier utilitaire (le plus gros morceau)
4. **Feed social** (Étape 4) — La colle communautaire
5. **Badges** (Étape 5) — Le moteur de rétention
6. **Partage** (Étape 6) — La boucle virale
7. **Profil éditable** (Étape 7) — La personnalisation
8. **PWA** (Étape 8) — L'installation mobile
9. **Notifications** (Étape 9) — Les hooks de rétention
10. **Analytics** (Étape 10) — La data pour itérer

---

## NOTES POUR CLAUDE CODE

1. **Ne change JAMAIS la logique d'auth** (NextAuth + Strava OAuth). Elle fonctionne, n'y touche pas.
2. **Ne change JAMAIS la structure Supabase existante**. Ajoute des colonnes/tables, ne modifie pas ce qui existe.
3. **Garde la compatibilité** avec TOUTES les features existantes (duels, clubs, wars, ghost cards, races, TOTW).
4. **Le VeloCard 2D reste** — le 3D est un wrapper par-dessus. Les composants qui utilisent le 2D (CardWidget, Story, etc.) continuent de fonctionner.
5. **Taille des cartes** : XS (36×52), S (64×92), M (88×128), L (180×262), XL (260×380).
6. **Chaque étape = un commit**. Ne fais pas tout d'un coup.
7. **Teste le build** (`npm run build`) à la fin de chaque étape.
8. **MapLibre** doit utiliser un style sombre cohérent avec `--bg-primary: #0B1120`.
9. **Les labels de stats sont en français 3 lettres** : VIT, MON, TEC, SPR, END, PUI (dans le display uniquement, les clés DB restent pac/mon/val/spr/end/res).
10. **Performance mobile** : Code-split Three.js, lazy load les cartes, pas de 3D sur le dashboard.
11. **Open-Meteo** est gratuit et sans clé API. Cache les résultats 2h minimum.
12. **Les badges PlayStyle existants** (9 dans badges.ts) sont conservés et complétés par les 15 nouveaux badges de progression/social/performance.
