# Run #092 — barbarian-capture-duration-preview

> **Statut** : DONE
> **Démarré** : 2026-07-04
> **Terminé** : 2026-07-04

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

- [ ] Le preview barbare réutilise le **formatter partagé PvP** (`getPvpCaptureDurationLabel`, format `XhYY`) → `T1=0h30`, `T2=1h`, `T3=1h30`, `T4=2h15`, `T5=3h`. **Convention unique** : la checklist ET `barbarianConquest.test.ts` assertent exactement cette sortie, pas de libellé divergent type `30min`.
- [ ] La table barbare a **une seule source de vérité** dans `packages/shared/src/combat/capture-duration.ts` (à côté de `PVP_CAPTURE_DURATIONS_MS`) ; le backend la ré-exporte au lieu de la redéfinir localement ; le front la consomme au lieu de sa copie locale.
- [ ] `barbarianConquest.test.ts` asserte les **nouvelles** valeurs (plus aucune assertion `'12h'`/`'9h'`/`'6h'`/`'4h'`/`'2h'`).
- [ ] Parité base-duration : le preview affiche la durée **de base** (sans tempo), cohérent avec le preview PvP (le tempo n'est appliqué que backend via `TempoService`) — pas de double application.
- [ ] `yarn static-check` + `yarn test:pixi` + `yarn test:backend` verts.

Visuel (checklist Kelvin IG, ≤5) :

- [ ] Clic sur un village barbare T5 → panneau d'info affiche « Fenêtre de capture 3h » (plus « 12h »).
- [ ] Clic sur un T1 → « 0h30 » (format `XhYY`, plus « 2h »).

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Skills : `bftc-tests-policy`, `bftc-qa`
- **Review indépendante requise** : oui — touche backend + frontend + shared et consolide un invariant durable (source unique des durées de capture). Aligner sans casser la parité base-duration/tempo du preview.

## Rapport final

Table barbare promue source unique dans `packages/shared/src/combat/capture-duration.ts` (`BARBARIAN_CAPTURE_DURATIONS_MS` + `getBarbarianCaptureDurationMs`/`...Label`, format `XhYY`), backend ré-exporte, front devient thin re-export — pattern PvP run 060 appliqué. Drift preview corrigé (T1 `2h`→`0h30` … T5 `12h`→`3h`). `Record<string, number>` conservé (indexable par le backend `[tier ?? '']`) : trade-off typage assumé (mineur review, non bloquant).

### Acceptance & QA

**Critères d'acceptance vérifiés** :

- [x] Preview réutilise le formatter partagé `XhYY` (T1=`0h30`, T2=`1h`, T3=`1h30`, T4=`2h15`, T5=`3h`) — `yarn workspace battleforthecrown-pixi test --run barbarianConquest capture-duration` → 26/26 (dont `barbarianConquest.test.ts` + `capture-duration.spec.ts` shared).
- [x] Table barbare = source unique dans `packages/shared` ; backend ré-exporte ; front consomme — `grep -rn "BARBARIAN_CAPTURE_DURATION_HOURS" battleforthecrown-pixi/src` → 0 (copie locale supprimée) ; backend `capture-duration.ts:11` `export { BARBARIAN_CAPTURE_DURATIONS_MS, PVP_CAPTURE_DURATIONS_MS }`.
- [x] `barbarianConquest.test.ts` asserte les nouvelles valeurs, plus aucune assertion `12h/9h/6h/4h/2h` — visuel diff + test vert.
- [x] Parité base-duration (tempo appliqué backend uniquement, preview = base) — thin re-export shared, aucun `TempoService` côté front → `grep -rn "TempoService" battleforthecrown-pixi/src/features/world/barbarianConquest.ts` → 0.
- [x] `yarn static-check` + `yarn test:pixi` + `yarn test:backend` (ciblé capture-duration 4/4) verts.

**Review indépendante** : Déclenchée (raison : critère a — touche backend ET frontend). Verdict **GO** (0 bloquant, 0 majeur, 2 mineurs traçabilité non correctifs).

**Tests automatisés** : `test --run barbarianConquest capture-duration threatEstimate` → 4 fichiers, 26/26 ; backend `test capture-duration` → 4/4. `yarn static-check` → vert.

**Smokes lancés** : Non lancés localement, raison : diff backend `src/` = ré-export type-only d'une constante shared, `getCaptureDurationMs` inchangé fonctionnellement (couvert par unit backend) ; full smoke couvert par CI PR.

**Smokes ajoutés/modifiés** : Aucun, raison : pure logic déjà couverte par unit (shared + backend spec).

**QA fonctionnelle agent** : Non nécessaire — helper d'affichage pur, pas d'endpoint/worker/event touché.

**Tests IG à faire par le user** :

- [ ] Clic sur un village barbare T5 → panneau d'info « Fenêtre de capture 3h » (plus « 12h »).
- [ ] Clic sur un T1 → « 0h30 » (format `XhYY`, plus « 2h »).
