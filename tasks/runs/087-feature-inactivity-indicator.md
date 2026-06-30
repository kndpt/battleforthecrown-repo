# Run #087 — feature-inactivity-indicator

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Hors phase MVP stricte — spec 18 post-MVP. Tranche cadrée (indicateur pré-abandon non destructif), lot « lisibilité carte / fiches publiques » (continuité runs 059/060/082). Pas de basculement gameplay.
- **Spec source** : [`docs/gameplay/18-inactivity-and-abandonment.md`](../../docs/gameplay/18-inactivity-and-abandonment.md) § « Questions à trancher » → ligne « Affichage carte » (indicateur visuel des comptes inactifs, gris à la Kingsage, **avant** basculement, entre J+7 et J+14).
- **Type** : feature
- **Modules** : shared `world/` (helper pur) | backend `users/public-profile` | frontend `features/world` (PublicPlayerProfileSheet)

## Contexte

La spec 18 entière (abandon → retour à la barbarie) est **post-MVP, large, et bourrée de questions de design non tranchées** (tier barbare cible, retour du joueur, reset ressources, garnison utilisable, granularité, effet classements). On **ne planifie pas** le basculement destructif ici.

Ce run livre **uniquement la première tranche verticale bornée, non destructive et server-authoritative** que la spec anticipe explicitement : marquer visuellement les comptes inactifs **avant** tout basculement.

État code actuel (preuves) :

- `WorldMembership.lastLoginAt DateTime?` existe (`battleforthecrown-backend/prisma/schema.prisma:482`, `@map("last_login_at")`), maintenu au join + heartbeat (`join-world.use-case.ts`, `world.service.ts`).
- Seul usage actuel : filtre joueurs actifs `lastLoginAt >= now - 7 j` dans `crown-production.worker.ts:40`. **Aucun état d'inactivité dérivé/exposé ailleurs.**
- `users/public-profile.service.ts` expose `displayName` + `kingdomPower` + `newbieShield` ; **pas** `lastLoginAt` ni inactivité.
- Aucun indicateur d'inactivité côté pixi (`rg 'inactif|inactiv|dormant' battleforthecrown-pixi/src` → 0 match).

Patron direct à copier : **run 082** (fiche publique joueur + badge bouclier débutant : `public-profile.service.ts` + `PublicPlayerProfileSheet`). Patron helper shared pur : **run 060** (preview exposé sur scout/SelectedEntityPanel), **run 059** (threat estimate, invariant non-révélation).

## Dépendances

- Aucune dépendance bloquante. `WorldMembership.lastLoginAt` déjà présent et maintenu — **0 migration**.
- Connexe (contexte, pas dépendance) : run 082 (fiche publique), run 059 (non-révélation). Cible future hors scope : `06-barbarians.md`, `13-barbarian-conquest.md`.

## Objectif

Exposer et afficher un état d'inactivité pré-abandon (`ACTIVE | INACTIVE`) dérivé **en lecture seule** de `WorldMembership.lastLoginAt`, sur la fiche publique joueur. Marquage visuel discret (badge « Inactif depuis N j », gris) **sans aucun effet gameplay**, sans worker, sans mutation, sans migration. Pose les fondations lisibles avant le futur basculement vers la barbarie (hors scope).

## Hors scope (runs ultérieurs, après résolution des « Questions à trancher » de la spec 18)

- Conversion village → barbare, reset stock/armée, garnison utilisable.
- Retrait/gel des classements, notifications push « ton royaume est en danger ».
- Worker de bascule J+14, grisage du village dans le canvas `WorldMapScene` (reconciliation Pixi).

## Pistes

- **A (retenue par défaut)** : réutiliser quasi tel quel le patron run 082 (newbieShield) — même service, même DTO nullable (`null` = pas de signal = ACTIVE), même rendu conditionnel dans `PublicPlayerProfileSheet`.
- Helper shared **pur** sur le modèle run 059/060 (logique testable hors I/O).
- Seuil = **constante shared unique** (pas de magic number dupliqué). Documenter en commentaire l'alignement 7 j (INACTIVE / « à risque ») vs 14 j (abandon, futur) en renvoyant à la spec 18.

## Critère de fin (acceptance)

