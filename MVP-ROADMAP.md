# VELOCARD — Roadmap MVP vers 1M€/mois

## AUDIT DE L'EXISTANT (ce qui est déjà codé)

### ✅ Déjà implémenté
- **Carte Joueur** : 6 stats (PAC, MON, VAL, SPR, END, RES) + OVR + 5 tiers (Bronze→Légende)
- **Design premium** : Effets holographiques, particules, shimmer, scan-lines, gyroscope
- **Strava OAuth** : Login + sync des activités
- **Moteur de stats** : Calcul automatique depuis les données Strava
- **Clubs** : Créer, rejoindre, quitter
- **Leaderboard** : Multi-tri (km, D+, score carte, stats individuelles)
- **Guerre des Pelotons** : Club vs Club avec 3 tours (Roi, Montagne, Sprint)
- **Courses** : Créer, rejoindre, résultats OCR
- **Ghost Cards** : Growth hack — cartes fantômes pour non-inscrits avec lien de claim
- **Analyse GPX** : Upload de parcours + indice de difficulté (RDI)
- **Météo** : Intégrée à l'analyse de parcours
- **QR Code** : Partage de profil
- **Story Instagram** : Canvas de partage
- **Profil** : Avec sélecteur de région
- **Badges/PlayStyles** : Système de badges
- **Animations** : Framer Motion, gyroscope, haptic feedback
- **Bottom Tab Bar** : Navigation mobile-first

### ❌ Pas encore implémenté (features clés des PDFs)
1. **Monday Update** — Recalcul hebdomadaire automatique des stats
2. **Duels Head-to-Head** — Défis entre cyclistes
3. **IA Journaliste** — Feed d'articles générés par IA
4. **Chat d'Équipe** — Messagerie de clan
5. **Abonnement Pro** — Paywall + cartes spéciales (TOTW, In-Form, Légende)
6. **Coach IA** — Entraînements personnalisés + données Garmin
7. **Clans libres** — Équipes cross-clubs
8. **Interview IA post-course** — Questions personnalisées pour article sur mesure
9. **Système de Ligue** — Classement par performance (pas que stats physiques)

---

## DONNÉES MARCHÉ CLÉS (pour le pitch)

| Métrique | Benchmark | Objectif VeloCard |
|----------|-----------|-------------------|
| Marché apps cyclisme virtuel | 1.85Md$ (2024) → 4.25Md$ (2033) | Part de marché niche "gamification sociale" |
| DAU/MAU ratio | 20-30% (Strava ~30%) | **25%+** |
| Rétention J30 | 27.2% moyenne, 47.5% top | **35%+** |
| ARPU cycling premium | 60-80€/an | **9.99€/mois = 120€/an** |
| Strava pricing | 11.99€/mois | On est en dessous |
| Zwift pricing | 19.99€/mois | On est bien en dessous |
| Churn mensuel acceptable | <5% | **<4%** |

**Calcul objectif 1M€/mois :**
- À 9.99€/mois → il faut ~100 000 abonnés payants
- Avec un taux de conversion freemium de 5-8% → besoin de 1.25M-2M users total
- Avec un taux de 15% (gaming/collectible) → besoin de ~667K users total

---

## PHASES D'IMPLÉMENTATION

### PHASE 1 : LE CŒUR ADDICTIF (Semaine 1-2)
> Objectif : Rendre les cartes irrésistibles et le "Monday Update" addictif

**1A. Renommer les stats selon le PDF final**
- END → Endurance, SPR → Sprint, GRM → Grimpeur, CLM → Contre-la-montre, RES → Résistance, RACE → Course
- Adapter le barème pour coller au PDF

**1B. Monday Update (Cron Job)**
- Chaque lundi à 6h : recalcul des stats de TOUS les utilisateurs
- Input : 50 dernières sorties Strava + résultats de courses
- Notification push : "Ta carte a été mise à jour ! OVR: 78 → 79 (+1)"
- Si pas d'activité → les stats baissent légèrement (rétention par la peur)

**1C. Cartes Spéciales (designs premium)**
- "Team of the Week" (TOTW) — Fond noir, meilleurs joueurs de la semaine
- "In-Form" (IF) — Fond flammes, joueurs en forme
- "Légende" — Fond holographique animé
- "Event" — Designs saisonniers (Tour de France, Noël, etc.)

**1D. Système de Ligue**
- Ligue séparée de la note de carte
- Points gagnés en battant des gens en duel + résultats de course
- Divisions : Bronze → Argent → Or → Platine → Diamant → Légende

### PHASE 2 : LA COMPÉTITION SOCIALE (Semaine 3-4)
> Objectif : Les gens reviennent pour battre leurs potes

**2A. Duels Head-to-Head**
- Bouton "Défier" sur chaque profil
- QR Code pour défier en personne
- Types de défis : "Plus de D+ ce week-end", "Plus de km cette semaine", etc.
- Historique : "Victoires vs Hugo : 3-1"

**2B. Notifications Push (PWA)**
- Service Worker pour les notifications push
- "Tu as reçu un défi de @Lucas !"
- "Monday Update : ta carte a évolué !"
- "Ton ami @Marie a battu ton record !"

