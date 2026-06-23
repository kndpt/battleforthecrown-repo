# Run #081 — feature-pvp-newbie-shield-scout-report-badge

> **Statut** : DONE
> **Démarré** : 2026-06-22
> **Terminé** : 2026-06-22

## Cible

- **Phase roadmap** : Phase 7 — Conquête PvP (suivi du run 056 — visibilité MVP du bouclier débutant)
- **Spec source** : [`docs/gameplay/14-pvp-conquest.md`](../../docs/gameplay/14-pvp-conquest.md) § 3 Bouclier débutant — 48 h à l'arrivée sur le monde (lignes ~181-203)
- **Type** : `feature`
- **Modules backend** : `combat/scout-report.presenter.ts`, `combat/combat.worker.ts` (snapshot scout)
- **Modules frontend** : `features/combat/scoutReportView.ts`, `features/design-system/components/ScoutReportCard.tsx`
- **Modules transverses** : `packages/shared/src/combat/dtos.ts` (`ScoutReportResponse.details`), `packages/shared/src/pvp/shield.ts` (helper `isShieldActive` réutilisé)

## Contexte

La spec `14-pvp-conquest.md` § 3 Bouclier débutant tranche MVP la **visibilité du bouclier sur trois surfaces** (ligne 193) :

> Icône bouclier + timer restant sur **la fiche publique du joueur**, sur **le panneau d'info du village** et **dans le rapport de scout** (aligné sur le pattern de visibilité de la § Période de capture).

Le run 056 (`feature-pvp-newbie-shield-48h`, archivé 2026-06-20) a livré le garde-fou serveur + l'enrichissement `WorldEntityDto.newbieShield` + le badge sur `SelectedEntityPanel` + le badge header self, mais a **explicitement reporté en suivi** (rapport final, lignes 77 + 88 + 104) :

> Reportés (ticket `task_56e23ad7`) : badge rapport de scout + fiche publique joueur (route inexistante).

Ce run livre la première moitié de cette dette — **badge sur le rapport de scout** uniquement. La fiche publique joueur (route REST publique inexistante côté backend) reste hors scope ; elle fera l'objet d'un run dédié quand l'API profil global sera tranchée (cf. ticket archivé `tasks/archive/70-integrate-player-profile-sheet.md` qui dépend lui-même de cette API absente).

### Preuves du gap

- `battleforthecrown-backend/src/modules/combat/scout-report.presenter.ts:22-37` — `reportDetails()` n'expose que `scoutLosses / scoutUnits / wallLevel / castleLevel`, jamais `newbieShield`.
- `packages/shared/src/combat/dtos.ts` (`ScoutReportResponse.details`) — pas de champ `newbieShield`.
- `battleforthecrown-pixi/src/features/combat/scoutReportView.ts` — pas de mapping vers un état bouclier ; aucune section « Bouclier débutant » dans la vue.
- `battleforthecrown-pixi/src/features/design-system/components/ScoutReportCard.tsx` — aucun bloc / badge bouclier débutant ; uniquement compo + ressources + Rempart + Château + Fenêtre de capture.
- `tasks/runs/archive/056-feature-pvp-newbie-shield-48h.md:37,77,88,104` — checklist QA explicite « bandeau rapport de scout », rapport final déclare l'item reporté + ticket de suivi.
- `rg "newbieShield" battleforthecrown-backend/src/modules/combat` → aucun match (zéro consommation du helper côté combat/scout pipeline).

## Dépendances

