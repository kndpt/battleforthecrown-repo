# 20 — `tsconfig` backend partiellement strict

**Statut** : ✅ Résolu le 2026-05-08
**Sévérité** : 🟠 Moyenne
**Workspace(s)** : `battleforthecrown-backend`, `battleforthecrown-pixi`
**Tags** : tooling, typing, qualité
**Origine** : découvert pendant la résolution du [ticket 09 (typage relâché)](./09-backend-relaxed-typing.md), volontairement laissé hors scope.

## Résolution

Option A retenue (full strict en une fois). Activation de `strict: true` dans :

- `battleforthecrown-backend/tsconfig.json` : remplace `strictNullChecks: true` + `noImplicitAny: false` + `strictBindCallApply: false`. Active aussi `noFallthroughCasesInSwitch: true`.
- `battleforthecrown-pixi/tsconfig.app.json` : ajout de `strict: true` (la convention `.claude/rules/conventions.md` l'imposait depuis le début, le tsconfig hérité du template Vite ne l'avait jamais activé).

**Backend** : 23 erreurs surfacées, fixées sans introduire de cast inline `as keyof typeof X` ni de `as any`. Trois patterns :

- **TS2564** (Property has no initializer) — DTOs et `@WebSocketServer() server: Server` : ajout de `!` (pattern Nest standard, le DI/décorateur initialise au runtime).
- **TS7053** (Element implicitly any when indexing typed Record by string) — résolus via **helpers shared** plutôt que casts dispersés :
  - `getBuildingPowerWeight` / `getUnitPowerWeight` (`packages/shared/src/power/weights.ts`) — utilisés par `power.service` et `crowns.service`.
  - `getUnitStats` (`packages/shared/src/army/unit.ts`) — utilisé par `combat/strategies/player-village.strategy` et `combat/loot/loot.manager`.
  - `getBuildingUnlockRequirement` (`packages/shared/src/village/buildings.ts`) — utilisé par `gameplay/upgrade-building.use-case`.
  - `typedEntries` / `typedKeys` (`packages/shared/src/utils/typed-record.ts`) — utility générique qui recouvre le narrowing perdu par `Object.entries` sur `Record<K, V>`. Encapsule le `as` une fois pour toutes.
- **TS18046** (`error` is `unknown` dans catch) — narrow via `error instanceof Error ? error.message : String(error)` dans les scripts admin.

Au passage, `combat.worker.ts:191` (pattern bizarre `Object.values().some((_, i) => Object.keys()[i]...)`) remplacé par `typedEntries().some(([k, v]) => ...)` — la modif était imposée par strict (`unitType: string | undefined`), j'ai pris la version propre plutôt qu'un cast.

**Pixi** : `yarn type-check` (tsc strict) passe directement sans aucune modif de code — le code était déjà clean. Tests pixi 65/65 verts.

ESLint `no-explicit-any: error` reste actif (ticket 09).

## Symptôme

Le `tsconfig.json` du backend n'active pas `strict: true` (ni `noImplicitAny: true`). Le pixi frontend non plus. Seul `packages/shared` est en `strict: true` (via `tsconfig.base.json`).

Conséquence : du code avec des types implicites `any` compile sans warning. Le filet ESLint `@typescript-eslint/no-explicit-any: error` (mis en place ticket 09) couvre les **casts explicites**, mais pas les inférences implicites.

## Localisation

`battleforthecrown-backend/tsconfig.json` :
```json
{
  "compilerOptions": {
    "strictNullChecks": true,
    "noImplicitAny": false,           // ← problème
    "strictBindCallApply": false,     // ← problème
    "noFallthroughCasesInSwitch": false
    // pas de `strict: true`
  }
}
```

`battleforthecrown-pixi/tsconfig.app.json` :
```json
{
  "compilerOptions": {
    "noUnusedLocals": true,
    "noUnusedParameters": true
    // pas de `strict: true`, pas de `noImplicitAny`, pas de `strictNullChecks`
  }
}
```

