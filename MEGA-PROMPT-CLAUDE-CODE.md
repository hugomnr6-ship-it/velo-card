# MEGA-PROMPT CLAUDE CODE — VeloCard Premium Redesign

> **INSTRUCTION** : Ce document est le guide complet pour implémenter la vision design premium de VeloCard.
> Lis-le en entier AVANT de coder. Procède étape par étape, dans l'ordre. Ne saute aucune étape.
> À chaque étape, fais un `git commit` avant de passer à la suivante.

---

## CONTEXTE

VeloCard est une app communautaire pour cyclistes amateurs (comme Tonsser mais pour le vélo).
L'app existe déjà en Next.js 15 + Supabase + Strava. Elle a un système de cartes avec 3 tiers (bronze/silver/gold) et 6 stats.

**OBJECTIF** : Transformer l'app en une expérience premium digne d'une levée Series A de 3-5M€, en implémentant un nouveau design system inspiré FIFA FUT / Pro Cycling Manager.

**Stack actuelle** : Next.js 15 (App Router), React 19, Tailwind CSS 4, Supabase, Framer Motion, NextAuth, html-to-image, Recharts.

**IMPORTANT — Fichiers de référence design** : Les fichiers `phase*.html` dans le dossier racine sont les spécifications design. Tu peux les ouvrir dans un navigateur pour les consulter visuellement. Ce sont tes documents de référence.

---

## TABLE DE CORRESPONDANCE — Stats actuelles → Nouvelles stats

L'app actuelle utilise des noms de stats différents de la vision design. Voici le mapping :

| Stat actuelle (code) | Nouveau nom (design) | Description |
|---|---|---|
| `pac` | `pac` | Vitesse (PACE) — **garde le même nom** |
| `grim` | `mon` | Montagne / Grimpe → renommer en MON |
| `tec` | `val` | Technique / Vallon → renommer en VAL |
| `exp` | `spr` | Explosivité / Sprint → renommer en SPR |
| `end` | `end` | Endurance — **garde le même nom** |
| `pui` | `res` | Puissance / Résistance → renommer en RES |

**Action** : Renommer les stats dans le code ET la base de données.

---

## TABLE DE CORRESPONDANCE — Tiers actuels → Nouveaux tiers

| Tier actuel | Nouveau tier | Plage OVR | Couleur principale |
|---|---|---|---|
| `bronze` | `bronze` | 1-49 | `#CD7F32` |
| `silver` | `argent` | 50-64 | `#C0C0C0` |
| _(nouveau)_ | `platine` | 65-79 | `#E5E4E2` + bleuté |
| `gold` | `diamant` | 80-89 | `#B9F2FF` cyan/ice |
| _(nouveau)_ | `legende` | 90-99 | Rainbow holographique |

---

## FORMULE OVR (Overall Rating)

```typescript
function computeOVR(stats: Stats): number {
  return Math.round(
    stats.pac * 0.15 +
    stats.mon * 0.20 +
    stats.val * 0.10 +
    stats.spr * 0.10 +
    stats.end * 0.15 +
    stats.res * 0.30
  );
}

function getTier(ovr: number): CardTier {
  if (ovr >= 90) return "legende";
  if (ovr >= 80) return "diamant";
  if (ovr >= 65) return "platine";
  if (ovr >= 50) return "argent";
  return "bronze";
}
```

---

## DESIGN TOKENS GLOBAUX

```css
:root {
  /* Fond */
  --bg-primary: #0A0A12;
  --bg-secondary: #12121E;
  --bg-card: #1A1A2E;
  --bg-elevated: #22223A;

  /* Couleurs signature */
  --violet: #6C5CE7;
  --mint: #00F5D4;

  /* Texte */
  --text-primary: #FFFFFF;
  --text-secondary: #A0A0B8;
  --text-muted: #5A5A72;

  /* Tier Bronze */
  --tier-bronze: #CD7F32;
  --tier-bronze-bg: linear-gradient(135deg, #1A1208 0%, #2D1F0E 100%);

  /* Tier Argent */
  --tier-argent: #C0C0C0;
  --tier-argent-bg: linear-gradient(135deg, #14141E 0%, #1E1E2E 100%);

  /* Tier Platine */
  --tier-platine: #E5E4E2;
  --tier-platine-bg: linear-gradient(135deg, #1A1A2E 0%, #2A2A42 100%);
  --tier-platine-accent: #A8D8EA;

  /* Tier Diamant */
  --tier-diamant: #B9F2FF;
  --tier-diamant-bg: linear-gradient(135deg, #0A1628 0%, #162040 100%);

  /* Tier Légende */
  --tier-legende-bg: linear-gradient(135deg, #1A0A2E 0%, #2E1A0A 50%, #0A2E1A 100%);

  /* Typographie */
  --font-title: 'Space Grotesk', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-data: 'JetBrains Mono', monospace;

  /* Spacing */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
}
```