- **Run 056** archivé `DONE` — fournit `WorldConfig.lifecycle.newbieShieldHours`, helper shared `isShieldActive` / `shieldEndsAt` (`packages/shared/src/pvp/shield.ts`), schéma `WorldMembership.joinedAt` + `shieldBrokenAt`, enrichissement `WorldEntityDto.newbieShield`. ✅ Réutilisé tel quel — pas de nouveau helper shared à créer.
- **Run 060** (`feature-pvp-capture-duration-preview`) archivé `DONE` — précédent qui a déjà étendu `ScoutReportResponse.details` (ajout `castleLevel`) et touché le presenter + le snapshot scout. Référence directe d'implémentation, **même pattern à appliquer**.
- Pas de migration Prisma (la colonne `details` `Json` accueille n'importe quel champ additif).

## Critère de fin (acceptance)

- [ ] `packages/shared/src/combat/dtos.ts` étend `ScoutReportResponse.details` avec `newbieShield?: { active: boolean; endsAt: string | null }` (mêmes champs que `WorldEntityDto.PlayerVillageEntity.newbieShield`). _(auto : grep)_
- [ ] `battleforthecrown-backend/src/modules/combat/combat.worker.ts` (ou helper de résolution scout, à localiser en cartographie) capture l'état du bouclier de la **cible joueur** au moment T de la résolution scout, via `buildShieldState({ joinedAt, brokenAt, newbieShieldHours, now })` (`packages/shared/src/pvp/shield.ts`), et le persiste dans `ScoutReport.details.newbieShield`. Cibles barbares : pas de champ (cohérent avec spec — pas de bouclier sur les barbares). _(auto : smoke `scouting.smoke`)_
- [ ] `battleforthecrown-backend/src/modules/combat/scout-report.presenter.ts` `reportDetails()` propage `details.newbieShield` (validation typage + passage à travers du DTO). _(auto : unit presenter spec)_
- [ ] `battleforthecrown-pixi/src/features/combat/scoutReportView.ts` mappe `details.newbieShield` vers le viewmodel + helper `getNewbieShieldStatus(details)` (label « actif/expiré », countdown si actif). _(auto : unit `scoutReportView.test.ts`)_
- [ ] `battleforthecrown-pixi/src/features/design-system/components/ScoutReportCard.tsx` affiche un **badge bouclier débutant** sur le rapport scout d'une cible joueur protégée — icône bouclier + countdown — aligné visuellement sur le badge existant `SelectedEntityPanel`. Masqué si cible barbare, ou si shield non actif au moment du scout, ou si `details.newbieShield` absent. _(auto : test composant + visuel)_
- [ ] Aucune migration Prisma (Json `details` suffit). _(auto : `prisma migrate diff` vide)_
- [ ] Snapshot vs live : le badge affiche l'état **au moment du scout** (snapshot), pas l'état live. Cohérent avec le pattern existant (`castleLevel` snapshot run 060, `wallLevel` snapshot historique). Si le bouclier a expiré depuis, le badge montre la valeur figée + l'âge du rapport (déjà affiché par carnet d'intel run 055). _(auto : test snapshot)_
- [ ] Smoke `scouting.smoke` étendu : un scout sur un joueur sous bouclier doit retourner `details.newbieShield.active === true` + `endsAt` cohérent ; scout sur joueur post-rupture → `active === false`. _(auto : smoke)_
- [ ] Pas de régression sur les cibles barbares (`details.newbieShield` absent, badge masqué). _(auto : test composant + smoke barbare)_
- [ ] Pas de régression sur le badge `SelectedEntityPanel` (livré run 056) ni sur le badge header self. _(auto : tests existants verts)_
- [ ] Docs : pas de modification spec (la spec est déjà alignée). Mise à jour du rapport final de `tasks/runs/archive/056-feature-pvp-newbie-shield-48h.md` pour pointer vers ce run comme livraison du suivi `task_56e23ad7` (partie scout). Note explicite que la « fiche publique joueur » reste hors scope ici (route REST publique inexistante). _(auto : grep)_

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`
- Frontend HUD : skill `bftc-react-hud`
- Pattern d'implémentation analogue : run 060 (snapshot scout `castleLevel`)

## Décomposition / Liens / Points d'attention

_(git history — voir le commit du run)_

## Rapport final

Snapshot figé du bouclier débutant du propriétaire de la cible (PLAYER only) capturé à la résolution scout via `NewbieShieldService.getMembershipShieldState`, persisté dans `ScoutReport.details.newbieShield {active, endsAt}` (barbares : champ absent), propagé par le presenter et affiché en badge sur `ScoutReportCard` (remaining figé = `endsAt − report.timestamp`, jamais recalculé live). Aucun nouveau helper shared, aucune migration (Json `details`). Review indépendante déclenchée (back+front + diff > 100 lignes prod) → `GO`.

### Acceptance & QA

**Critères d'acceptance vérifiés**
- [x] DTO `details.newbieShield?: {active, endsAt}` — `rg "newbieShield" packages/shared/src/combat/dtos.ts` → champ présent (dtos.ts:127).
- [x] Snapshot worker (PLAYER only, barbare absent) — smoke `scouting.smoke` → `playerShield.active === true`, `barbReport.details.newbieShield === undefined`.
- [x] Presenter propage + valide — `scout-report.presenter.spec` (15 tests verts, 3 nouveaux cas newbieShield).
- [x] Frontend viewmodel + `getNewbieShieldStatus` — `scoutReportView.test` (13 verts, badge actif `48h 00m`).
- [x] Badge `ScoutReportCard` masqué si absent/inactif/barbare — `scoutReportView.test` cas inactif/absent/barbare → `shieldBadge === undefined`. _(rendu visuel : IG)_
- [x] Aucune migration Prisma — `git diff --stat` → aucun fichier `prisma/`.
- [x] Snapshot vs live — remaining = `endsAt − report.timestamp` via `formatRemaining` pur, aucun `Date.now()` côté rapport (reviewer confirmé).
- [x] Smoke shield actif + post-rupture — `scouting.smoke` → re-scout post-`shieldBrokenAt` → `active === false`.
- [x] Pas de régression barbares — smoke + view tests verts.
- [x] Pas de régression `SelectedEntityPanel`/header self — `vitest SelectedEntityPanel NewbieShield combat` → 109 verts (zones disjointes).

**Review indépendante** : Déclenchée (raison: critère a back+front + diff > 100 lignes prod) → verdict `GO` (0 bloquant/majeur ; 1 nit barrel re-export fixé, 1 nit style laissé).

**Tests automatisés** : `yarn static-check` ✓ · presenter unit 15 ✓ · scoutReportView unit 13 ✓.

**Smokes lancés** : Ciblés — `test:smoke:run -- scouting.smoke` (1 ✓) + `pvp-newbie-shield.smoke` (5 ✓) après `test:smoke:preflight`. Diff backend `src/` ciblé (worker scout + presenter), pas transversal.

**Smokes ajoutés/modifiés** : `scouting.smoke.spec.ts` étendu — membership fraîche cible + assertions shield actif, absence barbare, re-scout post-rupture (`active === false`).

**QA fonctionnelle agent** : couverte par le smoke e2e (REST scout → worker résolution → DB `ScoutReport.details` → assertions). Pas de curl manuel additionnel nécessaire.

**Tests IG à faire par le user** :
- [ ] Scouter un joueur sous bouclier débutant → le rapport scout affiche le badge « Bouclier débutant » + countdown figé, style aligné bleu carte.
- [ ] Scouter un village barbare → aucun badge bouclier sur le rapport.

Docs : archive `056` pointeur mis à jour (suivi scout livré) ; pas de modif spec (déjà alignée).

> **Suivi `task_56e23ad7` clôturé (run 082, 2026-06-23)** : la fiche publique du joueur — qualifiée ici de « route inexistante / hors scope » — est désormais livrée (run 082 : route `GET /worlds/:worldId/users/:userId/public-profile` + `PublicPlayerProfileSheet` + CTA « Voir le profil »). Les 3 surfaces du bouclier (spec 14 § 3) sont complètes ; suivi fermé.
