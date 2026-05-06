# 19 — Enums Prisma vs unions shared : casts récurrents aux frontières

**Sévérité** : 🟠 Moyenne
**Workspace(s)** : `battleforthecrown-backend`, `packages/shared`
**Tags** : typing, enum, prisma, drift
**Origine** : découvert pendant la résolution du [ticket 09 (typage relâché)](./09-backend-relaxed-typing.md), volontairement laissé hors scope.

## Symptôme

Plusieurs enums sont définis **deux fois** : une fois dans `prisma/schema.prisma` (généré dans `@prisma/client` comme un enum nominal) et une fois dans `packages/shared/src/<domain>/types.ts` (union de literals TypeScript). Les deux ont les mêmes valeurs mais TypeScript les considère comme **deux types distincts**, ce qui force des casts à chaque frontière Prisma → métier.

## Localisation

D'après le code observé au 2026-05-06 :

| Enum Prisma | Type shared | Sites de cast `as` |
|---|---|---|
| `VillageStrategy` (`schema.prisma:353`) | `VillageStrategyType` (`shared/village/strategy.ts:3`) | `combat.service.ts:97`, `combat.worker.ts:380, 425, 458`, `resources.service.ts:192`, `strategy/village-strategy.service.ts:86, 213` |
| `TargetKind` (probable, à confirmer) | `TargetKind` (`shared/combat/dtos.ts:1`) | À auditer |
| `ExpeditionStatus` (probable, à confirmer) | `ExpeditionStatus` (`shared/combat/dtos.ts:8`) | À auditer |
| `WorldRole` | (à vérifier si dupliqué côté shared) | À auditer |

Pour chaque cast typique :
```typescript
// Prisma renvoie `string` (ou enum Prisma `VillageStrategy`), shared attend `VillageStrategyType`
const strategy = villageStrategyConfig.strategy as VillageStrategyType;
```

## Détail technique

Prisma génère ses enums dans le client TypeScript généré (`@prisma/client`). Côté shared, on a des unions de string literals identiques (`'FORTRESS' | 'RAIDERS' | 'ECONOMIC' | 'BALANCED'`).

Bien que les valeurs runtime soient identiques, TypeScript ne les unifie pas — donc :
- Une valeur `Prisma.VillageStrategy` n'est pas assignable à `VillageStrategyType` sans cast.
- Toute fonction shared qui prend un `VillageStrategyType` exige un cast aux call-sites backend.

Trois enums sont concernés au minimum (`VillageStrategy`, `TargetKind`, `ExpeditionStatus`). À auditer pour confirmer la liste complète.

## Impact

- **Casts disséminés** : ~7 sites identifiés pour `VillageStrategy` seul. Chaque cast est un trou potentiel si une valeur invalide est insérée en DB sans guard.
- **Risque de drift de valeurs** : si un enum Prisma ajoute une variante (`MIGRATION` par exemple) sans mise à jour de shared, le cast acceptera silencieusement la nouvelle valeur — la fonction shared retournera un comportement par défaut sans erreur compile.
- **Cognitive load** : un nouveau contributeur doit comprendre pourquoi deux types existent pour la même chose, et lequel est canonique.
- **Empêche le full strict TypeScript** : les casts ne lèvent pas en `noImplicitAny: true` mais rendent l'audit visuel plus pénible (cf. [ticket 20](./20-backend-tsconfig-strict-full.md)).

## Contexte

Le ticket 09 (typage relâché) a fixé les casts `as Record<string, number>` et les `as any` dans le combat backend. Mais les `as VillageStrategyType` ont été laissés intentionnellement hors scope car ils relèvent d'un autre problème : la double définition d'enums entre Prisma et shared.

Lors de la résolution du ticket 09, on a observé que ces casts ne sont pas des accidents isolés mais un pattern systématique aux frontières DB ↔ logique métier shared.

## Pistes à explorer

### A. Source de vérité unique côté shared

- Définir l'enum dans `packages/shared/src/<domain>/types.ts` (union de literals + objet const).
- **Importer** le type shared dans `prisma/schema.prisma` via une mécanique externe (pas natif Prisma — il faudrait un script de génération qui synchronise).
- Compliqué techniquement (Prisma ne lit pas du TypeScript).

### B. Source de vérité unique côté Prisma

- Supprimer la définition shared, importer directement depuis `@prisma/client` dans le code shared.
- Problème : `packages/shared` ne devrait pas dépendre du client Prisma (qui est backend-only). Le frontend Pixi consomme aussi shared sans avoir Prisma.

### C. Helpers de conversion typés (`assertVillageStrategy`)

- Garder les deux définitions, ajouter un helper qui valide et narrow :
  ```typescript
  function asVillageStrategy(s: string): VillageStrategyType {
    if (!VILLAGE_STRATEGIES.includes(s)) throw new Error(`Invalid: ${s}`);
    return s;
  }
  ```
- Remplacer tous les `as VillageStrategyType` par `asVillageStrategy(...)`. Coût : runtime check à chaque conversion (négligeable), mais sécurité réelle.

### D. Type-only re-export

- Dans `packages/shared/src/village/strategy.ts`, déclarer le type comme `export type VillageStrategyType = 'FORTRESS' | ...` ET ajouter un commentaire / convention qui mandate l'identité exacte avec l'enum Prisma.
- Tester l'identité au build via un `satisfies` côté backend dans un fichier dédié (`prisma-shared-alignment.ts`).

### E. Génération Prisma → shared

- Script `prisma generate` étendu pour produire un fichier shared `from-prisma.ts` avec les enums.
- Reasonably idempotent, mais ajoute de la complexité au build pipeline.

## Dimensions à valider en sortie

- Décision tranchée sur l'option (A/B/C/D/E ou hybride).
- Liste exhaustive des enums concernés dressée (audit complet, pas juste les 3 identifiés ici).
- Tous les `as <SharedEnumType>` supprimés ou remplacés par helpers typés.
- Test d'intégration ou type-level test qui détecte une divergence Prisma ↔ shared au build.

## Tickets liés

- [09 — Typage relâché backend](./09-backend-relaxed-typing.md) — origine de la découverte ; les `as Record<string, number>` ont été fixés mais les `as VillageStrategyType` ont été reportés ici.
- [20 — `tsconfig` strict full](./20-backend-tsconfig-strict-full.md) — le filet ESLint actuel ne détecte pas ces casts ; activer `noImplicitAny` ne suffira pas, il faudra aussi des règles plus strictes ou ce ticket résolu d'abord.
- [04 — World config permissive typing](./04-world-config-permissive-typing.md) — résolu par parsing Zod du JSON ; pour les enums Prisma natifs, le parsing Zod n'est pas applicable (Prisma garantit déjà la valeur en lecture).