---

# ÉTAPES D'IMPLÉMENTATION

---

## ÉTAPE 1 — Fondations Design System

**But** : Mettre en place les tokens, les fonts, le thème dark premium.

### 1.1 — Installer les fonts Google

```bash
npm install @fontsource/space-grotesk @fontsource/inter @fontsource/jetbrains-mono
```

Puis importer dans `src/app/layout.tsx` :
```typescript
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/700.css';
```

### 1.2 — Mettre à jour `globals.css`

Remplacer tout le contenu par les design tokens ci-dessus + les nouvelles classes CSS pour les 5 tiers (glow, textures, shimmer, scan-lines). Référence : `phase2-design-system.html` section "Effets visuels".

Les classes à créer :
- `.card-glow-bronze`, `.card-glow-argent`, `.card-glow-platine`, `.card-glow-diamant`, `.card-glow-legende`
- `.texture-bronze`, `.texture-argent`, `.texture-platine`, `.texture-diamant`, `.texture-legende`
- `.avatar-glow-*` pour chaque tier
- `.shimmer` animation (déjà existante, à garder)
- `.scan-lines` (déjà existante, à garder)
- **NOUVEAU** `.holographic-scan` pour Diamant (barre de lumière qui descend lentement)
- **NOUVEAU** `.rainbow-holo` pour Légende (gradient arc-en-ciel animé rotatif)
- **NOUVEAU** `.particles` pour Diamant et Légende (particules CSS avec @keyframes)

### 1.3 — Mettre à jour le `<body>` dans `layout.tsx`

- Background : `bg-[#0A0A12]`
- Font par défaut : `font-['Inter']`
- Ajouter `antialiased` class

### 1.4 — Mettre à jour Tailwind config

S'assurer que les couleurs custom sont accessibles via Tailwind (via `@theme` dans Tailwind v4 ou via `globals.css`).

**Commit** : `feat: design system foundations — dark theme + 5 tier tokens + fonts`

---

## ÉTAPE 2 — Refactoring Types & Stats

**But** : Renommer les stats, ajouter les 2 nouveaux tiers, ajouter le champ OVR.

### 2.1 — Modifier `src/types/index.ts`

```typescript
// Avant
export interface ComputedStats {
  pac: number; end: number; grim: number; pui: number; exp: number; tec: number;
}
export type CardTier = "bronze" | "silver" | "gold";

// Après
export interface ComputedStats {
  pac: number;   // Vitesse / Pace
  mon: number;   // Montagne / Climbing
  val: number;   // Vallonné / Technique
  spr: number;   // Sprint / Explosivité
  end: number;   // Endurance
  res: number;   // Résistance / Puissance
  ovr: number;   // Overall Rating (calculé)
}
export type CardTier = "bronze" | "argent" | "platine" | "diamant" | "legende";
```

### 2.2 — Modifier `src/lib/stats.ts`

- Renommer les fonctions : `computeGrim` → `computeMon`, `computeTec` → `computeVal`, etc.
- Ajouter la fonction `computeOVR()` avec la formule pondérée
- Modifier `getTier()` pour utiliser l'OVR et retourner les 5 tiers
- Modifier `computeStats()` pour inclure le champ `ovr`

### 2.3 — Migration Supabase

Créer une migration SQL :

```sql
-- Renommer les colonnes dans user_stats
ALTER TABLE user_stats RENAME COLUMN grim TO mon;
ALTER TABLE user_stats RENAME COLUMN tec TO val;
ALTER TABLE user_stats RENAME COLUMN exp TO spr;
ALTER TABLE user_stats RENAME COLUMN pui TO res;

-- Ajouter la colonne OVR
ALTER TABLE user_stats ADD COLUMN ovr integer DEFAULT 0;

-- Mettre à jour le type de tier (remplacer les anciennes valeurs)
UPDATE user_stats SET tier = 'argent' WHERE tier = 'silver';
UPDATE user_stats SET tier = 'diamant' WHERE tier = 'gold';

-- Recalculer OVR pour les données existantes
UPDATE user_stats SET ovr = ROUND(
  pac * 0.15 + mon * 0.20 + val * 0.10 + spr * 0.10 + "end" * 0.15 + res * 0.30
);

-- Recalculer tiers
UPDATE user_stats SET tier = CASE
  WHEN ovr >= 90 THEN 'legende'
  WHEN ovr >= 80 THEN 'diamant'
  WHEN ovr >= 65 THEN 'platine'
  WHEN ovr >= 50 THEN 'argent'
  ELSE 'bronze'
END;
```

