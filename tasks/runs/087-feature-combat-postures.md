# Run #087 — feature-combat-postures

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Hors roadmap MVP — promotion d'un ticket lab à **bon** ratio bénéfice/coût (agence joueur au lancement d'attaque, sans micro-gestion), candidat naturel à un cycle QoL/combat post-MVP. Pas de blocage si reporté.
- **Spec source** : [`docs/gameplay/lab/tickets/02-simple-combat-orders.md`](../../docs/gameplay/lab/tickets/02-simple-combat-orders.md) (lab, à **promouvoir** dans une spec canonique pendant ce run — proposition : nouvelle `docs/gameplay/27-combat-postures.md`, alignée sur la convention « MVP léger » et complétant `04-combat.md`). _(Spec 26 réservée par le run planifié `085-feature-private-map-markers`.)_
- **Type** : `feature`
- **Modules** : shared `combat/` (enum + multiplicateurs + helpers) + backend `combat` (résolution + DTO/Zod + persistance `Expedition` + report presenter) + Prisma (colonne `Expedition.posture`) + frontend Pixi (sélecteur posture `AttackDetailModal` + affichage rapport) + docs gameplay (nouvelle spec) + docs archi.

## Pourquoi maintenant

Le lab ticket 02 est noté **« bon » ratio bénéfice/coût** (« si les multiplicateurs restent simples »). Le combat est aujourd'hui **entièrement automatique** : le joueur compose son armée puis subit une résolution déterministe sans aucun levier d'intention. Les piliers combat voisins sont matures et livrés (résolution `combat-resolution.ts`, styles stratégiques défenseur run `strategy`, rapports combat run 017+, fenêtre de capture run 060), donc :

1. Donner **un choix clair au lancement** (farmer / sécuriser / forcer) augmente l'agence sans ajouter de micro-gestion ni de nouveau système — le joueur exprime une intention lisible immédiatement.
2. Le point d'injection est **isolé et mature** : `calculateCombatOutcome` (`combat-resolution.ts:59`) calcule déjà `lossesAttacker` séparément ; `AttackCommand` (`packages/shared/src/combat/dtos.ts:28`) est le seul contrat d'envoi ; `AttackDetailModal` (`battleforthecrown-pixi/src/features/combat/AttackDetailModal.tsx:260`) est le seul point de mutation. L'extension est mécanique.
3. Aucun gameplay critique n'en dépend — c'est une couche d'option pure, livrable sans coordination avec une feature en flight, **rétrocompatible** (absence de posture ⇒ `STANDARD`, comportement actuel inchangé).

## Gap (preuves code)

- `packages/shared/src/combat/dtos.ts:28-35` — `AttackCommand` = `{ villageId, targetX, targetY, targetKind, targetRefId, units }` ; **aucun champ posture/ordre de combat**.
- `packages/shared/src/combat/` — aucun type `CombatPosture` ni constante de multiplicateurs (`rg -i 'posture|combatOrder|attackMode|combatMode' packages/shared/src` → seuls matches = substring `instance`/`distance` dans `stance`, aucun symbole réel).
- `battleforthecrown-backend/src/modules/combat/combat-resolution.ts:59-111` — `calculateCombatOutcome` ne prend aucun paramètre posture ; `lossesAttacker` et le loot sont calculés sans modificateur d'intention.
- `battleforthecrown-backend/src/modules/combat/combat.service.ts:90-93` — `initiateAttack(userId, dto: AttackCommandDto)` n'extrait ni ne persiste aucune posture.
- `battleforthecrown-backend/prisma/schema.prisma` — modèle `Expedition` sans colonne `posture` (`rg -n 'posture' battleforthecrown-backend/prisma/schema.prisma` → 0 match).
- `battleforthecrown-pixi/src/features/combat/AttackDetailModal.tsx:260-267` — `mutation.mutate({ ..., units: filteredUnits })` ; **aucun sélecteur de posture**, aucun champ envoyé.
- `battleforthecrown-backend/src/modules/combat/combat-report.presenter.ts` + `packages/shared/src/combat/dtos.ts` — le rapport de combat n'expose aucune posture (`rg -n 'posture' battleforthecrown-backend/src battleforthecrown-pixi/src` → 0 match réel).
- Tasks : `rg -il 'postur|combat-order|stance|brutal|prudent' tasks/` → aucun ticket/run actif ou archivé ne couvre le sujet.

## Dépendances

- ✅ `combat-resolution.ts` (run combat historique) — `lossesAttacker` déjà isolé, point d'injection net.
- ✅ Loot runtime (`packages/shared/src/combat/loot.ts` + stratégies `modules/combat/loot/`) — surface où scaler le butin.
- ✅ Rapport de combat (`combat-report.presenter.ts` + `ScoutReportCard`/`CombatReportCard` côté Pixi) — surface d'affichage de la posture utilisée.
- ✅ `AttackDetailModal` (run combat front) — surface du sélecteur.
- Hors scope : postures sur reinforce/scout/caravane, postures défenseur (la défense reste pilotée par les styles stratégiques de village, `12-village-styles.md`), multiplicateurs par-monde `WorldConfig` (constantes shared figées au MVP).

