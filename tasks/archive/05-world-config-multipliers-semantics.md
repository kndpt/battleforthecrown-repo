# 05 — WorldConfig multipliers : sémantique inversée selon le champ

**Sévérité** : 🟡 Majeure
**Workspace(s)** : `packages/shared`, `battleforthecrown-backend`, `battleforthecrown-pixi`
**Tags** : world-config, dx, footgun
**Statut** : ✅ Résolu 2026-05-08

## Résolution

Stratégie retenue : **option A + finir C**. `multipliers` éclaté en deux sous-objets dont les noms portent la sémantique :

- `gameSpeed: { construction, training, travel }` — diviseurs de temps. Valeur > 1 ⇒ plus rapide.
- `economy: { productionRate }` — amplificateur du taux. Valeur > 1 ⇒ plus de ressources/min.

Migration JSON Prisma idempotente (`config - 'multipliers' || jsonb_build_object(...)`) appliquée aux mondes existants. Seed default + smoke fixture mis à jour.

Math inline du training (`recruit-troops.use-case.ts:135`) extrait dans `packages/shared/src/logic/training-time.ts` (`calculateTrainingTime`) — plus aucun callsite ne fait `time / speedMultiplier` à la main.

Pas de test pure-logic dédié supplémentaire : les invariants `multiplier=2 ⇒ time/2` et `productionRate=2 ⇒ rate*2` sont déjà couverts par `world-config.service.spec.ts` (`getCost` ligne 131, `getProductionRate` ligne 180, `getTravelTime` ligne 241), et la formule training vit maintenant dans un helper trivial de 8 lignes.

Touchés : 13 fichiers (3 shared, 5 backend, 4 pixi, 1 doc data-model, 1 doc smoke-tests + 1 nouvelle migration Prisma). Builds et 88 unit + 65 unit pixi + 10 smokes verts.

## Contexte

Trouvé en écrivant les smokes (ticket 02) : le `WorldConfig.multipliers` regroupe quatre champs qui n'ont pas la même sémantique mathématique. Trois sont des **diviseurs du temps** (multiplier élevé → action **plus rapide**), un est un **amplificateur du taux** (multiplier élevé → **plus** de ressources). Sans documentation, mon premier essai à 0.01 a multiplié les durations par 100×, pas divisé.

## État actuel

```ts
// packages/shared/src/world/schemas.ts
const SpeedMultipliersSchema = z.strictObject({
  construction: z.number().positive(),
  production:   z.number().positive(),  // amplificateur (rate × multiplier)
  training:     z.number().positive(),
  travel:       z.number().positive(),
});
```

Application dans le code :

| Champ | Formule (shared/logic) | Multiplier élevé = |
|---|---|---|
| `construction` | `time = baseTime / multiplier` (`building-cost.ts:63`) | construction **plus rapide** |
| `training` | `timePerUnitMs = unitCost.time / trainSpeedMultiplier × 1000` (`recruit-troops.use-case.ts:135`) | recrutement **plus rapide** |
| `travel` | `(distance × unitSpeed) / speedMultiplier` (`travel-time.ts:20`) | trajet **plus court** |
| `production` | `rate = baseRatePerMinute × speedMultiplier` (`production.ts:15`) | **plus** de ressources/min |

Trois champs divisent, un multiplie. Le nom du schema (`SpeedMultipliers`) suggère "multiplicateur de vitesse" (cohérent avec les 3 premiers, bizarre pour `production` où "vitesse de production" = quantité par unité de temps). Tous sont stockés dans le même objet `multipliers`.

Risques concrets observés :
- Quand on écrit un test, un seed, ou une config monde sur-mesure, on peut intuitivement écrire `multipliers.construction = 0.5` en pensant "moitié plus rapide" → en fait c'est **deux fois plus lent**.
- Pas de test automatisé qui catche un sens inversé : ça compile, ça run, juste les durations sont fausses.
- Au moment d'un balance pass gameplay (par ex. accélérer le tutoriel), le risque d'inversion est élevé.

## Pistes

### A. Renommer pour clarifier la sémantique

- `multipliers` → `speedMultipliers` (les 3 vitesses) + `productionMultiplier` séparé.
- Ou un objet `gameSpeed` plus explicite : `{ construction: 1, training: 1, travel: 1 }` + `economy: { productionRate: 1 }`.
- Avantage : le nom force le bon mental model.
- Coût : migration Zod schema + 1 migration Prisma sur le `World.config` JSON (write-replace) + ajustements pixi si lu côté front.

### B. Documenter en bloc dans le schema

- Ajouter un commentaire dense au-dessus de `SpeedMultipliersSchema` qui explicite la formule pour chaque champ et donne 2-3 exemples (1 = baseline, 2 = doublé, 0.5 = moitié).
- Avantage : zéro migration, signal au prochain dev qui touche.
- Risque : la doc rate plus facilement qu'un nom — quand l'agent IA écrit du code, il a toutes les chances de re-faire l'erreur.

### C. Helper sémantique au lieu de raw multipliers

- Wrapper côté shared : `gameDuration.collapse(baseTimeSeconds, config)` qui retourne le temps effectif. Le code applicatif ne touche plus jamais directement `multiplier × time` ou `time / multiplier`.
- Avantage : impossible de se tromper, tout est centralisé.
- Coût : refactor des 4 callsites identifiés.

### D. Statu quo

- On a vécu sans ce filet jusqu'ici. Les multipliers sont à 1 en prod (seed default), donc l'invariant n'a jamais été testé. Mais à la première variation, le piège revient.

## Question à trancher

Renommer (A), documenter en place (B), centraliser via helper (C), ou ne rien faire (D) ?

## Dimensions à valider en sortie

- Si A : `WorldConfigSchema` + seed SQL + `test/fixtures/smoke-world-config.ts` cohérents. `world.config` existant migré.
- Si B : commentaire JSDoc précis sur chaque champ + lien vers les 4 callsites.
- Si C : 4 callsites refactorés, plus aucun usage de `config.multipliers.*` hors du helper shared.
- Tests unitaires shared (logique pure) qui vérifient l'invariant attendu (ex: `multiplier=2 → time/2`).

## Tickets liés

- [02 — Smoke tests](./archive/02-smoke-tests-strategy.md) ✅ — c'est en écrivant ces smokes que le piège est apparu.
