# Run #058 — feature-pvp-power-third-attack-guard

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Hors phase numérotée — garde-fou PvP MVP tranché spec, indépendant des notifications Phase 6. Complémentaire structurel du run [`056`](./056-feature-pvp-newbie-shield-48h.md) (bouclier débutant). Ensemble, §§ 2 + 3 de la spec constituent l'armature anti-snowball MVP.
- **Spec source** : [`docs/gameplay/14-pvp-conquest.md`](../../docs/gameplay/14-pvp-conquest.md) § « Garde-fous anti-snowball — 2. Garde-fou par puissance — `puissance_défenseur ≥ puissance_attaquant ÷ 3` » (lignes 161-177).
- **Specs liées** :
  - [`docs/gameplay/09-power-and-rankings.md`](../../docs/gameplay/09-power-and-rankings.md) § Visibilité — justifie l'exposition publique de la puissance totale par joueur (et la fuite assumée par escalade documentée l. 177 de la spec 14).
  - [`docs/gameplay/06-barbarians.md`](../../docs/gameplay/06-barbarians.md) — confirme l'exclusion de la conquête barbare du périmètre (pas de puissance défensive côté barbare).
- **Type** : `feature`
- **Modules backend** :
  - `combat/combat.service.ts` (guard `initiateAttack`, méthode privée `assertAttackAllowedByPower`).
  - `power/power.service.ts` (réutilisation de `getKingdomPowerValue`, tx-compatible).
  - Éventuellement `power/power.controller.ts` (nouvelle route publique, cf. T4).
- **Modules frontend** :
  - `features/world/SelectedEntityPanel.tsx` (CTA grisé + message standardisé).
  - `api/queries/` (nouveau hook `useTargetKingdomPower` ou équivalent — selon T4).
  - `features/combat/` (interception 403 `POWER_RATIO_FORBIDDEN`).
- **Modules transverses** : nouveau dossier `packages/shared/src/pvp/` :
  - `power-ratio.ts` : constante `POWER_RATIO_DIVISOR = 3` + helper pur `isAttackAllowedByPowerRatio({ attackerPower, defenderPower })`.
  - `index.ts` barrel + re-export depuis `packages/shared/src/index.ts`.

## Dépendances

- Aucune dépendance bloquante active.
- Fondations déjà en place :
  - `battleforthecrown-backend/src/modules/combat/combat.service.ts:133-144` — snapshot `attackerKingdomPowerSnapshot` + `defenderKingdomPowerSnapshot` déjà calculés (à réutiliser pour éviter une double lecture).
  - `battleforthecrown-backend/src/modules/power/power.service.ts:127` — `getKingdomPowerValue(userId, worldId, reader)` exposé et tx-compatible.
  - Pattern de pre-check dans `initiateAttack` modélisé par le run [`056`](./056-feature-pvp-newbie-shield-48h.md) (bouclier débutant — `PLANNED`).

## Critère de fin (acceptance)