## Étape 0 — Questions lab tranchées (vision figée 2026-06-28, mode Routine)

Les 4 « Points à trancher » du lab ticket 02 sont **figés** ci-dessous (ma vision, à valider par Kelvin au refinement `$bftc-run`). À reporter dans la spec canonique `27-combat-postures.md` :

- **Postures** : ✅ **3 postures** — `CAUTIOUS` (Prudent), `STANDARD` (Normal, **default**), `AGGRESSIVE` (Brutal). Libellés FR : Prudent / Normal / Brutal.
- **Disponibilité (barbares only ou PvP ?)** : ✅ **les deux** — ATTACK contre barbares **et** PvP. Posture sur expéditions `ATTACK` uniquement (jamais reinforce / scout / caravane).
- **Multiplicateurs (pertes, loot, ou les deux ?)** : ✅ **pertes attaquant + loot uniquement**, bornes serrées **±15 %** :
  - Prudent : pertes attaquant **×0.85**, loot **×0.85** (rentrer avec son armée, piller moins).
  - Normal : **×1.0 / ×1.0**.
  - Brutal : pertes attaquant **×1.15**, loot **×1.15** (forcer, piller plus, perdre plus).
  - **Invariant anti-snowball critique** : la posture **ne change jamais** l'issue (qui gagne `isAttackerWin`) **ni les pertes défenseur**. → **zéro rebalance** des tiers barbares / de la puissance. Un fort qui passe Brutal ne devient pas plus fort : il échange plus de pertes contre plus de loot. Constantes dans `COMBAT_POSTURE_MODIFIERS` (shared).