**2C. Feed Social amélioré**
- Activité des amis (a battu un record, nouvelle carte, duel gagné)
- Système de "Kudos" comme Strava mais avec des réactions vélo

### PHASE 3 : LE BUSINESS MODEL (Semaine 5-6)
> Objectif : Prouver que les gens paient

**3A. Stripe Integration**
- Abonnement mensuel 9.99€/mois
- Abonnement annuel 79.99€/an (33% de réduction)
- Free trial 7 jours

**3B. Freemium vs Pro — Feature Gate**
- **Gratuit** : Carte standard (Bronze/Argent/Or), 1 club, stats basiques
- **Pro** : Cartes spéciales (TOTW, IF, Légende, Event), historique 2 ans, badges exclusifs, IA Journaliste avancée, duels illimités

**3C. In-App Purchases (optionnel v2)**
- Packs de designs de cartes
- Boost temporaire de visibilité dans le leaderboard

### PHASE 4 : L'IA QUI REND ACCRO (Semaine 7-8)
> Objectif : Le "wow effect" qui différencie VeloCard de tout le reste

**4A. IA Journaliste**
- Génère des mini-articles dans le feed des abonnés
- "🔥 Exploit du dimanche : Hugo a décroché une 5ème place au GP de Canohès !"
- Ton L'Équipe / France Football adapté au cyclisme amateur
- API : OpenAI GPT-4o-mini (très peu cher ~0.15$/1M tokens input)

**4B. Interview IA post-course**
- Après une course, l'IA pose 3-5 questions personnalisées
- "Comment s'est passé le sprint final ?" "Tu as senti la fatigue à quel moment ?"
- Génère un article "exclusif" avec citations du coureur
- Boost ego massif → partage sur Instagram → acquisition organique

**4C. Coach IA (v1 simple)**
- Suggestions d'entraînement basées sur les stats faibles
- "Ta stat MON est à 45. Voici un plan pour la monter : 2 sorties montagne/semaine"
- Plus tard : intégration Garmin pour sommeil/récupération

### PHASE 5 : GROWTH & SCALE (Semaine 9-10)
> Objectif : Acquisition virale + métriques investisseurs

**5A. PWA complète**
- Installable sur mobile (Add to Home Screen)
- Offline mode pour les cartes
- Push notifications natives

**5B. Système de parrainage**
- "Invite un ami → gagne 1 semaine Pro gratuite"
- Deep links + QR codes de parrainage

**5C. Intégration Garmin Connect**
- Sync sommeil, récupération, FC repos
- Le Coach IA utilise ces données pour des conseils personnalisés

**5D. Analytics & Métriques investisseurs**
- Dashboard admin : DAU/MAU, rétention J1/J7/J30, conversion freemium→pro
- Mixpanel ou PostHog (gratuit) pour le tracking

### PHASE 6 : APP STORE READY (Semaine 11-12)
> Objectif : Publication sur iOS + Android

**6A. Wrapper natif**
- Capacitor.js ou PWA Builder
- iOS App Store + Google Play Store

**6B. Polish final**
- Onboarding guidé (5 écrans)
- Animations de transition entre pages
- Dark mode (déjà le cas) + thème clair optionnel
- Localisation EN/FR/ES

---

## STACK TECHNIQUE RECOMMANDÉE

| Besoin | Solution | Coût |
|--------|----------|------|
| Frontend | Next.js 15 (déjà en place) | Gratuit |
| Backend/DB | Supabase (déjà en place) | Gratuit jusqu'à 50K MAU |
| Auth | NextAuth + Strava OAuth (déjà en place) | Gratuit |
| Paiements | Stripe | 1.4% + 0.25€ par transaction |
| IA articles | OpenAI GPT-4o-mini | ~10€/mois pour 10K articles |
| Push notifs | Web Push (Service Worker) | Gratuit |
| Analytics | PostHog | Gratuit jusqu'à 1M events/mois |
| Hosting | Vercel | Gratuit (hobby) → 20$/mois (pro) |
| Cron jobs | Vercel Cron ou Supabase Edge Functions | Gratuit |
| App stores | Capacitor.js / PWA Builder | Gratuit |

**Coût total MVP : ~30-50€/mois** (principalement Vercel Pro + OpenAI)

---

## MÉTRIQUES CIBLES POUR LEVER DES FONDS

### Seed Round (500K-1M€) — Mois 3-6
- 5 000+ utilisateurs inscrits
- 500+ abonnés payants (10% conversion)
- DAU/MAU > 20%
- Rétention J30 > 30%
- MRR > 5 000€

### Serie A (3-5M€) — Mois 12-18
- 50 000+ utilisateurs
- 5 000+ abonnés payants
- DAU/MAU > 25%
- Rétention J30 > 35%
- MRR > 50 000€
- Expansion 3+ pays

### Scale (10M+€) — Mois 24-36
- 500 000+ utilisateurs
- 50 000+ abonnés payants
- MRR > 500 000€
- Objectif 1M€/mois CA
