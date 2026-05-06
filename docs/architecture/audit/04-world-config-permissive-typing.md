# 04 — `WorldConfigDto` typé en `[key: string]: unknown` côté frontend, sans validation runtime

**Sévérité** : 🔴 Critique
**Workspace(s)** : cross-workspace (`battleforthecrown-pixi` ↔ `battleforthecrown-backend`)
**Tags** : typing, contract-drift, runtime-validation

## Symptôme

Le frontend type la config monde reçue du backend avec un type ouvert, sans validation runtime. Si le backend modifie ou retire un champ, le frontend continue de compiler sans erreur — et peut crasher au runtime sur une lecture `worldConfig.multipliers.construction` devenue `undefined`.

## Localisation

`battleforthecrown-pixi/src/api/queries.ts:471-475` (lignes selon rapport cross-workspace) :

```ts
export interface WorldConfigDto {
  multipliers?: { construction: number; production: number; training: number };
  combat?: { travelSpeed: number; [key: string]: unknown };
  [key: string]: unknown;
}
```

Côté backend, `WorldConfigService.mergeWithDefaults()` (`src/modules/world/world-config.service.ts:65-79`) applique des valeurs par défaut, mais retourne un `Record<string, unknown>` JSON-équivalent (champ `World.config: Json` dans Prisma).

## Détail technique

Le `world.config` Prisma est un champ JSON non typé. Le backend assemble la config en mémoire via `WorldConfigService` (~20 méthodes) puis la sérialise. Le frontend la consomme via `useWorldConfigQuery()` avec ce type permissif.

Aucun parsing runtime (Zod, io-ts, etc.) ne valide la structure côté front. Les utilisations frontend supposent silencieusement que `multipliers` existe :

- `BuildingDetailModal.tsx:68-75` — appelle `calculateBuildingCost(..., constructionMultiplier)` où `constructionMultiplier = worldConfig?.multipliers?.construction ?? 1`. Le fallback masque silencieusement un champ absent.
- D'autres lieux probables (à auditer).

## Impact

- **Drift silencieux** : ajouter/retirer un champ côté back ne déclenche aucune erreur tant qu'on ne lit pas le champ qui change. Le bug peut surgir longtemps après le déploiement, dans un flow rarement testé.
- **Affichage faux** : le pattern `?.field ?? defaultValue` masque l'absence du champ, faisant afficher des valeurs par défaut au joueur sans signal qu'on est dans un état dégradé.
- **Cohérence avec server-authoritative** : on s'autorise à recalculer des coûts côté front pour preview UI ([cf BuildingDetailModal](../audit/04-world-config-permissive-typing.md)), avec une formule shared. Si la config drift, le preview ment au joueur.

## Contexte

Le champ `world.config` en JSON était probablement choisi pour permettre des mondes hétérogènes (différentes vitesses, paramètres) sans migration DB à chaque ajustement. Le coût de cette flexibilité est l'absence de typage strict bout-en-bout.

## Pistes à explorer

- Définir un schéma Zod (ou équivalent) **dans `packages/shared`** pour `WorldConfig`, partagé back ET front. Le backend valide à l'insertion (admin / seeding), le frontend valide à la réception.
- Plutôt qu'un champ JSON, exploser la config en colonnes typées Prisma (rigide, mais explicite et auto-validé).
- Garder le JSON mais imposer un parser Zod en sortie de `useWorldConfigQuery()` — toute incohérence remonte en erreur React Query.
- Versionner la config (`config.version: number`) pour gérer les migrations.

## Décision validée

(2026-05-06, par l'utilisateur)

**Type strict via schéma Zod défini dans `packages/shared`**. Le champ `world.config: Json` côté Prisma reste (flexibilité conservée), mais :

- Un schéma Zod (par exemple `WorldConfigSchema` dans `packages/shared/src/world/schemas.ts`) définit la forme attendue.
- Côté backend, `WorldConfigService.mergeWithDefaults()` retourne un type inféré (`z.infer<typeof WorldConfigSchema>`), validé à la sortie.
- Côté frontend, `useWorldConfigQuery()` valide la response via `.parse()` à la réception. En cas d'incohérence, on remonte une erreur claire plutôt qu'un fallback silencieux.
- L'interface `WorldConfigDto` permissive (`[key: string]: unknown`) est remplacée par le type inféré du schéma.

L'agent suivant doit **planifier l'implémentation** : placement exact du schéma dans shared, points de validation (entrée DB, sortie service back, sortie query front), gestion des champs futurs (versioning ? défauts via schéma ?).

## Tickets liés

- [06 — God services backend](./06-backend-god-services.md) — `WorldConfigService` mélange config + calculs ; le découpage de ce service intégrera le schéma Zod comme contrat formel.
- [09 — typage relâché backend](./09-backend-relaxed-typing.md) — `getCrownsConfig: Promise<any>` dans le même service.

## Dimensions à valider en sortie

- La forme de `WorldConfig` est définie dans `packages/shared` et utilisée par les deux côtés.
- Toute réception de la config côté front passe par un validateur runtime (Zod ou équivalent).
- Un changement de structure côté back déclenche soit une erreur de compilation côté front (si le type change), soit une erreur runtime claire (si la donnée DB est out-of-sync) — jamais un fallback silencieux.
