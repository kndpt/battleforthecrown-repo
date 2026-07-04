# Run #092 — barbarian-capture-duration-preview

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Phase 3 — Conquête barbare (correctif d'affichage post-recalibrage tempo).
- **Spec source** : [`docs/gameplay/13-barbarian-conquest.md`](../../docs/gameplay/13-barbarian-conquest.md) — § *Période de capture variable par tier* (l.79-85, table figée) + § *Visibilité de la durée* (l.99-103, pré-affichage exigé). Cadre tempo : [`docs/gameplay/23-world-tempo-and-multipliers.md`](../../docs/gameplay/23-world-tempo-and-multipliers.md) § 7 (recalibrage 2/4/6/9/12 h → 30 min…3 h).
- **Type** : fix
- **Modules** : frontend (`barbarianConquest.ts` + test + non-régression `AttackDetailModal`) | shared (source unique de la table barbare, alignée sur le pattern PvP) | backend (ré-export, aligné sur `PVP_CAPTURE_DURATIONS_MS`).

## Objectif

Le preview front de la **fenêtre de capture barbare** affiche une **ancienne table** (`T1=2h / T2=4h / T3=6h / T4=9h / T5=12h`), soit jusqu'à **4× la durée réelle**. Le backend a été recalibré vers la courbe compressée de la spec 13 (`30 min / 1 h / 1 h 30 / 2 h 15 / 3 h`) mais le helper front est resté figé sur les valeurs pré-recalibrage. Sur un T5, le joueur lit « 12h » alors que le backend ouvrira une fenêtre de 3 h → la promesse « le joueur sait à l'avance combien de temps il va devoir tenir » (spec 13 § Visibilité) est **cassée**.

Objectif : aligner le preview barbare sur la source de vérité (spec 13 = backend), et **supprimer le risque de re-drift** en promouvant la table barbare dans `packages/shared` comme source unique — exactement le pattern déjà appliqué au PvP par le run 060 (`PVP_CAPTURE_DURATIONS_MS`).

**Preuves de gap (vérifiées)** :
- `battleforthecrown-pixi/src/features/world/barbarianConquest.ts:4-10` : `BARBARIAN_CAPTURE_DURATION_HOURS = { T1:2, T2:4, T3:6, T4:9, T5:12 }` → **valeurs obsolètes**.
- `battleforthecrown-backend/src/modules/combat/capture-duration.ts:12-18` : `BARBARIAN_CAPTURE_DURATIONS_MS = { T1:0.5h, T2:1h, T3:1.5h, T4:2.25h, T5:3h }` = table **autoritative appliquée au runtime**, conforme spec 13.
- `docs/gameplay/13-barbarian-conquest.md:79-85` : table tranchée MVP (`30 min / 1 h / 1 h 30 / 2 h 15 / 3 h`) ; l.101 exige le pré-affichage sur le panneau d'info.
- `battleforthecrown-pixi/src/features/combat/AttackDetailModal.tsx:174,415-417` : le badge « Fenêtre de capture » rend `getBarbarianCaptureDurationLabel(target.tier)` → la mauvaise valeur atteint bien le joueur.
- `battleforthecrown-pixi/src/features/world/barbarianConquest.test.ts:9-13` : les tests **figent les mauvaises valeurs** (`getBarbarianCaptureDurationLabel('T5') === '12h'`, commentaire trompeur « canonical capture window duration ») → drift verrouillé par test.
- `packages/shared/src/combat/capture-duration.ts` : `PVP_CAPTURE_DURATIONS_MS` déjà partagée (source unique back+front, run 060) ; **aucune** table barbare partagée → duplication back/front à l'origine du drift.

## Dépendances

- Aucune dépendance bloquante. Backend déjà recalibré et autoritatif.
- Pattern de référence : [run 060 (PvP capture preview)](./archive/060-feature-pvp-capture-duration-preview.md) — même mécanique de source unique shared + ré-export backend.

## Critère de fin (acceptance)

Automatisables (unit/static) :

- [ ] Le preview barbare affiche les valeurs de la spec 13 : `T1=30min`, `T2=1h`, `T3=1h30`, `T4=2h15`, `T5=3h` (ou format court cohérent avec le rendu PvP `XhYY`).
- [ ] La table barbare a **une seule source de vérité** dans `packages/shared/src/combat/capture-duration.ts` (à côté de `PVP_CAPTURE_DURATIONS_MS`) ; le backend la ré-exporte au lieu de la redéfinir localement ; le front la consomme au lieu de sa copie locale.
- [ ] `barbarianConquest.test.ts` asserte les **nouvelles** valeurs (plus aucune assertion `'12h'`/`'9h'`/`'6h'`/`'4h'`/`'2h'`).
- [ ] Parité base-duration : le preview affiche la durée **de base** (sans tempo), cohérent avec le preview PvP (le tempo n'est appliqué que backend via `TempoService`) — pas de double application.
- [ ] `yarn static-check` + `yarn test:pixi` + `yarn test:backend` verts.

Visuel (checklist Kelvin IG, ≤5) :

- [ ] Clic sur un village barbare T5 → panneau d'info affiche « Fenêtre de capture ~3h » (plus « 12h »).
- [ ] Clic sur un T1 → « ~30min ».

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Skills : `bftc-tests-policy`, `bftc-qa`
- **Review indépendante requise** : oui — touche backend + frontend + shared et consolide un invariant durable (source unique des durées de capture). Aligner sans casser la parité base-duration/tempo du preview.

## Décomposition initiale

_(Lead étape 3 — tâches ≤5 fichiers)_

- **T1 — shared** : ajouter la table barbare canonique dans `packages/shared/src/combat/capture-duration.ts` (`BARBARIAN_CAPTURE_DURATIONS_MS` + helper `getBarbarianCaptureDurationMs`/`...Label` alignés sur le style PvP `XhYY`) + specs unitaires ; rebuild `@battleforthecrown/shared`.
- **T2 — backend** : `modules/combat/capture-duration.ts` ré-exporte la table shared au lieu de la redéfinir ; vérifier `getCaptureDurationMs` (barbare) inchangé fonctionnellement.
- **T3 — front** : `features/world/barbarianConquest.ts` consomme le helper shared (supprimer la copie locale obsolète) ; garder l'API publique (`getBarbarianCaptureDurationLabel`) pour ne pas casser `AttackDetailModal`.
- **T4 — front tests** : réécrire `barbarianConquest.test.ts` sur les nouvelles valeurs + corriger le commentaire trompeur ; vérifier la non-régression `AttackDetailModal`.
- **T5 — docs** : aucune mise à jour de spec attendue (spec 13 déjà correcte) ; vérifier l'impact doc (source unique). Consigner en cas de note technique data-model.

## Points d'attention

- **Parité base-duration vs tempo** : le preview front doit afficher la durée **de base** (comme le PvP). Le tempo monde n'est appliqué que backend (`getCaptureDurationMs` via `TempoService`) — ne pas ré-appliquer côté front.
- **API publique front** : `getBarbarianCaptureDurationLabel` est consommé par `AttackDetailModal` (badge « Fenêtre de capture ») ; conserver la signature pour un diff minimal.
- **Format d'affichage** : le PvP rend `XhYY` (`2h15`, `3h`) via `getPvpCaptureDurationLabel` ; aligner le barbare sur ce format (T4=`2h15`) plutôt que l'ancien `2.3h` de `formatBarbarianCaptureDuration`.
- **Test verrouillant le bug** : `barbarianConquest.test.ts` fige les mauvaises valeurs — c'est un test à corriger, pas une régression à préserver.
- **Ré-export backend** : suivre exactement le pattern `export { PVP_CAPTURE_DURATIONS_MS }` déjà en place pour ne pas dupliquer une 3e copie.

## Progress

_(Vide au démarrage. Rempli pendant le run, supprimé à l'archive.)_

## Décisions prises

_(Vide au démarrage. Rempli pendant le run, supprimé à l'archive.)_

## Rapport final

### Acceptance & QA

_(Vide au démarrage. Rempli en fin de run.)_