- [ ] **[unit]** Helper shared `isAttackAllowedByPowerRatio` couvre : seuil exact (`defender === attacker / 3`) → autorisé ; juste en-dessous → refusé ; sur-seuil → autorisé ; cas dégénéré `attacker = 0` → autorisé (couvert en pratique par le shield débutant ; valeur déterministe attendue).
- [ ] **[grep]** `POWER_RATIO_DIVISOR = 3` présent **une seule fois** dans `packages/shared/src/pvp/`. Aucun `/ 3` ni `÷ 3` lié à la puissance en dur ailleurs (`grep -rE '/\s*3' battleforthecrown-backend/src/modules/combat battleforthecrown-pixi/src/features/world` ne matche aucune ligne liée au garde-fou).
- [ ] **[curl]** `POST /combat/attack` cible `PLAYER_VILLAGE`, `attackerPower=3000`, `defenderPower=999` → `403 Forbidden` (code `POWER_RATIO_FORBIDDEN`). Aucune ligne `Expedition` créée, `UnitInventory` non mutaté (vérif SQL).
- [ ] **[curl]** `POST /combat/attack` cible `PLAYER_VILLAGE`, `attackerPower=3000`, `defenderPower=1000` → `200` (seuil exact autorisé — `>=` strict).
- [ ] **[curl]** `POST /combat/attack` cible `PLAYER_VILLAGE` avec `NOBLE` dans `units` (conquête PvP), même ratio sous-seuil → `403` (la conquête PvP passe par `initiateAttack`, un seul guard couvre raid + conquête).
- [ ] **[curl]** `POST /combat/attack` cible `BARBARIAN_VILLAGE` quel que soit le ratio → `200` (conquête barbare hors périmètre — les barbares n'ont pas de puissance).
- [ ] **[curl]** `POST /combat/attack` PvP par petit joueur (`attackerPower=200`) attaquant un gros (`defenderPower=10000`) → `200` (asymétrie héroïque préservée — seul l'attaquant est borné).
- [ ] **[curl]** `POST /combat/scout` cible `PLAYER_VILLAGE` quel que soit le ratio → `200` (scout hors périmètre, symétrique avec le shield débutant).
- [ ] **[SQL]** Après refus `403` : `SELECT COUNT(*) FROM "Expedition" WHERE "attackerVillageId" = … AND "createdAt" > <ts>` = `0`. `UnitInventory` de l'attaquant inchangé entre `before/after`.
- [ ] **[smoke]** Smoke E2E `battleforthecrown-backend/test/pvp-power-third-guard.smoke.spec.ts` couvre en séquence : (1) refus PvP sous seuil, (2) autorisation à seuil exact, (3) autorisation barbare quel que soit le ratio, (4) autorisation petit→gros (asymétrie héroïque). Assertions SQL `Expedition` + `UnitInventory`.
- [ ] **[visuel/gameplay]** Sur `SelectedEntityPanel` ciblant un défenseur sous seuil : CTA `Attaquer` grisé + texte **exact** `« Puissance trop faible — protection serveur »` (aligné spec ligne 173).
- [ ] **[visuel/gameplay]** Côté UX : motif **explicite** affiché, pas de masquage. Cohérent avec le tradeoff de fuite assumé (spec l. 177, ticket archive [`21`](../archive/21-power-guardrail-leaks-defender-power.md)).

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`
- React/HUD : skill `bftc-react-hud` (CTA grisé + message)
- Workers/Outbox : non sollicité (refus 403 immédiat, pas d'event asynchrone).

## Décomposition initiale (pré-remplie par `bftc-plan`)

_(Le lead peut affiner à l'étape 3 du `$bftc-run`.)_

- **T1 — Helper shared pur** : créer `packages/shared/src/pvp/power-ratio.ts` (constante `POWER_RATIO_DIVISOR = 3` + fonction `isAttackAllowedByPowerRatio({ attackerPower, defenderPower })` retournant `boolean`, comparaison `defenderPower * POWER_RATIO_DIVISOR >= attackerPower` pour éviter une division flottante). `index.ts` barrel + re-export depuis `packages/shared/src/index.ts`. Tests unit pure-logic. Re-build `@battleforthecrown/shared`. **Fichiers : 3-4.**
- **T2 — Guard backend** : étendre `combat.service.ts initiateAttack` avec méthode privée `assertAttackAllowedByPower(attackerPower, defenderPower)` appelée juste après le calcul de `defenderKingdomPowerSnapshot` (vers l. 144) et **avant** `verifyAndDeductUnits` (l. 147). Refus = `ForbiddenException` avec code `POWER_RATIO_FORBIDDEN`. Réutiliser la valeur déjà snapshot (pas de double lecture). Skip si `dto.targetKind !== 'PLAYER_VILLAGE'`. **Fichiers : 1.**
- **T3 — Tests backend pure-logic** : étendre `combat.service.spec.ts` (ou créer `.spec` dédié) : (a) attaque PvP refusée sous seuil ; (b) attaque PvP autorisée à seuil exact ; (c) attaque BARBARIAN_VILLAGE jamais bloquée ; (d) attaque PvP autorisée hors seuil ; (e) refus n'altère ni `Expedition` ni `UnitInventory` (tx rollback). **Fichiers : 1-2.**
- **T4 — Exposition publique puissance par joueur** : trancher en refinement étape 3 — soit (a) nouvelle route `GET /power/kingdom-by-user/:userId/:worldId` (publique, type `number`, DTO Zod shared), soit (b) **UX 403-only** sans pre-check côté client (le bouton ne se grise qu'après échec serveur). Recommandation : option (a) cohérente avec `09-power-and-rankings.md` § Visibilité. **Fichiers : 2-3** (option a) **ou 0** (option b).
- **T5 — Hook front + UI grisée** : selon T4, ajouter `useTargetKingdomPower(userId, worldId)` (TanStack Query) puis intégrer dans `SelectedEntityPanel.tsx` : appel helper shared `isAttackAllowedByPowerRatio` + CTA grisé + texte exact `« Puissance trop faible — protection serveur »` dès que le helper retourne `false`. **Fichiers : 2-3.**
- **T6 — Interception 403 côté flux d'envoi** : front intercepte `403 POWER_RATIO_FORBIDDEN` → toast / message standardisé (filet pour le cas où la condition change entre le clic et l'envoi, ou si T4 retient l'option b). **Fichiers : 1-2.**
- **T7 — Smoke E2E** : créer `battleforthecrown-backend/test/pvp-power-third-guard.smoke.spec.ts` — 2 comptes test, seed puissances calibrées via créations directes de bâtiments/unités, scénarios curl + assertions SQL (Expedition count, UnitInventory non muté). **Fichiers : 1.**
- **T8 — Docs + commit** : add-on court dans `docs/architecture/decisions.md` si un code d'erreur 403 dédié est ajouté. Référence depuis `docs/gameplay/14-pvp-conquest.md` § 2 vers le helper shared (pas de duplication de formule — cf. `docs/AGENTS.md` « ne pas dupliquer dans la doc »). **Fichiers : 1-2.**

Chaque tâche reste ≤ 5 fichiers.

## Progress (rempli pendant le run)

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Décisions prises

_(Vide au démarrage. Décisions archi non triviales, dérogations lead, findings de review, refus de sub-agents.)_

## Rapport final

_(Vide au démarrage. Rempli à l'étape 10 : synthèse, fichiers touchés, tickets ouverts, méta-évaluation si applicable.)_

### Acceptance & QA

- **Critères d'acceptance vérifiés** : à remplir à l'étape 10.
- **Review indépendante** : `Déclenchée (raisons : (a) back + front + shared simultanés — combat.service + SelectedEntityPanel + packages/shared/src/pvp/ ; (c) point d'entrée runtime critique du PvP — refus serveur-authoritatif d'attaques, doit couvrir raid, conquête, scout, barbare, asymétrie héroïque ; (d) invariant durable — garde-fou anti-snowball structurel MVP actif sur toute la durée de vie d'un monde)`.
- **Tests automatisés** : unit shared (`power-ratio.test.ts`), unit backend `combat.service.spec.ts` (extension), smoke `pvp-power-third-guard.smoke.spec.ts`, vitest `SelectedEntityPanel.test.tsx`.
- **Smokes ajoutés/modifiés** : `battleforthecrown-backend/test/pvp-power-third-guard.smoke.spec.ts` (à créer).
- **QA fonctionnelle agent** : `curl` séquencé sur stack locale (POST attack PvP sous seuil refusé 403 + SELECT Expedition COUNT(*)=0 ; POST attack PvP à seuil exact OK ; POST attack BARBARIAN_VILLAGE OK quel que soit le ratio ; POST scout PvP OK).
- **Tests IG à faire par le user** : checklist mobile ≤ 5 items — (a) `SelectedEntityPanel` ciblant un défenseur sous seuil : CTA grisé + message exact ; (b) attaque PvP envoyée → 403 → toast lisible ; (c) attaque barbare jamais bloquée ; (d) attaque PvP par un petit joueur sur un gros toujours autorisée ; (e) le message ne fuit pas la puissance défensive précise (tradeoff assumé : seul le seuil est dérivable).

## Points d'attention (notes du plan)

- **Coordination avec run [`056`](./056-feature-pvp-newbie-shield-48h.md) (newbie shield)** : les deux runs ajoutent un pre-check dans `initiateAttack`. **Ordre proposé en exécution finale** : (1) bouclier débutant entrant → (2) ratio puissance → (3) `verifyAndDeductUnits`. Le **dernier des deux runs à exécuter** doit harmoniser l'ordre et ne pas le décider arbitrairement.
- **Réutilisation des snapshots existants** : `initiateAttack` appelle déjà `getKingdomPowerValue` pour `attackerKingdomPowerSnapshot` (l. 134) et calcule `defenderKingdomPowerSnapshot` (l. 141). **Le guard doit consommer ces valeurs, pas relire la base.**
- **Cas seuil zéro/zéro** : deux nouveaux joueurs à puissance 0 — couvert en pratique par le bouclier débutant 48 h (toute attaque PvP est déjà refusée par §3). Comportement shared attendu : `attackerPower = 0` retourne `true` (autorisé). À acter dans le test unit.
- **Exposition publique kingdom power par joueur** : à trancher en refinement (T4) — route publique vs UX 403-only. Cohérent avec `09-power-and-rankings.md` § Visibilité qui acte la **puissance totale par joueur** comme publique.
- **Évaluation temporelle** : check **au lancement uniquement**, jamais re-vérifié pendant le trajet (symétrique avec le shield débutant, conforme spec l. 172).
- **Tradeoff fuite assumé** (spec l. 177, ticket archive [`21`](../archive/21-power-guardrail-leaks-defender-power.md)) : motif d'erreur 403 **explicite** côté client. Ne pas tenter de masquer le motif UX.
- **Conquête PvP couverte sans branche dédiée** : la présence du `NOBLE` dans `units` n'est pas une condition du guard. Le check s'applique à **toute** cible `PLAYER_VILLAGE` (raid + conquête).
- **Pas d'event Outbox** : refus immédiat HTTP 403, aucune surface temps réel à brancher.
- **Hors scope explicite** : ce run **n'implémente pas** le bouclier débutant (§ 3, traité par run 056), ni le cooldown re-conquête (§ 4, explicitement non retenu MVP — cf. [`tasks/archive/23`](../archive/23-pvp-snowball-no-cooldown-no-shield.md)).

## Liens

- **À faire avant** : Aucun. Les snapshots `attackerKingdomPowerSnapshot` / `defenderKingdomPowerSnapshot` sont déjà calculés ; `PowerService.getKingdomPowerValue` est déjà tx-compatible.
- **À faire après** : Aucun successeur structurel MVP identifié. §§ 2 + 3 de la spec 14 forment l'armature complète anti-snowball.
- **Connexes** :
  - [`056 — Bouclier débutant PvP 48h`](./056-feature-pvp-newbie-shield-48h.md) — modèle de pre-check entrant dans `initiateAttack`. Coordination obligatoire sur l'ordre des guards.
  - [`051 — Classements Gloire d'Assaut / Rempart`](archive/051-feature-rankings-glory.md) — pattern d'utilisation de `PowerService` dans la chaîne combat.
  - [`docs/gameplay/09-power-and-rankings.md`](../../docs/gameplay/09-power-and-rankings.md) § Visibilité — justifie l'exposition publique de la puissance totale par joueur.
- **Déjà résolu (archive)** :
  - [`21 — Garde-fou puissance ÷ 3 fuite la puissance défensive`](../archive/21-power-guardrail-leaks-defender-power.md) — concerne uniquement le tradeoff de fuite documenté en spec l. 177. **Pas un doublon** : le guard lui-même n'est pas codé.
  - [`23 — Snowball PvP : ni cooldown re-conquête, ni bouclier post-perte`](../archive/23-pvp-snowball-no-cooldown-no-shield.md) — concerne le cooldown re-conquête (§ 4) et le bouclier post-perte rejeté. **Pas un doublon** : ce run cible le § 2 (ratio puissance).
- **Keywords scannés** : `puissance`, `power`, `garde-fou`, `guard`, `pvp`, `snowball`, `protection`, `ratio`, `tiers`, `3`.