### 2.4 — Mettre à jour TOUS les fichiers qui référencent les anciens noms

Faire un search & replace dans tout le codebase :
- `grim` → `mon` (attention : ne pas remplacer dans les strings/textes non liés)
- `tec` → `val`
- `exp` → `spr`
- `pui` → `res`
- `"silver"` → `"argent"` (en tant que tier)
- `"gold"` → `"diamant"` (en tant que tier)

Fichiers à vérifier obligatoirement :
- `src/components/VeloCard.tsx` — le composant carte
- `src/components/VeloCardInteractive.tsx`
- `src/components/LeaderboardRow.tsx`
- `src/app/dashboard/VeloCardSection.tsx`
- `src/app/dashboard/VeloCardClient.tsx`
- `src/app/leaderboard/page.tsx`
- `src/app/api/leaderboard/route.ts`
- `src/app/api/strava/sync/route.ts`
- `src/types/index.ts`
- `src/lib/stats.ts`
- `src/lib/badges.ts`
- Tous les fichiers race/club/war qui référencent les stats

### 2.5 — Mettre à jour `src/lib/badges.ts`

Renommer les références aux stats dans le calcul des badges PlayStyle.

**Commit** : `refactor: rename stats (mon/val/spr/res) + 5 tiers + OVR formula`

---

## ÉTAPE 3 — Composant VeloCard Premium (5 tiers)

**But** : Refaire le composant `VeloCard.tsx` avec les 5 tiers visuels spectaculaires.

**Référence design** : `phase4-etape2-cartes-visuelles.html`

### 3.1 — Nouveau `tierConfig` avec 5 tiers

```typescript
export const tierConfig: Record<CardTier, TierConfig> = {
  bronze: {
    bg: "from-[#1A1208] via-[#2D1F0E] to-[#1A1208]",
    accent: "#CD7F32",
    glowClass: "card-glow-bronze",
    label: "BRONZE",
    hasParticles: false,
    hasHoloScan: false,
    hasRainbow: false,
  },
  argent: {
    bg: "from-[#14141E] via-[#1E1E2E] to-[#14141E]",
    accent: "#C0C0C0",
    glowClass: "card-glow-argent",
    label: "ARGENT",
    hasParticles: false,
    hasHoloScan: false,
    hasRainbow: false,
  },
  platine: {
    bg: "from-[#1A1A2E] via-[#2A2A42] to-[#1A1A2E]",
    accent: "#E5E4E2",
    glowClass: "card-glow-platine",
    label: "PLATINE",
    hasParticles: false,
    hasHoloScan: false,
    hasRainbow: false,
  },
  diamant: {
    bg: "from-[#0A1628] via-[#162040] to-[#0A1628]",
    accent: "#B9F2FF",
    glowClass: "card-glow-diamant",
    label: "DIAMANT",
    hasParticles: true,       // ← particules flottantes
    hasHoloScan: true,        // ← barre de scan lumineuse
    hasRainbow: false,
  },
  legende: {
    bg: "from-[#1A0A2E] via-[#2E1A0A] to-[#0A2E1A]",
    accent: "#FFD700",
    glowClass: "card-glow-legende",
    label: "LÉGENDE",
    hasParticles: true,       // ← plus de particules
    hasHoloScan: true,
    hasRainbow: true,         // ← effet holographique arc-en-ciel
  },
};
```

### 3.2 — Layout carte

Dimensions : `w-[260px] h-[380px]` (taille XL showcase) ou responsive.

Structure de la carte (de bas en haut en z-index) :
1. **Background gradient** (tier-specific)
2. **Texture overlay** (brushed metal circulaire, z-5)
3. **Scan-lines** (z-10)
4. **Spotlight** (diagonal light ray, z-15)
5. **Holographic scan** (Diamant/Légende only, z-18)
6. **Rainbow overlay** (Légende only, z-19)
7. **Particles** (Diamant/Légende, z-22)
8. **Contenu** (z-20) : Logo VELOCARD, Avatar, Nom, OVR gros, 6 stats hexagonales, tier label