`tsconfig.base.json` (utilisé par shared uniquement) :
```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

## Détail technique

`strict: true` active 8 flags : `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `noImplicitThis`, `useUnknownInCatchVariables`, `alwaysStrict`.

État actuel backend :
- ✅ `strictNullChecks` (filet `null`/`undefined`).
- ❌ `noImplicitAny` : un paramètre / variable sans annotation ni inférence claire devient `any` silencieusement.
- ❌ `strictBindCallApply` : `func.call(...)` n'est pas type-checké.
- ❌ Les autres flags `strict.*`.

Le ticket 09 mentionnait dans ses dimensions de sortie : *"Build TypeScript en mode strict (`--noImplicitAny`) sans warning."* Cette ligne n'a pas pu être validée car le passage à `strict: true` n'est pas trivial — beaucoup de code existant compile en mode lâche.

Pour le frontend Pixi, l'absence de strict est plus surprenant car la convention `.claude/rules/conventions.md` précise *"TypeScript strict partout. Pas de `any` pour faire taire le compilateur"*.

## Impact

- **Erreurs typage masquées** : un paramètre de fonction sans type peut accepter n'importe quoi, créant des trous de sécurité au compile-time qui ne sont pas signalés au refacto.
- **Filet ESLint incomplet** : `no-explicit-any` détecte `: any` ou `as any`, mais pas `function f(x) {}` (où `x: any` implicite).
- **Convention non appliquée** côté pixi (cf. `.claude/rules/conventions.md`).
- **Refacto risqué** : sans strict, renommer un type / extraire une fonction peut introduire des `any` implicites silencieux.

## Contexte

Configuration historique probablement héritée d'une init NestJS minimale (qui ne met pas `strict: true` par défaut). Le pixi a hérité du même choix via le template Vite.

Le ticket 09 a fixé la majorité des problèmes de typage observables (`as any`, `Record<string, number>`, frontières JSON), mais a laissé le `tsconfig` tel quel pour ne pas mélanger les chantiers — passer à strict révélera potentiellement plusieurs dizaines de spots à corriger.

## Pistes à explorer

### A. Activation full strict en une fois

- `"strict": true` dans `tsconfig.json` backend + `tsconfig.app.json` pixi.
- Build → liste exhaustive des erreurs.
- Corriger en un gros commit ou éclater par module.
- Avantage : une seule décision, pas d'état intermédiaire ambigu.
- Risque : volume potentiellement gros, blocage si certaines erreurs sont structurelles (ex : libs tierces sans typage strict).

### B. Activation flag par flag

- D'abord `noImplicitAny: true` (le plus payant).
- Puis `strictBindCallApply`, `strictFunctionTypes`, etc.
- Permet de mesurer l'impact incrémentalement.

### C. Isoler les modules nouveaux en strict

- Garder `tsconfig.json` lâche, créer `tsconfig.strict.json` qui étend et active strict, l'appliquer sur les nouveaux modules via `references`.
- Compliqué à maintenir, peu recommandé.

### D. Lint au lieu de tsconfig

- Ajouter `@typescript-eslint/no-implicit-any` (en plus de `no-explicit-any`).
- Avantage : plus modulaire, plus simple à roll-out.
- Inconvénient : ESLint est plus lent que tsc, moins exhaustif.

## Dimensions à valider en sortie

- `strict: true` activé dans `tsconfig.json` backend (ou flag par flag, au choix).
- `tsconfig.app.json` pixi aligné sur la convention `.claude/rules/conventions.md`.
- Build TypeScript des 3 workspaces sans warning.
- Tests passants (les fixtures de tests peuvent nécessiter ajustements — cf. exemples ticket 09).
- ESLint `no-explicit-any: error` reste actif (couvre les casts explicites).

## Tickets liés

- [09 — Typage relâché backend](./09-backend-relaxed-typing.md) — origine ; les `as any` ont été fixés, mais le tsconfig reste à durcir.
- [19 — Enums Prisma vs shared](./19-prisma-shared-enum-misalignment.md) — à résoudre **avant** ce ticket si possible : sans alignement enum, `noImplicitAny` lèvera sur les sites de cast existants.
