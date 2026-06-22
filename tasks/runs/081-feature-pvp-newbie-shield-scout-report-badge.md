# Run #081 — feature-pvp-newbie-shield-scout-report-badge

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

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

## Décomposition initiale

> Draft de cartographie. À raffiner à l'étape 3 du `$bftc-run`.

- **T1 — DTO shared** : étendre `ScoutReportResponse.details` (`packages/shared/src/combat/dtos.ts`) avec `newbieShield?: { active: boolean; endsAt: string | null }`. Test typing inclus. ≤ 1 fichier.
- **T2 — Backend snapshot scout** : localiser le point de résolution scout (`combat.worker.ts` + helper) qui produit le snapshot des détails. Appeler `buildShieldState` (`packages/shared/src/pvp/shield.ts`) sur la `WorldMembership` du propriétaire de la cible (PLAYER only), persister dans `ScoutReport.details.newbieShield`. ≤ 3 fichiers.
- **T3 — Backend presenter** : `scout-report.presenter.ts` `reportDetails()` propage le nouveau champ. Spec presenter unit. ≤ 2 fichiers.
- **T4 — Frontend viewmodel** : `scoutReportView.ts` mappe `details.newbieShield` → viewmodel (label + countdown via helper shared). Test unit. ≤ 2 fichiers.
- **T5 — Frontend ScoutReportCard badge** : composant `ScoutReportCard.tsx` affiche le badge bouclier débutant (réutiliser le pattern visuel de `SelectedEntityPanel` ou composant partagé si déjà extrait). Test composant. ≤ 2 fichiers.
- **T6 — Smoke + tests** : étendre `scouting.smoke.spec.ts` (cas shield actif + cas barbare + cas post-rupture), ajouter assertions presenter/viewmodel. ≤ 2 fichiers.
- **T7 — Docs** : mettre à jour la fin du rapport final de `tasks/runs/archive/056-feature-pvp-newbie-shield-48h.md` (pointeur vers run 081 pour le suivi scout). Pas de modification spec. ≤ 1 fichier.

## Liens détectés

- **À faire avant** : Aucun. Tous les prérequis (helper shared, snapshot architecture, `WorldEntityDto.newbieShield`) sont livrés par les runs 056 et 060.
- **À faire après** : **Run futur** — « fiche publique joueur (route REST + badge bouclier) » : nécessite d'abord trancher l'API profil global (cf. ticket archivé `tasks/archive/70-integrate-player-profile-sheet.md` § Piste B). Hors scope ici.
- **Doublon potentiel** : Aucun. Vérifié via `ls tasks/ tasks/runs/` + `grep -l "shield.*scout\|scout.*shield"` (uniquement archive 056 qui *déclare* le suivi sans le faire).
- **Connexe (contexte)** :
  - [`tasks/runs/archive/056-feature-pvp-newbie-shield-48h.md`](./archive/056-feature-pvp-newbie-shield-48h.md) — livre tout sauf badge scout + badge fiche publique. Ce run consomme le suivi `task_56e23ad7` (partie scout).
  - [`tasks/runs/archive/060-feature-pvp-capture-duration-preview.md`](./archive/060-feature-pvp-capture-duration-preview.md) — précédent qui a déjà étendu `ScoutReportResponse.details` (ajout `castleLevel`). Référence directe pour le pattern snapshot scout + presenter + DTO + frontend badge.
  - [`tasks/runs/archive/055-feature-intel-notebook.md`](./archive/055-feature-intel-notebook.md) — l'âge du rapport scout est déjà affiché par le carnet d'intel ; ce run en bénéficie pour la lecture « snapshot vs live » du badge bouclier.
  - [`tasks/runs/archive/058-feature-pvp-power-third-attack-guard.md`](./archive/058-feature-pvp-power-third-attack-guard.md) — pattern badge analogue (CTA grisé + message côté `SelectedEntityPanel`), pas de conflit (zones différentes).
  - [`tasks/archive/70-integrate-player-profile-sheet.md`](../archive/70-integrate-player-profile-sheet.md) — confirme que la route profil joueur public n'existe pas (Piste B reportée).
- **Déjà résolu (archive)** : Aucun. Le suivi `task_56e23ad7` est tracé dans le rapport 056 mais aucune fiche dédiée ne le porte.
- **Keywords scannés** : `newbie-shield`, `shield`, `bouclier`, `scout`, `scout-report`, `rapport-scout`, `badge`, `visibilité`, `task_56e23ad7`.

## Points d'attention

- **Snapshot, pas live** : le badge affiche l'état du bouclier **au moment du scout** (cohérent avec `wallLevel` / `castleLevel`). Si la cible a brisé son bouclier en attaquant entre le scout et la consultation du rapport, le badge montre `active === true` figé. C'est le bon comportement (l'âge du rapport est déjà signalé via le carnet d'intel et la spec scout § « Pas de péremption explicite »).
- **Cibles barbares** : `details.newbieShield` doit être **absent** (pas `false`), pour que le composant fasse une simple présence-de-clé check. Évite de polluer le payload des rapports barbares qui dominent en volume.
- **Pas de migration Prisma** : `ScoutReport.details` est `Json`. L'ajout est silencieux pour les anciens rapports (champ `undefined`, badge masqué). Vérifier avec `prisma migrate diff`.
- **Réutilisation du helper shared `isShieldActive`** : à utiliser côté backend lors du snapshot ET côté frontend pour formater le countdown (cohérence formule garantie). Aucun nouveau helper.
- **Pas de duplication du badge UI** : si le badge `SelectedEntityPanel` a été extrait dans un composant partagé (à vérifier en cartographie), le réutiliser. Sinon factoriser à l'occasion (T5) sans gonfler le scope.
- **Pas d'event WS dédié** : le rapport scout est créé une fois à la résolution ; aucun event de mise à jour ultérieur du badge (cohérent avec snapshot). L'event `pvp.shield.broken` existant (run 056) ne déclenche pas de refetch des rapports scout — ce serait incorrect (le snapshot doit rester figé).
- **Review indépendante** : critère (a) back+front simultanés rempli, mais diff estimé < 100 lignes et pas d'invariant durable nouveau (le seul invariant nouveau est l'ajout DTO `newbieShield?`). Critère (b) modifie SPEC.md → non. Décision : review **non requise** par défaut, à confirmer au démarrage du run si la diff dépasse 100 lignes.

## Estimation scope

`small-medium` — ~7-9 fichiers, scope clair, analog direct du run 060 (même pattern snapshot scout + DTO + presenter + frontend). Pas de découpage `$bftc-slice` nécessaire.