### 3.3 — Affichage OVR

L'OVR doit être affiché en GRAND (font-size 48px minimum), avec la font `JetBrains Mono`, en couleur accent du tier, entre le nom et les stats.

### 3.4 — 6 stats hexagonales (2 rangées de 3)

Garder le composant `StatHex` existant mais :
- Renommer les labels : PAC, MON, VAL (row 1), SPR, END, RES (row 2)
- Adapter les couleurs par tier
- Ajouter pulse animation pour les stats ≥ 90

### 3.5 — Effets visuels par tier

| Tier | Effets |
|---|---|
| Bronze | Gradient simple, texture brushed metal, glow subtil |
| Argent | Idem + shimmer légèrement plus visible |
| Platine | Idem + reflet bleuté, glow plus fort |
| Diamant | + Particules flottantes (8-12), barre de scan holographique descendante |
| Légende | + Tout Diamant + overlay arc-en-ciel animé (rotate 360° en 6s), plus de particules (20+) |

### 3.6 — Composant Particles (CSS only)

```css
@keyframes float-particle {
  0% { transform: translateY(100%) translateX(0); opacity: 0; }
  10% { opacity: 0.8; }
  90% { opacity: 0.8; }
  100% { transform: translateY(-100%) translateX(20px); opacity: 0; }
}

.particle {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--tier-accent);
  animation: float-particle var(--duration) linear infinite;
  animation-delay: var(--delay);
  left: var(--left);
}
```

Générer les particules en JSX avec des `--delay`, `--left`, `--duration` randomisés.

**Commit** : `feat: VeloCard component — 5 premium tiers with particles, holo scan, rainbow`

---

## ÉTAPE 4 — Widget Carte sur le Dashboard (Home)

**But** : Ajouter un widget compact de la carte sur le dashboard.

**Référence design** : `phase4-etape3-2-integration-home.html`

### 4.1 — Créer `src/components/CardWidget.tsx`

Widget compact (~120px de haut) qui contient :
- Mini-carte thumbnail (64×92px) à gauche
- Nom + Tier label + OVR à droite
- Barre de progression vers le prochain tier (avec couleur du tier actuel)
- 6 mini stat pills (PAC 72, MON 68, etc.)
- Cliquer → naviguer vers le profil/carte full screen

### 4.2 — Intégrer dans `src/app/dashboard/page.tsx`

Placer le widget en haut du dashboard, avant les autres sections.

### 4.3 — Edge cases

- **Nouvel utilisateur** (0 activités) : Widget avec "Connecte Strava pour générer ta carte"
- **OVR en hausse** : Petite flèche verte ↑ à côté de l'OVR
- **Level up** : Animation spéciale quand le tier change (glow pulse + confetti)

**Commit** : `feat: card widget on dashboard — compact view with progress bar`

---

## ÉTAPE 5 — Flip Card sur le Profil

**But** : Carte interactive avec effet flip 3D (clic = retourne).

**Référence design** : `phase4-etape3-3-integration-profil.html`

### 5.1 — Créer `src/components/FlipCard.tsx`

```typescript
// CSS 3D flip
// Container : perspective: 1200px
// Inner : transition: transform 0.8s
// Flipped : transform: rotateY(180deg)
// Front & Back : backface-visibility: hidden
// Back : transform: rotateY(180deg) (pré-retourné)
```

**Face avant** : Le composant VeloCard complet (taille L : 180×262px)

**Face arrière** :
- Radar hexagonal SVG (6 axes pour les 6 stats)
- 6 barres d'évolution avec delta (↑+3, ↓-2)
- Mini graphe historique OVR (6 derniers mois)
- Même background tier que la face avant

### 5.2 — Radar SVG hexagonal

Créer un composant `src/components/RadarChart.tsx` :
- Hexagone avec 3 niveaux de grille (33%, 66%, 100%)
- Polygone rempli avec les valeurs des stats (couleur accent du tier, opacité 0.3 fill + 1.0 stroke)
- Labels aux 6 sommets : PAC, MON, VAL, SPR, END, RES

### 5.3 — Intégrer la FlipCard dans la page profil