- **Affichée dans le rapport ?** : ✅ **oui** — la posture utilisée est exposée dans le `CombatReport` (transparence du tradeoff subi).
- **Compatible conquête Seigneur (Noble) ?** : ✅ **oui, sans contournement** — le scaling posture s'applique aux **unités régulières uniquement** ; le `NOBLE` (binaire 0/1, géré par `applyNobleVictoryLoss`) est **exclu** du scaling. Ordre d'application figé : `applyNobleVictoryLoss` **d'abord**, puis scaling posture sur les unités régulières → Brutal n'augmente pas artificiellement la chance de perte du Noble.
- **Persistance** : ✅ `Expedition.posture` enum DB, **figée à l'envoi**, immuable. Default `STANDARD` (rétrocompat : expéditions legacy/en vol = comportement actuel).
- **Clamp** : ✅ pertes scalées **floorées** et bornées `[0, units]` par type ; loot scalé borné par la capacité de transport existante (le scaling s'applique **avant** le cap capacité, jamais au-delà).

## Critère de fin (acceptance)

- [ ] **[spec]** Nouvelle spec `docs/gameplay/27-combat-postures.md` créée, source canonique, qui acte les décisions Étape 0 (3 postures, ATTACK barbares+PvP, multiplicateurs ±15 % pertes+loot, invariant « jamais l'issue ni le défenseur », Noble exclu, posture au rapport). Lab `tickets/02-*` déplacé en « Promus » (`lab/README.md` + `lab/tickets/README.md`). Index `docs/gameplay/README.md` + `04-combat.md` (renvoi) mis à jour.
- [ ] **[shared]** `packages/shared/src/combat/` : `CombatPosture` enum (`CAUTIOUS | STANDARD | AGGRESSIVE`) + `COMBAT_POSTURES` const + `COMBAT_POSTURE_MODIFIERS` (`{ attackerLossMultiplier, lootMultiplier }` par posture) + `COMBAT_POSTURE_DISPLAY` (libellés FR) + helpers purs `applyPostureToLosses(losses, posture, { excludeNoble: true })` et `applyPostureToLoot(amount, posture)`. `AttackCommand.posture?: CombatPosture` ajouté. Exposé via barrel. Tests Vitest purs (table multiplicateurs, clamp, exclusion Noble, default STANDARD).
- [ ] **[backend]** Migration Prisma additive : `Expedition.posture` enum (default `STANDARD`, non-null). `yarn prisma generate`.
- [ ] **[backend]** DTO/Zod `AttackCommandDto` : `posture` optionnel (default `STANDARD` à la validation). `combat.service.ts:initiateAttack` persiste la posture sur l'`Expedition`. Rejet (400) d'une posture inconnue.
- [ ] **[backend]** `combat-resolution.ts` / résolution combat : applique `applyPostureToLosses` aux pertes attaquant **après** `applyNobleVictoryLoss` (Noble exclu), et `applyPostureToLoot` au butin **avant** le cap capacité. **Aucune modification** de `isAttackerWin`, `totalDefensePower`, `lossesDefender`. Tests unit : Prudent < Normal < Brutal sur pertes+loot, issue & pertes défenseur identiques aux 3 postures, Noble jamais scalé.
- [ ] **[backend]** `combat-report.presenter.ts` + DTO `CombatReportResponse` : exposent la `posture` de l'expédition. Persistée/dérivée du snapshot d'expédition.
- [ ] **[frontend]** `AttackDetailModal` : sélecteur 3 chips (Prudent / Normal / Brutal, default Normal) avec micro-copie du tradeoff (« moins de pertes, moins de butin » / « plus de butin, plus de pertes »). Posture passée dans `mutation.mutate({ ..., posture })`. Affiché uniquement pour `ATTACK` (pas scout/reinforce).
- [ ] **[frontend]** Carte de rapport de combat : badge/ligne « Posture : Brutal » lue depuis le DTO. Mapping posture → libellé FR depuis `COMBAT_POSTURE_DISPLAY` (shared, pas de duplication).
- [ ] **[invariant]** Server-authoritative : la posture est **revalidée et appliquée côté serveur** (jamais de multiplicateur calculé côté front). Le front n'envoie que l'enum.
- [ ] **[tests]** Unit shared (helpers + table) ; unit backend (résolution 3 postures, invariant issue/défenseur, Noble) ; smoke backend `combat` étendu (envoi ATTACK avec posture → `Expedition.posture` persistée → rapport porte la posture). `yarn static-check` + `yarn test:backend` + `yarn test:pixi` verts.
- [ ] **[docs]** `docs/architecture/data-model.md` (champ `Expedition.posture`), renvoi depuis `docs/gameplay/04-combat.md`. Sortie du lab actée (`lab/README.md` + `lab/tickets/README.md`).

## Hors scope (à ne pas faire dans ce run)

- Postures sur reinforce / scout / caravane (ATTACK seulement).
- Posture défenseur (la défense reste gérée par les styles stratégiques `12-village-styles.md`).
- Multiplicateurs par-monde via `WorldConfig.tempo`/override (constantes shared figées au MVP ; rouvrir si playtest l'exige).
- Modifier l'issue du combat ou les pertes défenseur (invariant anti-snowball — la posture est un tradeoff attaquant pur).
- Risque/coût supplémentaire à la posture (pas de surcoût ressources/temps au MVP — l'arbitrage est intrinsèque au multiplicateur).
- Plus de 3 postures / postures custom (3 figées, lisibilité mobile).

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md` + `battleforthecrown-backend/.agents/rules/nest-conventions.md`
- Skills : `bftc-prisma`, `bftc-react-hud`, `bftc-tests-policy`, `bftc-qa`, `bftc-workers-outbox` (si event combat impacté)
- Spec source : `docs/gameplay/lab/tickets/02-simple-combat-orders.md`
- Point d'injection résolution : `battleforthecrown-backend/src/modules/combat/combat-resolution.ts:59` (`calculateCombatOutcome`, `lossesAttacker` isolé).
- Contrat d'envoi : `packages/shared/src/combat/dtos.ts:28` (`AttackCommand`).
- Surface front : `battleforthecrown-pixi/src/features/combat/AttackDetailModal.tsx:260`.

## Décomposition initiale

_(Lead étape 3 — tâches ≤5 fichiers)_

- **T1 — Spec canonique + sortie lab** : créer `docs/gameplay/27-combat-postures.md` + déplacer ticket lab 02 en « Promus » (`lab/README.md` + `lab/tickets/README.md`) + index `README.md` + renvoi `04-combat.md`.
- **T2 — Shared contracts** : `CombatPosture` enum + `COMBAT_POSTURE_MODIFIERS` + `COMBAT_POSTURE_DISPLAY` + helpers purs + `AttackCommand.posture` + tests Vitest. Rebuild `@battleforthecrown/shared`.
- **T3 — Prisma + persistance** : migration `Expedition.posture` + `combat.service.ts:initiateAttack` persiste la posture + DTO/Zod.
- **T4 — Résolution + rapport** : `combat-resolution.ts` applique les multiplicateurs (pertes après Noble, loot avant cap) + `combat-report.presenter.ts` expose la posture + tests unit invariants.
- **T5 — Frontend sélecteur + rapport** : sélecteur posture `AttackDetailModal` (ATTACK only) + badge posture sur la carte de rapport + mapping libellés shared.
- **T6 — Docs archi** : `data-model.md` (`Expedition.posture`).

## Progress

_(Vide au démarrage. À remplir pendant `$bftc-run`.)_

## Décisions prises

- **2026-06-28 (plan, mode Routine)** — 4 « Points à trancher » du lab 02 figés (cf. Étape 0). Points clés : (1) multiplicateurs **±15 % sur pertes attaquant + loot uniquement** ; (2) **invariant anti-snowball** — la posture ne touche jamais l'issue ni les pertes défenseur → zéro rebalance ; (3) **Noble exclu** du scaling, appliqué après `applyNobleVictoryLoss` ; (4) **ATTACK barbares + PvP**, default `STANDARD` rétrocompatible.

## Rapport final

### Acceptance & QA

_(Vide au démarrage. Rempli à la clôture.)_
