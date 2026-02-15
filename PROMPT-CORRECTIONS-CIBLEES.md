# PROMPT CORRECTIONS CIBLÉES — VeloCard

> **INSTRUCTION** : Ce prompt contient 4 corrections précises à appliquer.
> Chaque correction a le fichier exact, le code actuel, et le code attendu.
> Applique-les dans l'ordre. Fais un commit après chaque correction.
> **NE MODIFIE RIEN D'AUTRE que ce qui est demandé.**

---

## CORRECTION 1 — Animation OVR sur VeloCard.tsx

**Fichier** : `src/components/VeloCard.tsx`

**Problème** : L'OVR (le gros chiffre 48px au centre de la carte) s'affiche en statique `{stats.ovr}`. Il devrait s'animer de 0 à la valeur finale comme dans `CardWidget.tsx`.

**Ce qu'il faut faire** :

1. Ajouter l'import du hook en haut du fichier :
```typescript
import { useCountUp } from "@/hooks/useCountUp";
```

2. Dans le composant `VeloCard`, ajouter cette ligne juste après `const config = tierConfig[tier];` :
```typescript
const animatedOvr = useCountUp(stats.ovr);
```

3. Remplacer l'affichage statique de l'OVR. Chercher cette ligne :
```tsx
{stats.ovr}
```
dans le `<p>` avec la classe `text-[48px]`, et la remplacer par :
```tsx
{animatedOvr}
```

**Résultat attendu** : Quand la carte apparaît, l'OVR compte de 0 jusqu'à la valeur réelle en 1.5s avec un easing.

**Commit** : `fix: animate OVR count-up on main VeloCard component`

---

## CORRECTION 2 — Mini-cartes dans LeaderboardRow.tsx

**Fichier** : `src/components/LeaderboardRow.tsx`

**Problème** : Chaque ligne du leaderboard affiche seulement un avatar rond. Il devrait y avoir une mini-carte (36×52px) avec le fond du tier à la place.

**Remplacer TOUT le contenu du fichier par** :