- [ ] [auto] `computeInactivityState` → `INACTIVE` quand jours depuis `lastLoginAt >= seuil` (7), `ACTIVE` en deçà ; `lastLoginAt = null` → `ACTIVE` (jamais de faux positif). (spec test shared)
- [ ] [auto] Libellé FR « Inactif depuis N j » avec N = jours pleins (floor) depuis `lastLoginAt`. (spec test shared)
- [ ] [auto] `PublicPlayerProfileResponseSchema` valide le champ `inactivity` (objet `{ state, sinceDays }` ou `null`) ; forme nullable calquée sur `newbieShield`. (spec test shared)
- [ ] [auto] `GET` fiche publique d'un membre inactif (`lastLoginAt > seuil`) → `inactivity.state = INACTIVE` + `sinceDays > 0` ; membre actif → `null`. (smoke backend)
- [ ] [auto] Le DTO **n'expose jamais** `lastLoginAt` brut (uniquement `state` + `sinceDays`). (assertion smoke + revue)
- [ ] [auto] `yarn static-check` + `test:backend` + `test:pixi` verts.
- [ ] [visuel] La fiche publique affiche un badge gris discret « Inactif depuis N j » **uniquement** pour un joueur INACTIVE ; rien pour un actif. (checklist Kelvin)
- [ ] [visuel] Aucune donnée nouvelle au-delà du public déjà exposé (non-révélation respectée). (revue + checklist)

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Skills : `bftc-tests-policy`, `bftc-qa`, `bftc-react-hud`, `bftc-prisma`
- Spec : `docs/gameplay/18-inactivity-and-abandonment.md`
- Runs patrons : `tasks/runs/archive/082-feature-public-player-profile-newbie-shield-badge.md`, `tasks/runs/archive/060-feature-pvp-capture-duration-preview.md`, `tasks/runs/archive/059-feature-threat-estimate-pre-attack.md`

## Décomposition initiale

_(Lead étape 3 — tâches ≤5 fichiers)_

- T1 — shared : helper `computeInactivityState(lastLoginAt, now)` + libellé FR + constante seuil, dans `packages/shared/src/world/` (ex. `inactivity.ts`), export via index, + spec test pur (bornes seuil, `lastLoginAt` null, arrondi jours). (≤3 fichiers)
- T2 — shared : étendre `PublicPlayerProfileResponseSchema` (champ `inactivity` nullable) dans `packages/shared/src/world/public-player-profile.ts` + rebuild shared. (1 fichier)
- T3 — backend : ajouter `lastLoginAt` au `select` membership + dériver via helper shared + exposer le champ minimal dans `users/public-profile.service.ts`. (1 fichier)
- T4 — backend : smoke/unit couvrant ACTIVE (`null`) vs INACTIVE (`sinceDays`) + assertion « pas de `lastLoginAt` brut ». (1 fichier)
- T5 — frontend : badge gris « Inactif depuis N j » (rendu conditionnel) dans `features/world/PublicPlayerProfileSheet.tsx`. (1 fichier)
- T6 — frontend : test sheet (présence/absence badge selon DTO). (1 fichier)

## Points d'attention

- **Seuil non tranché par la spec** : la spec fixe 14 j = abandon et suggère « J+7 à J+14 » pour l'indicateur. 7 j proposé (cohérent avec le filtre 7 j de `crown-production.worker.ts:40`) — **acter** la valeur en étape 1 du pipeline (confirmer que la cohérence avec crown-production est intentionnelle, pas un couplage fortuit).
- **Source de `now`** : calcul **serveur-authoritatif** recommandé (`sinceDays` figé renvoyé). Ne **pas** exposer `lastLoginAt` brut ni recalculer côté client (leak + dérive horloge).
- **Forme du champ DTO** : nullable (`null` quand non pertinent, comme `newbieShield`) pour homogénéité — à figer + tester.
- **Heartbeat** : vérifier la fréquence du heartbeat `lastLoginAt` pour éviter qu'un onglet ouvert maintienne ACTIVE un joueur réellement absent (probablement OK, à noter).
- **Invariant non-révélation** : ne rien exposer au-delà du public déjà visible (run 082) ; pas de `lastLoginAt` brut.

## Review indépendante

- **Requise : OUI.** Critère (a) — modification simultanée backend (service/DTO public) + frontend (UI) + shared. Surface **publique** avec invariant de non-révélation (ne pas leaker plus que le public actuel, ne pas exposer `lastLoginAt` brut) → second regard sur l'invariant et la cohérence du contrat shared↔back↔front.

## Progress

_(Vide au démarrage. Pendant run — supprimé à l'archive.)_

## Décisions prises

_(Vide au démarrage. Pendant run — supprimé à l'archive.)_

## Rapport final

_(Vide au démarrage. Rempli en fin de run.)_

### Acceptance & QA

- [ ] <critère> — `<cmd>` → <résultat>
- **Review indépendante** : …
- **Tests automatisés** : …
- **Tests IG user** : checklist Kelvin (badge gris affiché seulement pour INACTIVE ; aucune fuite de donnée privée).