Si une page profil existe, l'ajouter. Sinon, créer `src/app/profile/page.tsx` avec :
- Bannière en haut avec couleur du tier
- FlipCard centrée
- Bouton "Partager ma carte" (ouvre le flow de partage)
- Bouton "Comparer" (futur)

**Commit** : `feat: flip card on profile — 3D CSS flip + radar SVG + evolution bars`

---

## ÉTAPE 6 — Leaderboard avec Mini-Cartes

**But** : Intégrer les cartes dans le classement.

**Référence design** : `phase4-etape3-4-integration-classements.html`

### 6.1 — Podium Top 3

Créer `src/components/Podium.tsx` :
- 3 cartes en taille M (88×128px) pour le top 3
- Disposition : #2 à gauche (plus petit), #1 au centre (plus grand, surélevé), #3 à droite
- Chaque carte a le glow de son tier
- Badge de rang en overlay (🥇🥈🥉)

### 6.2 — Modifier `LeaderboardRow.tsx`

- Ajouter une mini-carte (36×52px, taille XS) à gauche de chaque ligne
- La mini-carte a le fond du tier du joueur
- Au clic sur une ligne : overlay avec la carte en grand (200×292px) + bouton "Voir profil"

### 6.3 — Nouveaux onglets

Modifier `src/app/leaderboard/page.tsx` pour ajouter des tabs :
- **OVR Global** (trié par OVR, pas juste weekly_km)
- **Amis** (futur — filtre par follows)
- **Club** (filtre par club)
- **Par Attribut** (6 sous-classements : meilleur PAC, meilleur MON, etc.)

### 6.4 — Tab "Par Attribut"

Ajouter un sélecteur de stat (PAC/MON/VAL/SPR/END/RES) et trier le leaderboard par cette stat spécifique. Ça démocratise la compétition : un grimpeur peut être #1 en MON même s'il est bronze en OVR.

**Commit** : `feat: leaderboard — podium top 3, mini-cards, attribute tabs`

---

## ÉTAPE 7 — Instagram Story Sharing

**But** : Générer une image/story partageable de la carte.

**Référence design** : `phase4-etape3-1-story-instagram.html`

### 7.1 — Créer `src/components/StoryCanvas.tsx`

Canvas en format 9:16 (1080×1920) contenant :
- Background plein écran avec gradient du tier
- Particules/effets du tier
- Carte centrée (taille L)
- Barre de stats du dernier ride en bas (distance, D+, durée)
- CTA "Scanne pour voir ma carte" + placeholder QR code
- Branding "VELOCARD" en watermark subtil

### 7.2 — Bouton de partage

Utiliser la librairie `html-to-image` (déjà installée) pour convertir le StoryCanvas en PNG.

```typescript
import { toPng } from 'html-to-image';

async function generateStory() {
  const node = document.getElementById('story-canvas');
  const dataUrl = await toPng(node, { width: 1080, height: 1920, pixelRatio: 1 });
  // Télécharger ou partager via Web Share API
  if (navigator.share) {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], 'velocard-story.png', { type: 'image/png' });
    await navigator.share({ files: [file] });
  } else {
    // Fallback : download
    const link = document.createElement('a');
    link.download = 'velocard-story.png';
    link.href = dataUrl;
    link.click();
  }
}
```

### 7.3 — Story "Level Up"

Variante spéciale quand le tier change : montrer l'ancien tier → animation → nouveau tier.
Exemple : "ARGENT → PLATINE 🎉"

### 7.4 — Intégrer le bouton "Partager" partout