```tsx
"use client";

import type { LeaderboardEntry, CardTier } from "@/types";

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}

const tierColors: Record<CardTier, string> = {
  bronze: "text-amber-500 bg-amber-500/10 border-amber-800/50",
  argent: "text-slate-300 bg-slate-300/10 border-slate-600/50",
  platine: "text-[#A8D8EA] bg-[#A8D8EA]/10 border-[#A8D8EA]/30",
  diamant: "text-[#B9F2FF] bg-[#B9F2FF]/10 border-[#B9F2FF]/30",
  legende: "text-yellow-400 bg-yellow-400/10 border-yellow-600/50",
};

const rankColors: Record<number, string> = {
  1: "text-yellow-400",
  2: "text-slate-300",
  3: "text-amber-600",
};

/* Mini-card background per tier */
const miniCardBg: Record<CardTier, string> = {
  bronze: "bg-gradient-to-b from-[#1A1208] to-[#2D1F0E]",
  argent: "bg-gradient-to-b from-[#14141E] to-[#1E1E2E]",
  platine: "bg-gradient-to-b from-[#1A1A2E] to-[#2A2A42]",
  diamant: "bg-gradient-to-b from-[#0A1628] to-[#162040]",
  legende: "bg-gradient-to-b from-[#1A0A2E] to-[#2E1A0A]",
};

const miniCardBorder: Record<CardTier, string> = {
  bronze: "border-[#cd7f32]/40",
  argent: "border-[#C0C0C0]/30",
  platine: "border-[#A8D8EA]/30",
  diamant: "border-[#B9F2FF]/30",
  legende: "border-[#ffd700]/40",
};

const miniCardAccent: Record<CardTier, string> = {
  bronze: "text-[#cd7f32]",
  argent: "text-[#C0C0C0]",
  platine: "text-[#A8D8EA]",
  diamant: "text-[#B9F2FF]",
  legende: "text-[#FFD700]",
};

export default function LeaderboardRow({
  entry,
  isCurrentUser,
}: LeaderboardRowProps) {
  const tier = entry.tier as CardTier;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-3 ${
        isCurrentUser
          ? "border-[#00F5D4]/20 bg-[#00F5D4]/5"
          : "border-white/[0.06] bg-[#12121E] hover:bg-[#1A1A2E]"
      }`}
    >
      {/* Rank */}
      <span
        className={`w-7 text-center text-lg font-black font-['JetBrains_Mono'] ${rankColors[entry.rank] || "text-[#5A5A72]"}`}
      >
        {entry.rank}
      </span>

      {/* Mini-card (36×52px) — replaces simple avatar */}
      <div
        className={`relative flex h-[52px] w-[36px] flex-shrink-0 flex-col items-center justify-center overflow-hidden rounded-md border ${miniCardBg[tier]} ${miniCardBorder[tier]}`}
      >
        {/* Scan-lines micro */}
        <div className="scan-lines pointer-events-none absolute inset-0 opacity-50" />

        {/* Avatar mini */}
        {entry.avatar_url ? (
          <img
            src={entry.avatar_url}
            alt=""
            className="h-5 w-5 rounded-full border border-white/20 object-cover"
          />
        ) : (
          <div className="h-5 w-5 rounded-full bg-[#6C5CE7]" />
        )}

        {/* OVR mini */}
        <span
          className={`mt-0.5 text-[9px] font-black leading-none font-['JetBrains_Mono'] ${miniCardAccent[tier]}`}
        >
          {entry.ovr}
        </span>

        {/* Tier label micro */}
        <span className="text-[5px] font-bold uppercase tracking-wider text-white/30">
          {tier.slice(0, 3)}
        </span>
      </div>

      {/* Name + tier badge */}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold text-white">
          {entry.username}
        </p>
        <span
          className={`inline-block rounded-full border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${tierColors[tier]}`}
        >
          {tier}
        </span>
      </div>

      {/* Weekly stats */}
      <div className="flex gap-3 text-xs">
        <div className="text-center">
          <p className="font-bold text-white font-['JetBrains_Mono']">{entry.weekly_km}</p>
          <p className="text-[#5A5A72]">km</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-white font-['JetBrains_Mono']">{entry.weekly_dplus}</p>
          <p className="text-[#5A5A72]">D+</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-white font-['JetBrains_Mono']">{entry.ovr}</p>
          <p className="text-[#5A5A72]">OVR</p>
        </div>
      </div>
    </div>
  );
}
```

**Points clés du changement** :
- L'avatar rond (8×8) est remplacé par une mini-carte `36×52px` avec le fond gradient du tier
- La mini-carte contient : avatar 5×5, OVR en JetBrains Mono, label tier tronqué (3 lettres)
- Les stats affichent maintenant l'OVR au lieu du card_score
- Le rank utilise JetBrains Mono pour la cohérence typo

**Commit** : `feat: add mini-card thumbnails (36×52px) to leaderboard rows`

---

## CORRECTION 3 — Bouton Partager sur le profil

**Fichier** : `src/app/profile/ProfileClient.tsx`

**Problème** : Le `DownloadButton` (qui génère la Story Instagram avec QR code) existe mais n'est pas intégré dans la page profil. Il est uniquement sur le dashboard.

**Remplacer TOUT le contenu du fichier par** :

```tsx
"use client";

import Link from "next/link";
import FlipCard from "@/components/FlipCard";
import DownloadButton from "@/components/DownloadButton";
import type { ComputedStats, CardTier, Badge, ClubInfo } from "@/types";
import { tierConfig } from "@/components/VeloCard";

interface ProfileClientProps {
  username: string;
  avatarUrl: string | null;
  stats: ComputedStats;
  tier: CardTier;
  badges: Badge[];
  clubs: ClubInfo[];
  userId: string;
}

const tierAccentHex: Record<CardTier, string> = {
  bronze: "#cd7f32",
  argent: "#C0C0C0",
  platine: "#A8D8EA",
  diamant: "#B9F2FF",
  legende: "#FFD700",
};

export default function ProfileClient({
  username,
  avatarUrl,
  stats,
  tier,
  badges,
  clubs,
  userId,
}: ProfileClientProps) {
  const config = tierConfig[tier];
  const accent = tierAccentHex[tier];

  return (
    <main className="flex min-h-screen flex-col items-center px-4 pb-24 pt-8">
      {/* Tier banner */}
      <div
        className="absolute left-0 right-0 top-0 h-32"
        style={{
          background: `linear-gradient(180deg, ${accent}15 0%, transparent 100%)`,
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex flex-col items-center">
        <h1 className="text-lg font-bold text-white font-['Space_Grotesk']">
          {username}
        </h1>
        <span
          className="mt-1 text-[10px] font-bold tracking-[0.2em]"
          style={{ color: accent }}
        >
          {config.label} TIER
        </span>
      </div>

      {/* Flip card */}
      <div className="relative z-10 mt-6">
        <FlipCard
          username={username}
          avatarUrl={avatarUrl}
          stats={stats}
          tier={tier}
          badges={badges}
          clubs={clubs}
        />
        <p className="mt-3 text-center text-[10px] text-white/30">
          Touche la carte pour la retourner
        </p>
      </div>

      {/* Actions */}
      <div className="relative z-10 mt-6 flex flex-col items-center gap-3">
        <div className="flex gap-3">
          <Link
            href={`/card/${userId}`}
            className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Voir la carte
          </Link>
          <button
            className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/40 transition"
            disabled
            title="Bientôt disponible"
          >
            Comparer
          </button>
        </div>

        {/* Partager Story Instagram — uses DownloadButton with StoryCanvas */}
        <DownloadButton tier={tier} userId={userId} />
      </div>
    </main>
  );
}
```

**Points clés du changement** :
- Import de `DownloadButton` ajouté
- Le bouton "Partager pour Instagram" apparaît sous les boutons "Voir la carte" / "Comparer"
- Les boutons sont maintenant dans un `flex-col` pour empiler les 2 rangées proprement
- Le `DownloadButton` cible `#velo-card` qui est le `id` du composant VeloCard à l'intérieur du FlipCard

**ATTENTION** : Le `DownloadButton` cherche `document.getElementById("velo-card")`. Or dans le profil, la carte est dans un `FlipCard`. Il faut vérifier que le FlipCard rend bien un `VeloCard` avec `id="velo-card"` côté face avant. Si ce n'est pas le cas, il faudra s'assurer que le FlipCard expose ce composant avec cet id. Lis `src/components/FlipCard.tsx` pour vérifier — si le VeloCard dans le FlipCard n'a pas `id="velo-card"`, le DownloadButton ne trouvera pas la carte. Dans ce cas, ajoute un wrapper `<div id="velo-card-profile">` autour du FlipCard et modifie le DownloadButton pour accepter un `cardId` optionnel.

**Commit** : `feat: add share story button to profile page`

---

## CORRECTION 4 — Animation Level Up (toast notification)

**Problème** : Quand un utilisateur change de tier (ex: Argent → Platine), rien ne se passe visuellement. Il faut une notification/toast festive.

### 4.1 — Créer `src/components/LevelUpToast.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import type { CardTier } from "@/types";

interface LevelUpToastProps {
  previousTier: CardTier | null;
  currentTier: CardTier;
}

const tierLabels: Record<CardTier, string> = {
  bronze: "BRONZE",
  argent: "ARGENT",
  platine: "PLATINE",
  diamant: "DIAMANT",
  legende: "LÉGENDE",
};

const tierAccents: Record<CardTier, string> = {
  bronze: "#cd7f32",
  argent: "#C0C0C0",
  platine: "#A8D8EA",
  diamant: "#B9F2FF",
  legende: "#FFD700",
};

const tierEmoji: Record<CardTier, string> = {
  bronze: "🥉",
  argent: "🥈",
  platine: "💎",
  diamant: "💠",
  legende: "👑",
};

export default function LevelUpToast({ previousTier, currentTier }: LevelUpToastProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Only show if tier actually changed (and previousTier is known)
    if (!previousTier || previousTier === currentTier) return;

    // Check tier order to only show on UPGRADE (not downgrade)
    const tierOrder: CardTier[] = ["bronze", "argent", "platine", "diamant", "legende"];
    const prevIdx = tierOrder.indexOf(previousTier);
    const currIdx = tierOrder.indexOf(currentTier);
    if (currIdx <= prevIdx) return;

    setVisible(true);

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => {
        setVisible(false);
        setExiting(false);
      }, 500);
    }, 5000);

    return () => clearTimeout(timer);
  }, [previousTier, currentTier]);

  if (!visible || !previousTier) return null;

  const accent = tierAccents[currentTier];

  return (
    <div
      className={`fixed top-6 left-1/2 z-[9999] -translate-x-1/2 transition-all duration-500 ${
        exiting ? "translate-y-[-100px] opacity-0" : "translate-y-0 opacity-100"
      }`}
      style={{
        animation: exiting ? undefined : "slideDown 0.5s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      <div
        className="relative overflow-hidden rounded-2xl border px-6 py-4 backdrop-blur-xl"
        style={{
          backgroundColor: "rgba(10,10,18,0.9)",
          borderColor: `${accent}40`,
          boxShadow: `0 0 40px ${accent}30, 0 20px 60px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Glow bar at top */}
        <div
          className="absolute left-0 right-0 top-0 h-[2px]"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
        />

        <div className="flex items-center gap-4">
          {/* Emoji */}
          <span className="text-3xl">{tierEmoji[currentTier]}</span>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
              Level Up !
            </p>
            <p className="mt-0.5 text-base font-bold text-white font-['Space_Grotesk']">
              <span className="text-white/40">{tierLabels[previousTier]}</span>
              <span className="mx-2 text-white/30">→</span>
              <span style={{ color: accent }}>{tierLabels[currentTier]}</span>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from { transform: translate(-50%, -100px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
```

### 4.2 — Intégrer le LevelUpToast dans le Dashboard

**Fichier** : `src/app/dashboard/VeloCardClient.tsx`

Dans ce fichier, il faut :

1. Importer le composant :
```typescript
import LevelUpToast from "@/components/LevelUpToast";
```

2. Ajouter un state pour stocker le tier précédent :
```typescript
const [previousTier, setPreviousTier] = useState<CardTier | null>(null);
```

3. Au montage du composant, lire le tier précédent depuis `sessionStorage` et sauvegarder le tier actuel :
```typescript
useEffect(() => {
  const stored = sessionStorage.getItem("velocard-prev-tier") as CardTier | null;
  if (stored && stored !== tier) {
    setPreviousTier(stored);
  }
  sessionStorage.setItem("velocard-prev-tier", tier);
}, [tier]);
```

4. Rendre le toast dans le JSX (tout en haut, avant le reste) :
```tsx
<LevelUpToast previousTier={previousTier} currentTier={tier} />
```

**Le toast apparaîtra automatiquement** quand le tier change entre 2 visites, avec l'animation "ARGENT → PLATINE 💎" pendant 5 secondes puis disparaît.

**Commit** : `feat: level-up toast notification on tier promotion`

---

## VÉRIFICATION FINALE

Après les 4 corrections, lance :

```bash
npm run build
```

Et vérifie que :
- [ ] L'OVR s'anime sur la grande carte (VeloCard.tsx)
- [ ] Les lignes du leaderboard ont des mini-cartes 36×52px
- [ ] Le profil a un bouton "Partager pour Instagram"
- [ ] Le toast Level Up s'affiche quand le tier change

**Commit final** : `chore: all corrections applied — build verified`