- Sur le dashboard (après sync Strava)
- Sur le profil (à côté de la FlipCard)
- Sur le leaderboard (quand on est #1 ou qu'on monte)

**Commit** : `feat: Instagram story sharing — 9:16 canvas + download + Web Share API`

---

## ÉTAPE 8 — Thème Dark Premium Global

**But** : Appliquer le thème dark premium à TOUTES les pages existantes.

### 8.1 — Dashboard (`/dashboard`)

- Background : `#0A0A12`
- Cards/sections : `#1A1A2E` avec `border: 1px solid rgba(255,255,255,0.06)`
- Texte principal : `#FFFFFF`, secondaire : `#A0A0B8`
- Accents : Violet `#6C5CE7` pour les boutons primaires, Mint `#00F5D4` pour les success/highlights
- Icônes : Remplacer les couleurs actuelles par les accents violet/mint

### 8.2 — Leaderboard (`/leaderboard`)

- Appliquer le même thème dark
- Les lignes du leaderboard avec fond `#12121E` et hover `#1A1A2E`

### 8.3 — Clubs (`/clubs`)

- Cards clubs en dark avec le logo du club en glow subtil

### 8.4 — Races (`/races`)

- Même thème dark
- Badges de difficulté avec les couleurs violet/mint

### 8.5 — Wars (`/wars`)

- Même thème dark premium
- Les barres de progression des tours avec gradient violet → mint

### 8.6 — Page d'accueil (`/`)

- Hero section premium avec fond animé (particules ou gradient animé)
- CTA "Connecte Strava" en bouton violet bold

### 8.7 — Navigation (`BottomTabBar.tsx`)

- Fond : `rgba(10, 10, 18, 0.95)` avec `backdrop-filter: blur(20px)`
- Icône active : Mint `#00F5D4`
- Icône inactive : `#5A5A72`

**Commit** : `feat: dark premium theme applied to all pages`

---

## ÉTAPE 9 — Animations & Micro-interactions

**But** : Ajouter les animations premium partout.

### 9.1 — Page transitions

Utiliser Framer Motion (déjà installé) pour des transitions `fadeIn + slideUp` entre les pages.

### 9.2 — OVR counter animation

Quand l'OVR apparaît, compter de 0 à la valeur finale en 1.5s avec easing.

```typescript
function useCountUp(target: number, duration: number = 1500) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const startTime = performance.now();
    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }, [target, duration]);
  return count;
}
```

### 9.3 — Staggered reveal

Les stat pills et les cartes apparaissent avec un délai progressif (50ms entre chaque).

### 9.4 — Glow pulse pour les tier élevés

Les cartes Diamant et Légende ont un glow qui pulse doucement (2s cycle).

### 9.5 — Haptic-ready

Préparer les hooks pour le haptic feedback (pas de vibration sur web, mais structurer pour React Native futur).

**Commit** : `feat: animations — OVR counter, staggered reveal, glow pulse`

---

## ÉTAPE 10 — QR Code & Viral Loop

**But** : Ajouter le QR code deep link pour la boucle virale.

### 10.1 — Installer qrcode

```bash
npm install qrcode
npm install -D @types/qrcode
```

### 10.2 — Créer `src/components/QRCode.tsx`

Composant qui génère un QR code vers `https://velocard.app/card/{userId}`.

### 10.3 — Intégrer dans la Story

Remplacer le placeholder QR code dans le StoryCanvas par le vrai QR code.

### 10.4 — Page `/card/[userId]`

Cette page existe déjà (`src/app/card/[userId]/page.tsx`). Vérifier qu'elle :
- Affiche la carte complète du user en mode lecture seule
- Fonctionne pour les visiteurs non connectés
- A un CTA "Crée ta carte" pour les non-inscrits
- Utilise le nouveau design premium

**Commit** : `feat: QR code deep link + viral loop on story & card page`

---

## ÉTAPE 11 — Vérification Finale & Tests

**But** : S'assurer que tout fonctionne.

### 11.1 — Vérifier le build

```bash
npm run build
```

Corriger toutes les erreurs TypeScript.

### 11.2 — Vérifier chaque page

- `/` — Landing page
- `/dashboard` — Dashboard avec widget carte
- `/leaderboard` — Leaderboard avec podium et mini-cartes
- `/clubs` — Clubs
- `/races` — Courses
- `/wars` — Squad Wars
- `/card/[userId]` — Carte publique

### 11.3 — Vérifier la cohérence des tiers

Les 5 tiers doivent être visuellement distincts et cohérents partout.

### 11.4 — Vérifier les animations

- OVR counter ✓
- Flip card ✓
- Particules Diamant/Légende ✓
- Glow pulse ✓
- Story generation ✓

### 11.5 — Performance

- Pas de layout shift sur le dashboard
- Story PNG générée en <800ms
- Widget carte rendu en <2ms

**Commit** : `chore: final verification — build passing, all pages tested`

---

## RÉSUMÉ DES FICHIERS À CRÉER/MODIFIER

### Fichiers à MODIFIER :
| Fichier | Changement |
|---|---|
| `src/app/globals.css` | Nouveaux design tokens + 5 tiers CSS |
| `src/app/layout.tsx` | Fonts + body dark |
| `src/types/index.ts` | Rename stats + 5 tiers + OVR |
| `src/lib/stats.ts` | Rename + OVR formula + getTier 5 niveaux |
| `src/lib/badges.ts` | Rename stat refs |
| `src/components/VeloCard.tsx` | 5 tiers + OVR + particules + holo |
| `src/components/VeloCardInteractive.tsx` | Adapter au nouveau système |
| `src/components/LeaderboardRow.tsx` | Mini-carte + couleurs tier |
| `src/components/BottomTabBar.tsx` | Dark theme + mint accent |
| `src/app/dashboard/page.tsx` | Widget carte + dark theme |
| `src/app/dashboard/VeloCardSection.tsx` | Adapter stats rename |
| `src/app/dashboard/VeloCardClient.tsx` | Adapter stats rename |
| `src/app/leaderboard/page.tsx` | Podium + onglets + attributs |
| `src/app/card/[userId]/page.tsx` | Nouveau design premium |
| `src/app/page.tsx` | Landing dark premium |
| `src/app/clubs/page.tsx` | Dark theme |
| `src/app/races/page.tsx` | Dark theme |
| `src/app/wars/page.tsx` | Dark theme |
| `src/app/api/leaderboard/route.ts` | Rename stats + OVR sort |
| `src/app/api/strava/sync/route.ts` | Rename stats |

### Fichiers à CRÉER :
| Fichier | Description |
|---|---|
| `src/components/CardWidget.tsx` | Widget compact carte dashboard |
| `src/components/FlipCard.tsx` | Carte avec flip 3D |
| `src/components/RadarChart.tsx` | Radar hexagonal SVG |
| `src/components/Podium.tsx` | Podium top 3 leaderboard |
| `src/components/StoryCanvas.tsx` | Canvas story Instagram |
| `src/components/QRCode.tsx` | QR code deep link |
| `src/components/Particles.tsx` | Particules flottantes CSS |
| `src/hooks/useCountUp.ts` | Animation compteur OVR |
| `src/app/profile/page.tsx` | Page profil avec FlipCard |
| `supabase/migrations/XXX_rename_stats.sql` | Migration DB |

---

## CHECKLIST FINALE

- [ ] 5 tiers visuellement distincts (Bronze, Argent, Platine, Diamant, Légende)
- [ ] OVR affiché en gros sur chaque carte
- [ ] 6 stats renommées (PAC, MON, VAL, SPR, END, RES)
- [ ] Formule OVR : `pac×0.15 + mon×0.20 + val×0.10 + spr×0.10 + end×0.15 + res×0.30`
- [ ] Widget carte sur le dashboard
- [ ] Flip card 3D sur le profil
- [ ] Radar SVG hexagonal au verso
- [ ] Podium top 3 sur le leaderboard
- [ ] Mini-cartes dans les lignes du leaderboard
- [ ] Tab "Par Attribut" sur le leaderboard
- [ ] Story Instagram partageable (1080×1920)
- [ ] QR code deep link sur la story
- [ ] Thème dark premium (#0A0A12) sur toutes les pages
- [ ] Fonts : Space Grotesk (titres), Inter (body), JetBrains Mono (data)
- [ ] Couleurs signature : Violet #6C5CE7, Mint #00F5D4
- [ ] Animations : OVR counter, staggered reveal, glow pulse
- [ ] Particules sur Diamant et Légende
- [ ] Holographic scan sur Diamant et Légende
- [ ] Rainbow overlay sur Légende
- [ ] Build Next.js sans erreur
- [ ] Migration Supabase appliquée

---

## NOTES POUR CLAUDE CODE

1. **Ne change JAMAIS la logique d'auth** (NextAuth + Strava OAuth). Elle fonctionne, n'y touche pas.
2. **Ne change JAMAIS la structure Supabase** au-delà de la migration de renommage.
3. **Garde la compatibilité** avec les features existantes (clubs, races, wars, ghost cards).
4. **Consulte les fichiers `phase*.html`** dans le dossier racine pour les spécifications visuelles détaillées.
5. **Taille des cartes** : XS (36×52), S (64×92), M (88×128), L (180×262), XL (260×380). Utilise la bonne taille selon le contexte.
6. **Chaque étape = un commit**. Ne fais pas tout d'un coup.
7. **Si un fichier n'existe pas** dans la liste des fichiers à modifier, saute cette modification et passe à la suivante.
8. **Teste le build** (`npm run build`) à la fin de chaque étape pour ne pas accumuler les erreurs.
